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
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? 'border-gray-200 dark:border-white/40 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl shadow-lg'
          : 'border-gray-200/80 dark:border-white/40 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] backdrop-blur-xl shadow-md'
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
