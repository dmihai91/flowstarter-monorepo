'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Pulse blocks that read correctly on ls-scope (admin + marketing tokens). */
const sk = 'rounded-md bg-[var(--ls-rule)] animate-pulse dark:bg-white/[0.09]';

function StatCellSkeleton() {
  return (
    <div
      className={cn(
        'ls-stat-cell relative flex min-h-[8rem] flex-col gap-2 overflow-hidden rounded-xl border border-[var(--ls-rule)] px-5 py-5 sm:min-h-[8.25rem] lg:min-h-[8.5rem] lg:py-6'
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Skeleton className={cn('h-8 w-8 shrink-0 rounded-[10px]', sk)} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sk)} />
          <Skeleton className={cn('h-2.5 w-24', sk)} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <Skeleton className={cn('h-9 w-20', sk)} />
        <div className="flex min-h-[2.625rem] flex-col justify-start sm:min-h-[2.75rem]">
          <Skeleton className={cn('h-[13px] w-[min(100%,11rem)]', sk)} />
        </div>
      </div>
    </div>
  );
}

/** Mirrors the team home dashboard: masthead, stats strip, pipeline, two tables. */
export function AdminDashboardPageSkeleton() {
  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className={cn('h-9 w-56 shrink-0 sm:h-10 sm:w-72', sk)} />
          <Skeleton className={cn('h-4 w-full max-w-md', sk)} />
        </div>
        <Skeleton
          className={cn(
            'h-10 w-44 shrink-0 self-start rounded-lg sm:self-auto',
            sk
          )}
        />
      </header>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <StatCellSkeleton key={i} />
        ))}
      </section>

      <section className="ls-card mt-7 overflow-hidden !p-0">
        <header className="flex items-end justify-between gap-4 border-b border-[var(--ls-rule)] px-5 py-3.5 sm:px-6">
          <div className="space-y-2">
            <Skeleton className={cn('h-2.5 w-20', sk)} />
            <Skeleton className={cn('h-5 w-48', sk)} />
          </div>
          <Skeleton className={cn('hidden h-3 w-28 sm:block', sk)} />
        </header>
        <div className="grid min-h-[200px] grid-cols-2 gap-0 divide-x divide-[var(--ls-rule)] p-2 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col px-2 py-2">
              <div className="flex items-center gap-2 px-1 py-2">
                <Skeleton className={cn('h-1.5 w-1.5 rounded-full', sk)} />
                <Skeleton className={cn('h-2 w-14', sk)} />
                <Skeleton className={cn('ml-auto h-2 w-4', sk)} />
              </div>
              <div className="mt-2 flex flex-1 flex-col gap-1.5 px-1">
                <Skeleton className={cn('h-14 w-full rounded-[10px]', sk)} />
                <Skeleton className={cn('h-14 w-full rounded-[10px]', sk)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <TablePanelSkeleton className="mt-7" rows={6} />
      <TablePanelSkeleton className="mt-7" rows={5} />
    </div>
  );
}

function TablePanelSkeleton({
  className,
  rows,
}: {
  className?: string;
  rows: number;
}) {
  return (
    <section className={cn('ls-card overflow-hidden !p-0', className)}>
      <header className="flex items-end justify-between gap-4 border-b border-[var(--ls-rule)] px-5 py-3.5 sm:px-6">
        <div className="space-y-2">
          <Skeleton className={cn('h-2.5 w-24', sk)} />
          <Skeleton className={cn('h-5 w-40', sk)} />
        </div>
        <Skeleton className={cn('h-3 w-20', sk)} />
      </header>
      <div className="divide-y divide-[var(--ls-rule)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className={cn('h-4 w-[42%] max-w-md', sk)} />
            <Skeleton className={cn('ml-auto hidden h-3 w-24 sm:block', sk)} />
            <Skeleton className={cn('h-3 w-16 shrink-0', sk)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Same horizontal padding / max width as `TeamDashboardShell` + `DashboardChrome`. */
export function AdminShellLoadingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ls-scope ls-admin-dashboard px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </div>
  );
}

/** Same chrome as dashboard `DashboardChrome`. */
export function AdminDashboardLoadingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ls-scope ls-admin-dashboard px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </div>
  );
}

type ShellSkeletonVariant = 'list' | 'cards';

/** Sub-pages using `TeamDashboardShell` (projects list, clients directory, etc.). */
export function AdminShellPageSkeleton({
  variant = 'list',
  rows = 8,
  showSearchBar = true,
}: {
  variant?: ShellSkeletonVariant;
  rows?: number;
  /** When false, omits the search-field row (e.g. team, analytics). */
  showSearchBar?: boolean;
}) {
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className={cn('h-10 w-10 shrink-0 rounded-lg', sk)} />
          <div className="space-y-2">
            <Skeleton className={cn('h-8 w-52 max-w-[70vw]', sk)} />
            <Skeleton className={cn('h-4 w-80 max-w-[85vw]', sk)} />
          </div>
        </div>
        <Skeleton className={cn('h-10 w-36 shrink-0 rounded-xl', sk)} />
      </div>

      {variant === 'list' ? (
        <>
          {showSearchBar ? (
            <Skeleton
              className={cn('mb-4 h-10 w-full max-w-md rounded-xl', sk)}
            />
          ) : null}
          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className={cn('h-16 w-full rounded-xl', sk)} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(rows, 6) }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--fs-radius-2xl)] border border-[var(--ls-rule)] p-5 dark:border-white/10"
            >
              <div className="flex gap-4">
                <Skeleton
                  className={cn('h-11 w-11 shrink-0 rounded-full', sk)}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className={cn('h-4 w-[min(100%,14rem)]', sk)} />
                  <Skeleton className={cn('h-3 w-full', sk)} />
                  <Skeleton className={cn('h-3 w-[min(100%,11rem)]', sk)} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--ls-rule)] pt-4">
                <Skeleton className={cn('mx-auto h-6 w-10', sk)} />
                <Skeleton className={cn('mx-auto h-6 w-12', sk)} />
                <Skeleton className={cn('mx-auto h-6 w-14', sk)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Project detail body placeholder (no outer padding — parent supplies chrome). */
export function AdminProjectDetailSkeleton() {
  return (
    <div>
      <div className="mb-6 flex gap-3">
        <Skeleton className={cn('h-10 w-10 shrink-0 rounded-lg', sk)} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className={cn('h-8 w-[min(100%,16rem)]', sk)} />
          <Skeleton className={cn('h-4 w-[min(100%,12rem)]', sk)} />
        </div>
      </div>
      <div className="mb-6 grid w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-9 rounded-md', sk)} />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn('h-32 w-full rounded-xl', sk)} />
        ))}
      </div>
    </div>
  );
}
