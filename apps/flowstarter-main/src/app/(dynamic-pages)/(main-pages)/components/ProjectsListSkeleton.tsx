'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export function ProjectsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => {
        return (
          <SkeletonCard
            key={index}
            className="group relative overflow-hidden rounded-xl flex flex-col shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]"
          >
            <div className="relative z-10 flex flex-col h-full p-4 gap-3 w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 text-xs flex-wrap">
                    {/* Template badge skeleton */}
                    <Skeleton className="h-6 w-28 rounded-full" />
                    {/* Status badge skeleton */}
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  {/* Title skeleton */}
                  <Skeleton className="h-5 w-3/4" />
                  {/* Description skeleton */}
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
                {/* Icon skeleton */}
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              </div>

              {/* Preview placeholder skeleton */}
              <div className="relative overflow-hidden rounded-2xl border border-white/40 dark:border-white/10 shadow-sm h-16 flex items-center justify-center p-3">
                <Skeleton className="h-12 w-4/5 rounded-xl" />
              </div>

              {/* Footer skeleton */}
              <div className="mt-auto flex items-center justify-between border-t border-white/40 dark:border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          </SkeletonCard>
        );
      })}
    </div>
  );
}
