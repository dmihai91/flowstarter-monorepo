import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { resolveUserRole } from '@/lib/api-auth';
import {
  TEAM_DASHBOARD_STATS_PROJECT_SELECT,
  computeTeamDashboardStats,
  type TeamDashboardStatsProjectRow,
} from '@/lib/team-dashboard/team-dashboard-stats';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

/**
 * GET /api/admin/dashboard/stats
 *
 * Lightweight aggregates for the team dashboard KPI row. One narrow `projects`
 * query and no Clerk calls — loads in parallel with `/api/admin/projects`.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveUserRole(userId);
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createSupabaseServiceRoleClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [projectsRes, tokensRes] = await Promise.all([
    db.from('workspaces').select(TEAM_DASHBOARD_STATS_PROJECT_SELECT),
    db
      .from('editor_sessions')
      .select('tokens_in, tokens_out')
      .gte('started_at', monthStart.toISOString()),
  ]);

  if (projectsRes.error) {
    console.error('[admin/dashboard/stats]', projectsRes.error);
    return NextResponse.json(
      { error: projectsRes.error.message },
      { status: 500 }
    );
  }

  const stats = computeTeamDashboardStats(
    (projectsRes.data ?? []) as unknown as TeamDashboardStatsProjectRow[]
  );

  // Token query failure is non-fatal — fall back to 0 rather than 500'ing the
  // whole dashboard. Logged for ops visibility.
  if (tokensRes.error) {
    console.warn(
      '[admin/dashboard/stats] token query failed:',
      tokensRes.error
    );
  } else {
    const sessionRows = tokensRes.data as Array<{
      tokens_in: number;
      tokens_out: number;
    }>;
    stats.aiTokensThisMonth = sessionRows.reduce(
      (sum, row) => sum + (row.tokens_in || 0) + (row.tokens_out || 0),
      0
    );
    stats.aiSessionsThisMonth = sessionRows.length;
  }

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
    },
  });
}
