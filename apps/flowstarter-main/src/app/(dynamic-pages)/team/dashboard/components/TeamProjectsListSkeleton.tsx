'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TeamProjectsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-28 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Card Header */}
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
