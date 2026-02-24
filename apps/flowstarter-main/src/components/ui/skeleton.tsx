import { cn } from '@/lib/utils';

/**
 * Unified Skeleton component for loading states
 * Provides consistent styling across all skeleton loaders
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-gray-200/80 dark:bg-white/10 animate-pulse rounded-md',
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonCard component for card-based skeleton loaders
 * Uses the same glass background as regular cards for consistency
 */
function SkeletonCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn(
        'flex flex-col items-start gap-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-100/50 dark:bg-white/[0.03] px-6 py-4 flex-1 self-stretch backdrop-blur-sm animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton, SkeletonCard };
