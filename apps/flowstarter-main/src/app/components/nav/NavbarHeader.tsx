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
        isScrolled ? "border-b bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-2xl backdrop-saturate-150 border-gray-200/50 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" : "border-b border-transparent bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-xl"} ${
        isScrolled
          ? 'border-white/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          : 'border-white/40 dark:border-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
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
