/**
 * GET/PATCH /api/client/booking/[workspaceId]
 *
 * Per-tenant Cal.com booking URL. Intake seeds `workspaces.cal_com_url`; this
 * route lets the client view and update it. On save, the preview manifest is
 * re-injected so the next build/editor load shows their calendar — never a
 * shared Flowstarter booking link.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import {
  isValidCalComInput,
  resolveTenantCalComUrl,
} from '@/lib/flowstarter/cal-com';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { Json } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  calComUrl: z.string().max(400),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('cal_com_url')
    .eq('id', access.workspaceId)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: 'Could not load booking' },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({
    calComUrl: data.cal_com_url ?? '',
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid booking update' },
      { status: 400 }
    );
  }

  const raw = parsed.data.calComUrl;
  if (!isValidCalComInput(raw)) {
    return NextResponse.json(
      {
        error:
          'That does not look like a Cal.com link. Use https://cal.com/your-name or your-name/event.',
      },
      { status: 400 }
    );
  }

  const calComUrl = resolveTenantCalComUrl({ calComUrl: raw }) ?? null;
  const supabase = createSupabaseServiceRoleClient();

  const { error: updateError } = await supabase
    .from('workspaces')
    .update({ cal_com_url: calComUrl })
    .eq('id', access.workspaceId);
  if (updateError) {
    return NextResponse.json(
      { error: 'Could not save booking link' },
      { status: 500 }
    );
  }

  // Preview artifacts keep the blurred demo; the live embed is wired only on
  // the full-site build from workspaces.cal_com_url. Saving here is enough.
  await supabase.from('project_events').insert({
    workspace_id: access.workspaceId,
    kind: 'booking_cal_updated',
    actor: access.userId,
    payload: { calComUrl } as Json,
  });

  return NextResponse.json({ calComUrl: calComUrl ?? '' });
}
