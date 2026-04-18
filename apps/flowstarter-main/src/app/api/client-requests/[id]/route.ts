import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const patchSchema = z.object({
  status: z
    .enum(['pending', 'accepted', 'in_progress', 'resolved', 'rejected'])
    .optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().optional(),
  rejection_reason: z.string().min(10).optional(),
  workspace_session_id: z.string().optional(),
});

async function resolveRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  let role = (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (!role) {
    const user = await currentUser();
    role = (
      user?.publicMetadata as { role?: string } | undefined
    )?.role?.toLowerCase();
  }
  return role;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  // Lifecycle timestamps.
  if (parsed.data.status === 'accepted') {
    updates.accepted_at = new Date().toISOString();
    updates.assigned_to = userId;
  }
  if (parsed.data.status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }

  const db = createSupabaseServiceRoleClient();
  const { data, error } = await db
    .from('client_requests')
    .update(updates)
    .eq('id', id)
    .select('*, projects(name, client_name, client_email)')
    .single();

  if (error) {
    console.error('[client-requests] patch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
