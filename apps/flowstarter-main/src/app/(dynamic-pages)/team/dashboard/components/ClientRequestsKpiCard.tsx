'use client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import { useClientRequestStats } from '@/lib/client-requests/useClientRequests';
import { Skeleton } from '@/components/ui/skeleton';

export function ClientRequestsKpiCard() {
  const { data: stats, isLoading } = useClientRequestStats();

  if (isLoading) {
    return (
      <GlassCard noHover className="animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-9 w-20 mb-3" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </GlassCard>
    );
  }

  const pending = stats?.pending ?? 0;
  const urgent = stats?.urgent ?? 0;
  const inProgress = stats?.in_progress ?? 0;
  const resolvedThisWeek = stats?.resolved_this_week ?? 0;
  const allCaughtUp = pending === 0;

  return (
    <GlassCard noHover>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--fs-ink-faint)]">
          Client Requests
        </span>
        <Link
          href="#client-requests-list"
          className="text-xs text-[var(--fs-accent)] hover:underline font-medium"
        >
          Details →
        </Link>
      </div>

      {allCaughtUp ? (
        <div className="flex items-center gap-2 py-1 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-base font-semibold text-[var(--fs-ink-dim)]">
            All caught up
          </p>
        </div>
      ) : (
        <p className="text-3xl font-bold text-[var(--fs-ink)] mb-3">
          {pending}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
        {urgent > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">
              {urgent} urgent
            </span>
          </span>
        )}
        {inProgress > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[var(--fs-ink-dim)]">
              {inProgress} in progress
            </span>
          </span>
        )}
        {resolvedThisWeek > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {resolvedThisWeek} resolved this week
            </span>
          </span>
        )}
        {allCaughtUp &&
          urgent === 0 &&
          inProgress === 0 &&
          resolvedThisWeek === 0 && (
            <span className="text-[var(--fs-ink-faint)] text-xs">
              No pending requests
            </span>
          )}
      </div>
    </GlassCard>
  );
}
