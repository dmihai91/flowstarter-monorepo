'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20 group-hover:shadow-[var(--purple)]/30 transition-shadow">
            <span className="text-white font-bold text-xs sm:text-sm">F</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Flowstarter
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
