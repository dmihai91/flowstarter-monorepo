import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  TEAM_DASHBOARD_STATS_PROJECT_SELECT,
  computeTeamDashboardStats,
  type TeamDashboardStatsProjectRow,
} from '@/lib/team-dashboard/team-dashboard-stats';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

async function resolveTeamRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  return (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
}

/**
 * GET /api/team/dashboard/stats
 *
 * Lightweight aggregates for the team dashboard KPI row. One narrow `projects`
 * query and no Clerk calls — loads in parallel with `/api/team/projects`.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveTeamRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createSupabaseServiceRoleClient();
  const { data: rows, error } = await db
    .from('projects')
    .select(TEAM_DASHBOARD_STATS_PROJECT_SELECT);

  if (error) {
    console.error('[team/dashboard/stats]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = computeTeamDashboardStats(
    (rows ?? []) as unknown as TeamDashboardStatsProjectRow[]
  );

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
    },
  });
}
