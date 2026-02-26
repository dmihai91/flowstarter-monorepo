'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TeamUserMenu } from './TeamUserMenu';

export function TeamHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-[#0a0a0c]/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/50 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/team/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20 group-hover:shadow-[var(--purple)]/30 transition-shadow">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
            Team
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <TeamUserMenu />
        </div>
      </div>
    </header>
  );
}
