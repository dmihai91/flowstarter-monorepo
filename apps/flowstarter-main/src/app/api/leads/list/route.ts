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
import { requireAuth } from '@/lib/api-auth';
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
  await requireAuth();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const result = GetLeadsSchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    );
  }

  const { workspaceId, status, limit } = result.data;
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
  await requireAuth();

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
  const { error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
