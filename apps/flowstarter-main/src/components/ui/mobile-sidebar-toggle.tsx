'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';

export function MobileSidebarToggle() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden fixed left-3 sm:left-4 z-50 p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all backdrop-blur-xl"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 0.875rem)',
      }}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
}
