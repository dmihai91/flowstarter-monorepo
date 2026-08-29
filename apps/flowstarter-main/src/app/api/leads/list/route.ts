/**
 * GET /api/leads/list?workspaceId=xxx&status=new&limit=50
 * Lists leads for a workspace. Requires auth.
 *
 * PATCH /api/leads/list
 * Updates lead status/notes. Requires auth.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const GetLeadsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const PatchLeadSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  status: z
    .enum(['new', 'contacted', 'qualified', 'closed', 'spam'])
    .optional(),
  notes: z.string().max(5000).optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = GetLeadsSchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { workspaceId, status, limit } = result.data;

  // The workspace id comes from the query string and the query below runs as
  // the service role, so authorization has to happen against that exact id.
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else {
    query = query.neq('status', 'spam');
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data || [] });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = PatchLeadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { leadId, status, notes } = result.data;
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (notes !== undefined) update.notes = notes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  // A lead id alone said nothing about who may edit it. Resolve the workspace
  // it belongs to, authorize against that, and scope the write to it so the
  // row cannot move workspace between the check and the update.
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('workspace_id')
    .eq('id', leadId)
    .maybeSingle();
  if (leadError) throw leadError;
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const access = await requireWorkspaceAccess(lead.workspace_id);
  if (!access.authorized) return access.response;

  const { error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId)
    .eq('workspace_id', lead.workspace_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
