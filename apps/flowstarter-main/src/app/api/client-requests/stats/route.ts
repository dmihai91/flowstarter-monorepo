import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

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

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createSupabaseServiceRoleClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [pending, urgent, inProgress, resolvedThisWeek] = await Promise.all([
    db
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    db
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('priority', 'urgent'),
    db
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    db
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', weekAgo),
  ]);

  return NextResponse.json({
    pending: pending.count ?? 0,
    urgent: urgent.count ?? 0,
    in_progress: inProgress.count ?? 0,
    resolved_this_week: resolvedThisWeek.count ?? 0,
  });
}
