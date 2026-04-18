'use client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { GlassPanel } from '@flowstarter/flow-design-system';
import { useClientRequestStats } from '@/lib/client-requests/useClientRequests';

const CARD_CLASS =
  'rounded-[28px] bg-white/55 backdrop-blur-2xl backdrop-saturate-200 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] dark:bg-[rgba(18,12,42,0.55)] dark:backdrop-blur-2xl dark:backdrop-saturate-150 dark:border-white/[0.08] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]';

export function ClientRequestsKpiCard() {
  const { data: stats, isLoading } = useClientRequestStats();

  if (isLoading) {
    return (
      <GlassPanel
        shadow="glass"
        padding="md"
        className={`${CARD_CLASS} animate-pulse`}
      >
        <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-3" />
        <div className="h-9 w-16 bg-gray-200 dark:bg-white/10 rounded mb-3" />
        <div className="flex gap-3">
          <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
        </div>
      </GlassPanel>
    );
  }

  const pending = stats?.pending ?? 0;
  const urgent = stats?.urgent ?? 0;
  const inProgress = stats?.in_progress ?? 0;
  const resolvedThisWeek = stats?.resolved_this_week ?? 0;
  const allCaughtUp = pending === 0;

  return (
    <GlassPanel shadow="glass" padding="md" className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-white/50">
          Client Requests
        </span>
        <Link
          href="#client-requests-list"
          className="text-xs text-[var(--purple)] hover:underline font-medium"
        >
          Details →
        </Link>
      </div>

      {allCaughtUp ? (
        <div className="flex items-center gap-2 py-1 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/70">
            All caught up
          </p>
        </div>
      ) : (
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
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
            <span className="text-gray-600 dark:text-white/60">
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
            <span className="text-gray-400 dark:text-white/30 text-xs">
              No pending requests
            </span>
          )}
      </div>
    </GlassPanel>
  );
}
