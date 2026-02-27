'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
