'use client';
import { ReactNode } from 'react';

interface NavbarHeaderProps {
  isScrolled: boolean;
  children: ReactNode;
  maxWidth?: 'full' | '6xl';
}

export function NavbarHeader({
  isScrolled,
  children,
  maxWidth = 'full',
}: NavbarHeaderProps) {
  const containerClass =
    maxWidth === '6xl'
      ? 'mx-auto w-full max-w-6xl px-2 lg:px-6 h-16 flex items-center'
      : 'w-full px-4 lg:px-6 h-16 flex items-center justify-between';

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        'border-b bg-white/85 dark:bg-[var(--fs-bg-base)]/80 backdrop-blur-xl backdrop-saturate-150 border-[var(--fs-rule)]/50'
      } ${
        isScrolled
          ? 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : ''
      }`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className={containerClass}>{children}</div>
    </header>
  );
}