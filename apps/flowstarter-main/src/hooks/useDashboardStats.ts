'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

interface TemplateStat {
  template: string;
  count: number;
}

interface TrendsPoint {
  name: string;
  Created: number;
  Completed: number;
}

interface UserEngagementStats {
  totalUsers: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  newUsersThisMonth: number;
}

interface DashboardStatsPayload {
  totalProjects: number;
  liveProjects: number;
  totalLeads: number;
  uniqueVisitors: number;
  totalViews: number;
  avgSessionDuration: number;
  potentialRevenue: number;
  trendsData: TrendsPoint[];
  popularTemplates: TemplateStat[];
  userEngagement: UserEngagementStats;
  completedProjects: number;
  inProgressProjects: number;
  draftProjects: number;
  lastProject: {
    id: string;
    name: string;
    status: string;
    is_draft: boolean;
    updated_at: string;
    thumbnail_url?: string | null;
  } | null;
}

export const dashboardStatsKeys = {
  all: ['dashboard-stats'] as const,
};

export function useDashboardStats() {
  return useQuery<DashboardStatsPayload>({
    queryKey: dashboardStatsKeys.all,
    queryFn: async (): Promise<DashboardStatsPayload> => {
      const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load dashboard stats');
      const json = (await res.json()) as DashboardStatsPayload;
      return json;
    },
    staleTime: 60_000, // 1 minute
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateDashboardStats() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: dashboardStatsKeys.all });
  };
}
