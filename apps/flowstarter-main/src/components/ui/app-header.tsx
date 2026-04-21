'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { useSidebar } from '@/contexts/SidebarContext';

export function AppHeader() {
  const { setIsMobileOpen } = useSidebar();
  return <SiteHeader mode="app" onOpenAppMenu={() => setIsMobileOpen(true)} />;
}
