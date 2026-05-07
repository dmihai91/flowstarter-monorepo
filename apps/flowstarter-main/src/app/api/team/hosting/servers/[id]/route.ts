import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { hetznerFromEnv, HetznerApiError } from '@/lib/hosting/hetzner';

/**
 * GET /api/team/hosting/servers/[id]
 *
 * Returns the hosting_servers row + (if hetzner_server_id is set) a fresh
 * status snapshot pulled from the Hetzner Cloud API. Useful for the admin
 * UI to poll while a server is provisioning.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: row, error } = await supabase
    .from('hosting_servers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Hosting server not found' }, { status: 404 });
  }

  let hetznerSnapshot: unknown = null;
  if (
    row.hetzner_server_id &&
    process.env.HETZNER_API_TOKEN &&
    row.status !== 'decommissioned'
  ) {
    try {
      const client = hetznerFromEnv();
      hetznerSnapshot = await client.getServer(row.hetzner_server_id);
    } catch (e) {
      hetznerSnapshot = {
        error:
          e instanceof HetznerApiError
            ? `${e.code}: ${e.message}`
            : e instanceof Error
              ? e.message
              : 'unknown',
      };
    }
  }

  return NextResponse.json({ server: row, hetzner: hetznerSnapshot });
}

/**
 * DELETE /api/team/hosting/servers/[id]
 *
 * Soft-decommission: mark the row as 'decommissioned' and (if a
 * hetzner_server_id is present + force=true) delete the Hetzner server.
 *
 * Refuses if sites_count > 0 unless force=true.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === 'true';

  const supabase = createSupabaseServiceRoleClient();

  const { data: row, error } = await supabase
    .from('hosting_servers')
    .select('id, hetzner_server_id, status, sites_count')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Hosting server not found' }, { status: 404 });
  }
  if (row.status === 'decommissioned') {
    return NextResponse.json({ server: row, alreadyDecommissioned: true });
  }
  if (row.sites_count > 0 && !force) {
    return NextResponse.json(
      {
        error:
          `Server has ${row.sites_count} active sites. Migrate them or pass ?force=true.`,
      },
      { status: 409 }
    );
  }

  // Best-effort delete on Hetzner. If it fails, we still mark our row
  // as decommissioned so the UI doesn't keep showing it as live; the
  // operator can retry the Hetzner-side cleanup separately.
  let hetznerError: string | null = null;
  if (row.hetzner_server_id && process.env.HETZNER_API_TOKEN) {
    try {
      const client = hetznerFromEnv();
      await client.deleteServer(row.hetzner_server_id);
    } catch (e) {
      hetznerError =
        e instanceof HetznerApiError
          ? `${e.code}: ${e.message}`
          : e instanceof Error
            ? e.message
            : 'unknown';
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('hosting_servers')
    .update({
      status: 'decommissioned',
      decommissioned_at: new Date().toISOString(),
      status_detail: hetznerError
        ? `Decommissioned in DB; Hetzner delete error: ${hetznerError}`
        : null,
    })
    .eq('id', row.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ server: updated, hetznerError });
}
