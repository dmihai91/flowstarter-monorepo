/** Status groupings for team dashboard stats and project cards. */

export const LIVE_STATUSES = ['completed', 'live'] as const;
export const BUILDING_STATUSES = [
  'in_progress',
  'building',
  'generating',
] as const;

export type ProjectStatusSource = {
  status?: string | null;
  is_draft?: boolean | null;
  final_status?: string | null;
  published_url?: string | null;
  generation_completed_at?: string | null;
};

export function isLive(status: string | null): boolean {
  return LIVE_STATUSES.includes(status as (typeof LIVE_STATUSES)[number]);
}

export function isBuilding(status: string | null): boolean {
  return BUILDING_STATUSES.includes(
    status as (typeof BUILDING_STATUSES)[number]
  );
}

/**
 * Some environments don't have `projects.status`.
 * Derive a compatible status from stable project fields.
 */
export function deriveProjectStatus(project: ProjectStatusSource): string {
  const direct = project.status?.toLowerCase();
  if (direct) return direct;

  if (project.is_draft) return 'draft';

  const finalStatus = project.final_status?.toLowerCase();
  if (finalStatus === 'completed' || finalStatus === 'live') return 'live';

  if (project.published_url) return 'live';
  if (project.generation_completed_at) return 'building';

  return 'building';
}

export const STATUS_BADGE_CLASS = {
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  building: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60',
} as const;
