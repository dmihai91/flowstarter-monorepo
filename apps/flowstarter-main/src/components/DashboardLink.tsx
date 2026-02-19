'use client';

import { useDraftAutosave } from '@/hooks/useDraftAutosave';
import { cn } from '@/lib/utils';

export function DashboardLink({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { goToDashboard } = useDraftAutosave();

  return (
    <button
      type="button"
      onClick={goToDashboard}
      className={cn('cursor-pointer inline-flex items-center', className)}
    >
      <span className="hidden sm:inline">{children ?? 'Dashboard'}</span>
    </button>
  );
}

export default DashboardLink;
