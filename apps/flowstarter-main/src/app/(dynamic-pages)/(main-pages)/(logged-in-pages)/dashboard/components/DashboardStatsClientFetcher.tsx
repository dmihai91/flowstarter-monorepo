'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DashboardStatsClient } from './DashboardStatsClient';

export function DashboardStatsClientFetcher() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard
            key={`dashboard-stats-skeleton-${i}`}
            className="p-4 rounded-2xl min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-4 w-full">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </SkeletonCard>
        ))}
      </div>
    );
  }

  // AI credits - not yet tracked in DB
  // Will be implemented when billing/subscription system is ready
  const aiCredits = undefined;

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
      aiCredits={aiCredits}
    />
  );
}

export default DashboardStatsClientFetcher;
