// @ts-nocheck
/**
 * GET /api/leads/list?projectId=xxx&status=new&limit=50
 * Lists leads for a project. Requires auth.
 * PATCH /api/leads/list — update lead status/notes
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

export async function GET(request: NextRequest) {
  await requireAuth();
  const projectId = request.nextUrl.searchParams.get('projectId');
  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from('leads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else {
    // Exclude spam by default
    query = query.neq('status', 'spam');
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get counts by status
  const { data: counts } = await supabase
    .rpc('get_lead_counts', { p_project_id: projectId });

  return NextResponse.json({ leads: data || [], counts: counts || [] });
}

export async function PATCH(request: NextRequest) {
  await requireAuth();
  const body = (await request.json()) as { leadId: string; status?: string; notes?: string };

  if (!body.leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.notes !== undefined) update.notes = body.notes;

  const { error } = await supabase.from('leads').update(update).eq('id', body.leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
