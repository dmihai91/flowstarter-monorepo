'use client';

import { ScrollAwareHeader } from '@flowstarter/flow-design-system';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { useSidebar } from '@/contexts/SidebarContext';
import { UserMenu } from '@/components/ui/user-menu';

export function AppHeader() {
  const pathname = usePathname();
  const { setIsMobileOpen } = useSidebar();

  const isTeam = pathname?.startsWith('/team');
  const homeHref = isTeam ? '/team/dashboard' : '/dashboard';

  return (
    <ScrollAwareHeader
      className="z-[100] h-16"
      transparentClass="bg-white dark:bg-[#101014] border-b border-gray-200/20 dark:border-white/[0.04]"
      scrolledClass="bg-white/70 dark:bg-[#101014]/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-gray-200/30 dark:border-white/[0.06]"
    >
      <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href={homeHref} className="flex items-center gap-3 group">
            <span className="sm:hidden"><Logo size="sm" /></span>
            <span className="hidden sm:block"><Logo size="md" /></span>
            {isTeam && (
              <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full hidden sm:block">
                Team
              </span>
            )}
          </Link>
        </div>

        {/* Right: templates link + theme + user */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />
          <UserMenu />
          <a
            href="https://library.flowstarter.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors no-underline"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Templates
          </a>
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
