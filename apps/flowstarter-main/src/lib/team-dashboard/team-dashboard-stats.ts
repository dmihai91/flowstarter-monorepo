import { deriveProjectStatus, isBuilding, isLive } from './team-project-status';

/**
 * Minimal columns for aggregating team dashboard KPIs from workspaces.
 * Stays narrow so we don't pull JSON columns unnecessarily.
 */
export const TEAM_DASHBOARD_STATS_PROJECT_SELECT = `
  id,
  name,
  concierge_stage,
  deploy_status,
  setup_fee,
  monthly_fee,
  deposit_status,
  final_status,
  outstanding_payment,
  subscription_status,
  created_at,
  updated_at
`.trim();

export type TeamDashboardStatsProjectRow = {
  id: string;
  name: string | null;
  concierge_stage?: string | null;
  deploy_status?: string | null;
  setup_fee: number | null;
  monthly_fee: number | null;
  deposit_status?: string | null;
  final_status?: string | null;
  outstanding_payment?: boolean | null;
  subscription_status?: string | null;
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

export type StageBreakdown = {
  intake: number;
  brief: number;
  build: number;
  internal_review: number;
  client_review: number;
  launched: number;
  care: number;
};

export type TeamDashboardStatsPayload = {
  totalProjects: number;
  draftCount: number;
  inProgressCount: number;
  liveCount: number;
  totalSetupFees: number;
  monthlyRevenue: number;
  paidCount: number;
  outstandingCount: number;
  /** Sum of editor_sessions.tokens_in + tokens_out since the 1st of this UTC month. */
  aiTokensThisMonth: number;
  /** Number of projects created in the last 7 days. */
  newThisWeek: number;
  /** Forecasted ARR: total setup fees collected + active monthly recurring × 12. */
  pipelineValue: number;
  /** Count per concierge_stage — feeds the pipeline visualization. */
  stageBreakdown: StageBreakdown;
  /** Distinct `editor_sessions` rows since the first of this UTC month (same window as aiTokensThisMonth). */
  aiSessionsThisMonth: number;
  /** Leads captured since the 1st of this UTC month. */
  leadsThisMonth: number;
  recentProject: TeamDashboardRecentProject | null;
};

function activityTimestamp(row: TeamDashboardStatsProjectRow): number {
  const u = new Date(row.updated_at || 0).getTime();
  const c = new Date(row.created_at || 0).getTime();
  return Math.max(u, c);
}

/**
 * Aggregate workspace-row stats for the team dashboard KPI strip.
 * `paidCount` is "deposit + final both paid" (i.e. setup is fully collected).
 */
export function computeTeamDashboardStats(
  rows: TeamDashboardStatsProjectRow[]
): TeamDashboardStatsPayload {
  let draftCount = 0;
  let inProgressCount = 0;
  let liveCount = 0;
  let totalSetupFees = 0;
  let monthlyRevenue = 0;
  let paidCount = 0;
  let outstandingCount = 0;
  let newThisWeek = 0;
  let recentProject: TeamDashboardRecentProject | null = null;
  let recentTs = -1;
  const stageBreakdown: StageBreakdown = {
    intake: 0,
    brief: 0,
    build: 0,
    internal_review: 0,
    client_review: 0,
    launched: 0,
    care: 0,
  };

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const p of rows) {
    const st = deriveProjectStatus(p);
    if (isLive(st)) liveCount += 1;
    else if (isBuilding(st)) inProgressCount += 1;
    else draftCount += 1;

    const stage = (p.concierge_stage as keyof StageBreakdown) ?? 'intake';
    if (stage in stageBreakdown) stageBreakdown[stage] += 1;

    totalSetupFees += p.setup_fee || 0;
    const setupPaid = p.deposit_status === 'paid' && p.final_status === 'paid';
    if (setupPaid) {
      paidCount += 1;
    }
    if (
      p.subscription_status === 'active' ||
      p.subscription_status === 'trial'
    ) {
      monthlyRevenue += p.monthly_fee || 0;
    }
    if (p.outstanding_payment) outstandingCount += 1;

    if (new Date(p.created_at).getTime() >= weekAgo) {
      newThisWeek += 1;
    }

    const ts = activityTimestamp(p);
    if (ts >= recentTs) {
      recentTs = ts;
      recentProject = {
        id: p.id,
        name: p.name,
        status: st,
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
    outstandingCount,
    aiTokensThisMonth: 0,
    newThisWeek,
    pipelineValue: totalSetupFees + monthlyRevenue * 12,
    stageBreakdown,
    aiSessionsThisMonth: 0,
    leadsThisMonth: 0,
    recentProject,
  };
}
