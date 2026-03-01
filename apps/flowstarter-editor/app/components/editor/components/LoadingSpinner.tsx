/**
 * Editor loading spinner - wraps the design system Spinner with
 * a centered container and optional message.
 */

import { Spinner } from '@flowstarter/flow-design-system';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{message}</span>
      </div>
    </div>
  );
}
