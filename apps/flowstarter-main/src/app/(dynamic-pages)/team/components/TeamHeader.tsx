'use client';
import { ScrollAwareHeader } from '@flowstarter/flow-design-system';


import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { TeamUserMenu } from './TeamUserMenu';

export function TeamHeader() {
  return (
    <ScrollAwareHeader className="z-[100] h-16" transparentClass="bg-white/80 dark:bg-[#14141a]/80 backdrop-blur-xl border-b border-gray-200/40 dark:border-white/10" scrolledClass="bg-white/90 dark:bg-[#14141a]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/15 shadow-sm">
      <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/team/dashboard" className="flex items-center gap-3 group">
          <Logo size="md" />
          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full hidden sm:block">
            Team
          </span>
        </Link>

        {/* Right side - User profile + Theme switcher */}
        <div className="flex items-center gap-2 lg:gap-3">
          <ThemeToggle />
          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />
          <TeamUserMenu />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
