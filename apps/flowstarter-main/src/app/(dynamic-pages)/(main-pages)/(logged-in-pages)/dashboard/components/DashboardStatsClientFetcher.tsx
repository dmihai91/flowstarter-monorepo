'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DashboardStatsClient } from './DashboardStatsClient';

export function DashboardStatsClientFetcher() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard
            key={`dashboard-stats-skeleton-${i}`}
            className="p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4 w-full">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-7 w-14 mb-1.5" />
            <Skeleton className="h-3 w-28" />
          </SkeletonCard>
        ))}
      </div>
    );
  }

  return (
    <DashboardStatsClient
      totalProjects={data.totalProjects}
      liveProjects={data.liveProjects}
      totalLeads={data.totalLeads}
      uniqueVisitors={data.uniqueVisitors}
      totalViews={data.totalViews}
      avgSessionDuration={data.avgSessionDuration}
      potentialRevenue={data.potentialRevenue}
      popularTemplates={data.popularTemplates}
      userEngagement={data.userEngagement}
      completedProjects={data.completedProjects}
      inProgressProjects={data.inProgressProjects}
      draftProjects={data.draftProjects}
      lastProject={data.lastProject}
    />
  );
}

export default DashboardStatsClientFetcher;
