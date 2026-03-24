'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TeamProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_2px_20px_rgba(0,0,0,0.2)]"
          style={{ animationDelay: `${i * 100}ms` }}
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
          
          {/* Mini project preview */}
          <div className="mt-4 border-t border-white/50 pt-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
