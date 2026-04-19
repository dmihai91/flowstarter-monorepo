'use client';

import { LogoIcon } from './logo';

/**
 * Unified loading states for all pages.
 * Use <AppLoader /> for full-page loading with logo + spinner.
 * Use <AppLoader variant="inline" /> for inline/section loading.
 * Use <CardSkeleton count={n} /> for card grid loading.
 *
 * All colors via --fs-* tokens — adapts to dark/light automatically.
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
      {/* Track */}
      <div className="absolute inset-0 rounded-full border-2 border-[var(--fs-rule)]" />
      {/* Arc */}
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--fs-accent)] animate-spin"
        style={{ animationDuration: '0.8s' }}
      />
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center py-8">{spinner}</div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in duration-300">
      <LogoIcon size="lg" />
      {spinner}
      <p
        className="text-[11px] uppercase tracking-widest"
        style={{
          color: 'var(--fs-ink-faint)',
          fontFamily: 'var(--fs-font-mono)',
        }}
      >
        {message}
      </p>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--fs-radius-2xl)] backdrop-blur-xl border animate-pulse"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            padding: '1.25rem',
            minHeight: 140,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-24 rounded bg-[var(--fs-rule)]" />
            <div className="h-8 w-8 rounded-xl bg-[var(--fs-rule)]" />
          </div>
          <div className="h-7 w-20 rounded mb-2 bg-[var(--fs-rule)]" />
          <div className="h-3 w-36 rounded bg-[var(--fs-rule)]/60" />
        </div>
      ))}
    </div>
  );
}
