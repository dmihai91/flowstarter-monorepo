'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TeamProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-9 w-16 mb-2" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
