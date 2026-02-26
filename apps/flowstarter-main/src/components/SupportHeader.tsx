'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
