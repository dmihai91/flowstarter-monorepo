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
        isScrolled
          ? 'border-b bg-white/90 dark:bg-[var(--fs-bg-base)]/85 backdrop-blur-2xl backdrop-saturate-180 border-[var(--fs-rule)]/60 shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)_inset]'
          : 'border-b bg-white/85 dark:bg-[var(--fs-bg-base)]/80 backdrop-blur-sm border-[var(--fs-rule)]/30'
      } ${
        ''
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