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
          ? 'border-b bg-white/50 dark:bg-[var(--fs-bg-base)]/60 backdrop-blur-2xl backdrop-saturate-150 border-[var(--fs-rule)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
          : 'border-b border-[var(--fs-rule)] bg-white/60 dark:bg-[var(--fs-bg-base)]/95 backdrop-blur-xl'
      } ${
        isScrolled
          ? 'border-white/40 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          : 'border-white/30 dark:border-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
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
