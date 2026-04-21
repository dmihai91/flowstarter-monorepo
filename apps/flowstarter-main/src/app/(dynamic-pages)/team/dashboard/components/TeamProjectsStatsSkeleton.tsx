'use client';

import { Skeleton } from '@/components/ui/skeleton';

const skeletonCardClass =
  'animate-pulse rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150 p-5';

const skeletonCardStyle = {
  background: 'var(--fs-glass-bg)',
  borderColor: 'var(--fs-glass-edge)',
  boxShadow: 'var(--fs-card-shadow)',
};

export function TeamProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={skeletonCardClass}
          style={{ ...skeletonCardStyle, animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-20 mb-3" />
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

          {i === 1 ? (
            <div className="mt-4 border-t border-[var(--fs-rule)] pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
