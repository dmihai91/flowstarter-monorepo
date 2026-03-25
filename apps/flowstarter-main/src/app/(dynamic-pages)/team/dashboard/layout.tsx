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
        {/* Background — pure CSS radial gradients, no SVG lines, no banding */}
        <div
          className="fixed inset-0 z-0 pointer-events-none dark:hidden"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 10% 0%,   rgba(139, 92, 246, 0.11) 0%, transparent 55%),
              radial-gradient(ellipse 70% 45% at 90% 10%,  rgba(99, 102, 241, 0.08) 0%, transparent 55%),
              radial-gradient(ellipse 80% 50% at 50% 110%, rgba(236, 72, 153, 0.06) 0%, transparent 60%),
              #f5f5f8
            `,
          }}
        />
        <div
          className="fixed inset-0 z-0 pointer-events-none hidden dark:block"
          style={{
            background: `
              radial-gradient(ellipse 75% 55% at 10% 0%,   rgba(109, 70, 220, 0.28) 0%, transparent 55%),
              radial-gradient(ellipse 60% 45% at 90% 10%,  rgba(59, 100, 230, 0.18) 0%, transparent 55%),
              radial-gradient(ellipse 80% 50% at 50% 105%, rgba(130, 60, 210, 0.16) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 70%,  rgba(80,  40, 180, 0.10) 0%, transparent 55%),
              #07070f
            `,
          }}
        />

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
