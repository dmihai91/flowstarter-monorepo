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

  const hideSidebar = NO_SIDEBAR_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

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
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        {/* Gradient background — glows only, no SVG lines */}
        <FlowBackground
          variant="dashboard"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div
          className="fixed inset-0 z-[1] pointer-events-none dark:hidden"
          style={{
            background: `
              radial-gradient(ellipse 88% 64% at 0% 0%, rgba(139, 92, 246, 0.13) 0%, transparent 52%),
              radial-gradient(ellipse 76% 54% at 100% 18%, rgba(99, 102, 241, 0.10) 0%, transparent 54%),
              radial-gradient(ellipse 120% 72% at 50% 62%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 128% 66% at 50% 100%, rgba(236, 72, 153, 0.07) 0%, transparent 58%)
            `,
          }}
        />
        <div
          className="fixed inset-0 z-[1] pointer-events-none hidden dark:block"
          style={{
            background: `
              radial-gradient(ellipse 88% 64% at 0% 0%, rgba(99, 70, 200, 0.18) 0%, transparent 52%),
              radial-gradient(ellipse 76% 54% at 100% 18%, rgba(77, 93, 217, 0.13) 0%, transparent 54%),
              radial-gradient(ellipse 120% 72% at 50% 62%, rgba(96, 117, 255, 0.11) 0%, transparent 60%),
              radial-gradient(ellipse 128% 66% at 50% 100%, rgba(130, 80, 200, 0.10) 0%, transparent 58%)
            `,
          }}
        />

        <AppHeader />

        <div className="flex-1 flex relative z-10 min-h-0">
          {!hideSidebar && <TeamSidebar />}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-16">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
