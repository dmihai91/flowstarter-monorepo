'use client';
import { ScrollAwareHeader } from '@flowstarter/flow-design-system';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { TeamUserMenu } from './TeamUserMenu';
import { useSidebar } from '@/contexts/SidebarContext';

export function TeamHeader() {
  const { setIsMobileOpen } = useSidebar();

  return (
    <ScrollAwareHeader className="z-[100] h-16" transparentClass="bg-white/95 dark:bg-[#12121a]/90 backdrop-blur-sm border-b border-gray-200/40 dark:border-white/10" scrolledClass="bg-white/60 dark:bg-[#12121a]/85 backdrop-blur-2xl backdrop-saturate-150 border-b border-gray-200/30 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/team/dashboard" className="flex items-center gap-3 group">
            <Logo size="md" />
            <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full hidden sm:block">
              Team
            </span>
          </Link>
        </div>

        {/* Right side - ThemeToggle hidden on mobile (shown in sidebar instead) */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />
          <TeamUserMenu />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
