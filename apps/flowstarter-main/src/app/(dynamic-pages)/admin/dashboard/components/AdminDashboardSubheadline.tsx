'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdminDashboardSubheadlineProps = {
  children?: ReactNode;
  text?: string;
  className?: string;
};

/**
 * Shared page subtitle under team admin `h1.ls-display` — secondary body copy
 * with landing-scope ink + sans tokens.
 */
export function AdminDashboardSubheadline({
  children,
  text,
  className,
}: AdminDashboardSubheadlineProps) {
  const content = children ?? text;
  if (content === undefined || content === null || content === '') {
    return null;
  }

  return (
    <p
      className={cn(
        'mt-2 max-w-2xl text-[15px] leading-[1.52] text-[var(--ls-ink-dim)]',
        className
      )}
      style={{ fontFamily: 'var(--ls-sans)' }}
    >
      {content}
    </p>
  );
}
