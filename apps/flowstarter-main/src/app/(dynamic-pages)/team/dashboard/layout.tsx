'use client';

import { TeamSidebar } from '../components/TeamSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { DashboardBaseLayout } from '@/components/ui/dashboard-base-layout';
import { usePathname } from 'next/navigation';

// Pages that should NOT show sidebar (full-width layouts)
// These still get AppHeader + FlowBackground, just no sidebar.
const NO_SIDEBAR_PATHS = ['/team/dashboard/projects/'];

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
    <DashboardBaseLayout sidebar={<TeamSidebar />} hideSidebar={hideSidebar}>
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
