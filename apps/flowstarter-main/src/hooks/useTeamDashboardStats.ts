'use client';

import type { TeamDashboardStatsPayload } from '@/lib/team-dashboard/team-dashboard-stats';
import { useQuery } from '@tanstack/react-query';

export const teamDashboardStatsQueryKey = ['team-dashboard-stats'] as const;

export function useTeamDashboardStats() {
  return useQuery({
    queryKey: teamDashboardStatsQueryKey,
    queryFn: async (): Promise<TeamDashboardStatsPayload> => {
      const res = await fetch('/api/team/dashboard/stats', {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 403)
          throw new Error('Not authorized as team member');
        throw new Error('Failed to load team dashboard stats');
      }
      return res.json() as Promise<TeamDashboardStatsPayload>;
    },
    staleTime: 20_000,
    gcTime: 5 * 60_000,
  });
}
