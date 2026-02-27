'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/ui/logo';

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header Row Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-36" />
        </div>
      </div>

      {/* Quick Scaffold Skeleton */}
      <div className="mb-8">
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-5 w-64" />
            <div className="ml-auto">
              <Skeleton className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-16 mb-2" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      {/* Project Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Card Header */}
            <div className="flex items-start gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
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
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
      {/* Centered Logo with pulse */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[var(--purple)]/20 rounded-full blur-xl animate-pulse" />
        <div className="relative">
          <Logo size="lg" showText={false} />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--purple)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[var(--purple)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[var(--purple)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm font-medium">Loading dashboard</span>
      </div>
    </div>
  );
}
