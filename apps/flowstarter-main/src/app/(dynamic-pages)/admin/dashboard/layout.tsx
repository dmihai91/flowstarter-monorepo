'use client';

import '../../(main-pages)/landing-design.css';
import { TeamSidebar } from '../components/TeamSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { DashboardBaseLayout } from '@/components/ui/dashboard-base-layout';
import { usePathname } from 'next/navigation';

// Pages that should NOT show sidebar (full-width layouts) — still get
// AppHeader + FlowBackground, just no sidebar.
const NO_SIDEBAR_PATHS = ['/admin/dashboard/projects/'];

// Operator dashboard atmosphere: dashboard FlowBackground + fixed mesh + grain
// overlays. Don't set quietOverlays here — those overlays carry the dark-mode
// wash that makes the gradient readable behind glass cards.

function TeamDashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar = NO_SIDEBAR_PATHS.some((path) =>
    pathname?.startsWith(path)
  );

  return (
    <DashboardBaseLayout
      sidebar={<TeamSidebar />}
      hideSidebar={hideSidebar}
      bgVariant="dashboard"
    >
      {children}
    </DashboardBaseLayout>
  );
}

export default function TeamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TeamDashboardLayoutContent>{children}</TeamDashboardLayoutContent>
    </SidebarProvider>
  );
}
