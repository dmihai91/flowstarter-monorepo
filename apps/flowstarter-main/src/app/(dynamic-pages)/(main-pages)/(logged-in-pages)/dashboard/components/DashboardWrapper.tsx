'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardWrapperProps extends React.PropsWithChildren {
  className?: string;
}

export function DashboardWrapper({
  children,
  className,
}: DashboardWrapperProps) {
  return (
    <div
      data-density="comfortable"
      className={cn(
        'font-[var(--fs-font-sans)] text-[var(--fs-ink)] antialiased',
        className
      )}
    >
      {children}
    </div>
  );
}
