import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

async function resolveRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  const claimRole = (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (claimRole) return claimRole;

  const user = await currentUser();
  return (
    user?.publicMetadata as { role?: string } | undefined
  )?.role?.toLowerCase();
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
  const callStatsRpc = db.rpc as unknown as (
    fn: string,
    params: { week_ago: string }
  ) => Promise<{
    data: {
      pending: number;
      urgent: number;
      in_progress: number;
      resolved_this_week: number;
    } | null;
    error: { message: string } | null;
  }>;

  // Single RPC call instead of 4 separate count queries
  const { data, error } = await callStatsRpc('get_client_request_stats', {
    week_ago: weekAgo,
  });

  if (error) {
    // Fallback to parallel queries if RPC doesn't exist yet
    console.warn(
      '[client-requests/stats] RPC not available, using fallback:',
      error.message
    );

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

    return NextResponse.json(
      {
        pending: pending.count ?? 0,
        urgent: urgent.count ?? 0,
        in_progress: inProgress.count ?? 0,
        resolved_this_week: resolvedThisWeek.count ?? 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
