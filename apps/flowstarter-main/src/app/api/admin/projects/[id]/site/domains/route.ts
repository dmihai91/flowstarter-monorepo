import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { CloudflareClient, CloudflareApiError } from '@/lib/hosting/cloudflare';

/**
 * POST /api/admin/projects/[id]/site/domains
 *
 * Add a custom domain to a workspace's site. Body:
 *   { domain: string, primary?: boolean }
 *
 * Behavior:
 *   - Validates domain shape
 *   - Adds row to workspace_hosts (is_primary toggled appropriately).
 *     If `primary=true`, demotes any existing primary into non-primary.
 *   - If CLOUDFLARE_API_TOKEN is set AND we manage the zone for this domain,
 *     upserts an A record pointing at the hosting_servers.ipv4
 *   - Tracks the Cloudflare record ID in workspaces.cloudflare_record_ids
 *
 * DELETE /api/admin/projects/[id]/site/domains?domain=xxx
 *   Removes the domain from workspace_hosts. Cleans up Cloudflare DNS if managed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    domain?: unknown;
    primary?: unknown;
  };

  const domain = sanitizeDomain(body.domain);
  if (!domain) {
    return NextResponse.json(
      { error: 'domain is required and must be a valid hostname' },
      { status: 400 }
    );
  }
  const isPrimary = body.primary === true;

  const supabase = createSupabaseServiceRoleClient();

  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .select(
      `id, slug, hosting_server_id, cloudflare_zone_id, cloudflare_record_ids`
    )
    .eq('id', workspaceId)
    .maybeSingle();
  if (wsErr) {
    return NextResponse.json({ error: wsErr.message }, { status: 500 });
  }
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  if (!workspace.hosting_server_id) {
    return NextResponse.json(
      {
        error:
          'Workspace has no allocated server yet. Allocate first via /api/admin/projects/[id]/site',
      },
      { status: 404 }
    );
  }

  const { data: existingHosts, error: hostsErr } = await supabase
    .from('workspace_hosts')
    .select('hostname, is_primary')
    .eq('workspace_id', workspaceId);
  if (hostsErr) {
    return NextResponse.json({ error: hostsErr.message }, { status: 500 });
  }

  if ((existingHosts ?? []).some((h) => h.hostname === domain)) {
    return NextResponse.json(
      { error: `Domain ${domain} is already attached to this workspace` },
      { status: 409 }
    );
  }

  // If the new domain is primary, demote any existing primary first.
  if (isPrimary) {
    const currentPrimary = (existingHosts ?? []).find((h) => h.is_primary);
    if (currentPrimary && currentPrimary.hostname !== domain) {
      const { error: demoteErr } = await supabase
        .from('workspace_hosts')
        .update({ is_primary: false })
        .eq('workspace_id', workspaceId)
        .eq('hostname', currentPrimary.hostname);
      if (demoteErr) {
        return NextResponse.json({ error: demoteErr.message }, { status: 500 });
      }
    }
  }

  // Best-effort DNS upsert.
  let dnsResult: { recordId: string; zoneId: string } | null = null;
  let dnsError: string | null = null;

  if (process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const { data: server } = await supabase
        .from('hosting_servers')
        .select('ipv4')
        .eq('id', workspace.hosting_server_id)
        .maybeSingle();

      if (server?.ipv4) {
        const cf = new CloudflareClient({
          token: process.env.CLOUDFLARE_API_TOKEN,
        });
        const zone = await findManagedZone(cf, domain);
        if (zone) {
          const record = await cf.upsertRecord({
            zoneId: zone.id,
            type: 'A',
            name: domain,
            content: String(server.ipv4),
            ttl: 300,
            proxied: false,
            comment: `flowstarter site ${workspace.slug}`,
          });
          dnsResult = { recordId: record.id, zoneId: zone.id };
        } else {
          dnsError = `No managed Cloudflare zone for ${domain}; client must point DNS manually`;
        }
      } else {
        dnsError = 'Server has no ipv4 yet';
      }
    } catch (e) {
      if (e instanceof CloudflareApiError) {
        dnsError = `Cloudflare error: ${e.errors
          .map((x) => x.message)
          .join('; ')}`;
      } else {
        dnsError = e instanceof Error ? e.message : 'DNS upsert failed';
      }
    }
  } else {
    dnsError = 'CLOUDFLARE_API_TOKEN not configured; DNS not automated';
  }

  // Insert the host row.
  const { error: insertErr } = await supabase.from('workspace_hosts').insert({
    workspace_id: workspaceId,
    hostname: domain,
    is_primary: isPrimary,
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Track CF record ID on the workspace.
  if (dnsResult) {
    const existingMap = ((workspace.cloudflare_record_ids as Record<
      string,
      unknown
    >) ?? {}) as Record<string, { recordId: string; zoneId: string }>;
    existingMap[domain] = dnsResult;
    await supabase
      .from('workspaces')
      .update({
        cloudflare_record_ids: existingMap,
        cloudflare_zone_id: workspace.cloudflare_zone_id ?? dnsResult.zoneId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId);
  }

  const { data: updatedHosts } = await supabase
    .from('workspace_hosts')
    .select('hostname, is_primary')
    .eq('workspace_id', workspaceId);

  return NextResponse.json({
    workspaceId,
    hosts: updatedHosts ?? [],
    domain,
    dns: dnsResult,
    dnsError,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const { id: workspaceId } = await params;
  const url = new URL(req.url);
  const domainParam = url.searchParams.get('domain');
  const domain = sanitizeDomain(domainParam);
  if (!domain) {
    return NextResponse.json(
      { error: 'domain query param is required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, cloudflare_record_ids')
    .eq('id', workspaceId)
    .maybeSingle();
  if (wsErr || !workspace) {
    return NextResponse.json(
      { error: wsErr?.message ?? 'Workspace not found' },
      { status: wsErr ? 500 : 404 }
    );
  }

  const recordIds = (workspace.cloudflare_record_ids ?? {}) as Record<
    string,
    { recordId: string; zoneId: string }
  >;
  const cfRef = recordIds[domain];
  let dnsError: string | null = null;
  if (cfRef && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      const cf = new CloudflareClient({
        token: process.env.CLOUDFLARE_API_TOKEN,
      });
      await cf.deleteRecord(cfRef.zoneId, cfRef.recordId);
    } catch (e) {
      dnsError = e instanceof Error ? e.message : 'DNS delete failed';
    }
  }

  const { error: deleteErr } = await supabase
    .from('workspace_hosts')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('hostname', domain);
  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  const newRecordIds = { ...recordIds };
  delete newRecordIds[domain];
  await supabase
    .from('workspaces')
    .update({
      cloudflare_record_ids: newRecordIds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId);

  const { data: updatedHosts } = await supabase
    .from('workspace_hosts')
    .select('hostname, is_primary')
    .eq('workspace_id', workspaceId);

  return NextResponse.json({
    workspaceId,
    hosts: updatedHosts ?? [],
    domain,
    dnsError,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitizeDomain(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
      trimmed
    )
  ) {
    return null;
  }
  if (trimmed.length > 253) return null;
  return trimmed;
}

async function findManagedZone(
  cf: CloudflareClient,
  domain: string
): Promise<{ id: string; name: string } | null> {
  const labels = domain.split('.');
  for (let i = 0; i + 1 < labels.length; i++) {
    const candidate = labels.slice(i).join('.');
    try {
      const zone = await cf.findZoneByName(candidate);
      if (zone) return { id: zone.id, name: zone.name };
    } catch {
      // ignore per-attempt failures
    }
  }
  return null;
}
