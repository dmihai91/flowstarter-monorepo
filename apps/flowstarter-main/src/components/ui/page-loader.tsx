'use client';

/**
 * Shared page loader component - simple circle spinner
 * Used for initial page load states across both client and team dashboards
 */
export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
      </div>
    </div>
  );
}
