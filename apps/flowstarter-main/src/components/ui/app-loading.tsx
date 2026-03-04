'use client';

import { LogoIcon } from './logo';

/**
 * Unified loading states for all pages.
 * Use <AppLoader /> for full-page loading with logo + spinner.
 * Use <AppLoader variant="inline" /> for inline loading.
 * Use <CardSkeleton count={n} /> for card grid loading.
 */

export function AppLoader({
  variant = 'page',
  message = 'Loading...',
}: {
  variant?: 'page' | 'inline';
  message?: string;
}) {
  const spinner = (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin"
        style={{ animationDuration: '0.8s' }}
      />
    </div>
  );

  if (variant === 'inline') {
    return <div className="flex items-center justify-center py-8">{spinner}</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in duration-300">
      <LogoIcon size="lg" />
      {spinner}
      <p className="text-sm text-gray-500 dark:text-white/40">{message}</p>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-5 min-h-[140px] animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="h-7 w-20 bg-gray-200 dark:bg-white/10 rounded mb-2" />
          <div className="h-3 w-36 bg-gray-100 dark:bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}
