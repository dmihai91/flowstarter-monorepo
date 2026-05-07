/** Status groupings for team dashboard stats and project cards. */

export const LIVE_STATUSES = ['launched', 'care'] as const;
export const BUILDING_STATUSES = [
  'brief',
  'build',
  'internal_review',
  'client_review',
] as const;
export const INTAKE_STATUSES = ['intake'] as const;

export type ProjectStatusSource = {
  concierge_stage?: string | null;
  deploy_status?: string | null;
};

export function isLive(stage: string | null): boolean {
  return LIVE_STATUSES.includes(stage as (typeof LIVE_STATUSES)[number]);
}

export function isBuilding(stage: string | null): boolean {
  return BUILDING_STATUSES.includes(
    stage as (typeof BUILDING_STATUSES)[number]
  );
}

/**
 * Map a workspace's concierge_stage to a 3-state UI status.
 * 'live' once launched/care, 'intake' before brief, otherwise 'building'.
 */
export function deriveProjectStatus(project: ProjectStatusSource): string {
  const stage = project.concierge_stage?.toLowerCase() ?? 'intake';
  if (isLive(stage)) return 'live';
  if (stage === 'intake') return 'intake';
  return 'building';
}

export const STATUS_BADGE_CLASS = {
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  building: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  intake: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
} as const;
