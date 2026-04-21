import { isBuilding, isLive } from './team-project-status';

/** Minimal columns for aggregating team dashboard KPIs (no Clerk, no large blobs). */
export const TEAM_DASHBOARD_STATS_PROJECT_SELECT = `
  id,
  name,
  status,
  is_paid,
  setup_fee,
  monthly_fee,
  ai_credits_used,
  generation_cost_usd,
  created_at,
  updated_at
`.trim();

export type TeamDashboardStatsProjectRow = {
  id: string;
  name: string | null;
  status: string | null;
  is_paid: boolean | null;
  setup_fee: number | null;
  monthly_fee: number | null;
  ai_credits_used: number | null;
  generation_cost_usd: number | null;
  created_at: string;
  updated_at: string;
};

export type TeamDashboardRecentProject = {
  id: string;
  name: string | null;
  status: string | null;
  updated_at: string;
  created_at: string;
};

export type TeamDashboardStatsPayload = {
  totalProjects: number;
  draftCount: number;
  inProgressCount: number;
  liveCount: number;
  totalSetupFees: number;
  monthlyRevenue: number;
  paidCount: number;
  totalCredits: number;
  totalCostEur: number;
  sitesGenerated: number;
  recentProject: TeamDashboardRecentProject | null;
};

function activityTimestamp(row: TeamDashboardStatsProjectRow): number {
  const u = new Date(row.updated_at || 0).getTime();
  const c = new Date(row.created_at || 0).getTime();
  return Math.max(u, c);
}

/** Mirrors the previous client-side aggregation in `TeamProjectsStats`. */
export function computeTeamDashboardStats(
  rows: TeamDashboardStatsProjectRow[]
): TeamDashboardStatsPayload {
  let draftCount = 0;
  let inProgressCount = 0;
  let liveCount = 0;
  let totalSetupFees = 0;
  let monthlyRevenue = 0;
  let paidCount = 0;
  let totalCredits = 0;
  let totalCostEur = 0;
  let sitesGenerated = 0;
  let recentProject: TeamDashboardRecentProject | null = null;
  let recentTs = -1;

  for (const p of rows) {
    const st = p.status;
    if (isLive(st)) liveCount += 1;
    else if (isBuilding(st)) inProgressCount += 1;
    else draftCount += 1;

    totalSetupFees += p.setup_fee || 0;
    if (p.is_paid) {
      paidCount += 1;
      monthlyRevenue += p.monthly_fee || 0;
    }
    totalCredits += p.ai_credits_used || 0;
    const costUsd = p.generation_cost_usd || 0;
    totalCostEur += costUsd * 0.92;
    if (costUsd > 0) sitesGenerated += 1;

    const ts = activityTimestamp(p);
    if (ts >= recentTs) {
      recentTs = ts;
      recentProject = {
        id: p.id,
        name: p.name,
        status: p.status,
        updated_at: p.updated_at,
        created_at: p.created_at,
      };
    }
  }

  return {
    totalProjects: rows.length,
    draftCount,
    inProgressCount,
    liveCount,
    totalSetupFees,
    monthlyRevenue,
    paidCount,
    totalCredits,
    totalCostEur,
    sitesGenerated,
    recentProject,
  };
}
