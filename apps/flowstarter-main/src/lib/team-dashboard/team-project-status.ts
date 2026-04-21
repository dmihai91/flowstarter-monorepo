/** Status groupings for team dashboard stats and project cards. */

export const LIVE_STATUSES = ['completed', 'live'] as const;
export const BUILDING_STATUSES = [
  'in_progress',
  'building',
  'generating',
] as const;

export function isLive(status: string | null): boolean {
  return LIVE_STATUSES.includes(status as (typeof LIVE_STATUSES)[number]);
}

export function isBuilding(status: string | null): boolean {
  return BUILDING_STATUSES.includes(
    status as (typeof BUILDING_STATUSES)[number]
  );
}

export const STATUS_BADGE_CLASS = {
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  building: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60',
} as const;
