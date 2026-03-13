'use client';

import { AppHeader } from '@/components/ui/app-header';
import { TeamSidebar } from '../components/TeamSidebar';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';

// Pages that should NOT show sidebar (full-width layouts)
const FULL_WIDTH_PATHS = ['/team/dashboard/new', '/team/dashboard/projects/'];

export default function TeamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if current path should be full-width (no sidebar)
  const isFullWidth = FULL_WIDTH_PATHS.some(path => pathname?.startsWith(path));

  if (isFullWidth) {
    return children;
  }

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex flex-col bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)]">
        {/* Gradient background - behind everything */}
        <FlowBackground variant="dashboard" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        {/* Gradient overlay with indigo + amber glows */}
        {/* Gradient overlay — light: soft pastels, dark: rich purples */}
        <div
          className="fixed inset-0 z-[1] pointer-events-none dark:hidden"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 0% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 100% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 120% 60% at 50% 100%, rgba(236, 72, 153, 0.04) 0%, transparent 55%)
            `,
          }}
        />
        <div
          className="fixed inset-0 z-[1] pointer-events-none hidden dark:block"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 0% 0%, rgba(99, 70, 200, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 100% 20%, rgba(77, 93, 217, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 120% 60% at 50% 100%, rgba(130, 80, 200, 0.06) 0%, transparent 55%)
            `,
          }}
        />
        
        <AppHeader />
        <div className="h-16 flex-shrink-0" />
        
        <div className="flex-1 flex relative z-10 min-h-0">
          <TeamSidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
