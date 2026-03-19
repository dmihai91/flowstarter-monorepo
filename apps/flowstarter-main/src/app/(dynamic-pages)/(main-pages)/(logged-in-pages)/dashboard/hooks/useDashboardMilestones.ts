import { useMemo } from 'react';

export type MilestoneStatus = 'completed' | 'active' | 'locked';
export type TimeGreetingKey =
  | 'dashboard.greeting.morning'
  | 'dashboard.greeting.afternoon'
  | 'dashboard.greeting.evening'
  | 'dashboard.greeting.night';

export function getMilestoneStatuses(
  hasAnyProject: boolean,
  hasLiveProject: boolean
): [MilestoneStatus, MilestoneStatus, MilestoneStatus, MilestoneStatus] {
  if (hasLiveProject) return ['completed', 'completed', 'completed', 'completed'];
  if (hasAnyProject) return ['completed', 'active', 'locked', 'locked'];
  return ['active', 'locked', 'locked', 'locked'];
}

export function getTimeGreetingKey(hour: number): TimeGreetingKey {
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  if (hour >= 18 && hour < 21) return 'dashboard.greeting.evening';
  return 'dashboard.greeting.night';
}

export function useDashboardMilestones(hasAnyProject: boolean, hasLiveProject: boolean) {
  const statuses = useMemo(
    () => getMilestoneStatuses(hasAnyProject, hasLiveProject),
    [hasAnyProject, hasLiveProject]
  );

  const completedCount = statuses.filter((s) => s === 'completed').length;
  const progressPercent = (completedCount / statuses.length) * 100;

  return { statuses, completedCount, progressPercent };
}
