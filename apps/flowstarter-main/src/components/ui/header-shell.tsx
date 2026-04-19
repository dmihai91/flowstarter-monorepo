'use client';

import { ScrollAwareHeader } from '@flowstarter/flow-design-system';
import type { ReactNode } from 'react';

const TRANSPARENT = 'bg-transparent border-b border-transparent';

const SCROLLED =
  'bg-white/72 dark:bg-[var(--fs-bg-base)]/72 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-gray-200/30 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

const maxWidthMap = {
  full: '',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const;

interface HeaderShellProps {
  children: ReactNode;
  /** Container max-width. "full" = no constraint. */
  maxWidth?: keyof typeof maxWidthMap;
  /** Extra classes on the outer <header> */
  className?: string;
  /** Scroll threshold in px before frosted glass kicks in (default 8) */
  threshold?: number;
  /** Always show frosted glass regardless of scroll position */
  alwaysScrolled?: boolean;
}

export function HeaderShell({
  children,
  maxWidth = '7xl',
  className = '',
  threshold = 8,
  alwaysScrolled = false,
}: HeaderShellProps) {
  return (
    <ScrollAwareHeader
      threshold={alwaysScrolled ? -1 : threshold}
      transparentClass={alwaysScrolled ? SCROLLED : TRANSPARENT}
      scrolledClass={SCROLLED}
      className={`z-50 ${className}`}
    >
      <div
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between ${maxWidthMap[maxWidth]}`}
      >
        {children}
      </div>
    </ScrollAwareHeader>
  );
}
