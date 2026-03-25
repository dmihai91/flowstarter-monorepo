'use client';

import { AppHeader } from '@/components/ui/app-header';
import { TeamSidebar } from '../components/TeamSidebar';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Pages that should NOT show sidebar (full-width layouts)
// These still get AppHeader + FlowBackground, just no sidebar.
const NO_SIDEBAR_PATHS = ['/team/dashboard/projects/'];

export default function TeamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar = NO_SIDEBAR_PATHS.some(path => pathname?.startsWith(path));

  // Prevent body scroll — sidebar must stay fixed, only <main> scrolls
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)]">
        {/* Gradient background — glows only, no SVG lines */}
        <FlowBackground variant="dashboard" animated={false} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

        <AppHeader />
        <div className="h-16 flex-shrink-0" />

        <div className="flex-1 flex relative z-10 min-h-0">
          {!hideSidebar && <TeamSidebar />}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
