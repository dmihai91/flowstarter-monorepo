'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TeamProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl animate-pulse"
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
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
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
