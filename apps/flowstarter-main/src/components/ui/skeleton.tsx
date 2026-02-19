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
        'bg-white/30 dark:bg-white/10 backdrop-blur-sm animate-pulse rounded-md border border-white/40 dark:border-white/10',
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
        'text-card-foreground flex flex-col items-start gap-5 rounded-[16px] border border-white/40 dark:border-white/12 bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)] px-6 py-4 flex-1 self-stretch backdrop-blur-xl glass-shadow-card animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton, SkeletonCard };
