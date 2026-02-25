'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TeamProjectsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          
          {/* Description */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center gap-1 p-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-2 w-10" />
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="flex items-center gap-5 pt-3 border-t border-gray-100 dark:border-white/5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
