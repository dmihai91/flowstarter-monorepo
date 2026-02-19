'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';

export function MobileSidebarToggle() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden fixed left-4 top-4 z-50 p-2 rounded-xl bg-(--surface-2) border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all backdrop-blur-sm -mt-1"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
}
