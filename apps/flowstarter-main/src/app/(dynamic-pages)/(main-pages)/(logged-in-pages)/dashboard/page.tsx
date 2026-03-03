'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUser } from '@clerk/nextjs';
import { GlassCard } from '@flowstarter/flow-design-system';
import { DashboardInit } from './components/DashboardInit';
import { DashboardMessages } from './components/DashboardMessages';
import { DashboardStatsClientFetcher } from './components/DashboardStatsClientFetcher';
import { DashboardWrapper } from './components/DashboardWrapper';
import { MilestonesTimeline } from './components/MilestonesTimeline';
import { PrimaryAction } from './components/PrimaryAction';
import { getTimeGreetingKey } from './hooks/useDashboardMilestones';

export const dynamic = 'force-dynamic';

/* ─── Skeleton ─── */
function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Greeting */}
      <div className="mt-4 mb-6">
        <div className="h-3.5 w-36 bg-gray-200 dark:bg-white/10 rounded-lg mb-2" />
        <div className="h-7 w-44 bg-gray-200 dark:bg-white/10 rounded-lg" />
      </div>

      {/* Milestones - mobile */}
      <div className="sm:hidden space-y-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 w-20 bg-gray-200 dark:bg-white/10 rounded mb-1.5" />
              <div className="h-2.5 w-36 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Milestones - tablet: 2x2 grid */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/30 dark:bg-white/[0.015]">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-2.5 w-10 bg-gray-200 dark:bg-white/10 rounded mb-1" />
              <div className="h-3.5 w-20 bg-gray-200 dark:bg-white/10 rounded mb-1" />
              <div className="h-2.5 w-32 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Milestones - desktop: timeline with nodes */}
      <div className="hidden lg:block mb-8">
        <div className="relative flex items-start">
          <div className="absolute top-5 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-gray-200/60 dark:bg-white/5 rounded-full" />
          <div className="relative z-[2] grid grid-cols-4 w-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 mb-3" />
                <div className="w-full max-w-[180px] p-3 rounded-xl bg-white/30 dark:bg-white/[0.015] flex flex-col items-center">
                  <div className="h-2.5 w-10 bg-gray-200 dark:bg-white/10 rounded mb-1" />
                  <div className="h-3.5 w-16 bg-gray-200 dark:bg-white/10 rounded mb-1" />
                  <div className="h-2.5 w-28 bg-gray-100 dark:bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Banner */}
      <GlassCard noHover className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-44 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-64 bg-gray-100 dark:bg-white/5 rounded" />
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-white/10 rounded-xl hidden sm:block" />
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <GlassCard key={i} noHover className="min-h-[140px]">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-36 bg-gray-100 dark:bg-white/5 rounded" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { t } = useTranslations();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data, isLoading } = useDashboardStats();

  const loading = !isUserLoaded || isLoading;

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = t(getTimeGreetingKey(hour) as any);

  const hasAnyProject = (data?.totalProjects ?? 0) > 0;
  const hasLiveProject = (data?.liveProjects ?? 0) > 0;

  return (
    <DashboardWrapper>
      {loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DashboardMessages />

        <DashboardInit>
          {/* Greeting */}
          <div className="mt-4 sm:mt-6 mb-6">
            <p className="text-base sm:text-lg text-gray-500 dark:text-white/50 mb-1">
              {greeting},{' '}
              <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
          </div>

          {/* Milestones Timeline */}
          <MilestonesTimeline hasAnyProject={hasAnyProject} hasLiveProject={hasLiveProject} />

          {/* Primary Action Banner */}
          <PrimaryAction hasAnyProject={hasAnyProject} hasLiveProject={hasLiveProject} />

          {/* Stats */}
          <div className="mb-8">
            <DashboardStatsClientFetcher />
          </div>
        </DashboardInit>
      </div>
      )}
    </DashboardWrapper>
  );
}
