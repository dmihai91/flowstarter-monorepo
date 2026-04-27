'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { useSidebar } from '@/contexts/SidebarContext';
import { AppHeader } from '@/components/ui/app-header';
import { dashboardDarkOverlay, dashboardLightOverlay } from '@/lib/glass';
import { useEffect, type ReactNode } from 'react';

type DashboardBaseLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  hideSidebar?: boolean;
};

export function DashboardBaseLayout({
  children,
  sidebar,
  hideSidebar = false,
}: DashboardBaseLayoutProps) {
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <FlowBackground
        variant="dashboard"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none dark:hidden"
        style={{ background: dashboardLightOverlay }}
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none hidden dark:block"
        style={{ background: dashboardDarkOverlay }}
      />

      <AppHeader />
      {!hideSidebar && sidebar}
      <main
        className={`flex-1 pt-16 relative z-10 min-w-0 overflow-y-auto overflow-x-hidden ${
          hideSidebar ? '' : isCollapsed ? 'md:ml-[72px]' : 'md:ml-52 lg:ml-60'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
