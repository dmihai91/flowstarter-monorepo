'use client';

import Link from 'next/link';
import { TeamUserMenu } from './TeamUserMenu';

export function TeamHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
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

        {/* User Menu */}
        <TeamUserMenu />
      </div>
    </header>
  );
}
