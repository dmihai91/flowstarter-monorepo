'use client';

import { TeamHeader } from '../components/TeamHeader';
import { TeamSidebar } from '../components/TeamSidebar';
import { FlowBackground } from '@flowstarter/flow-design-system';
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
    // Full-width layout for wizard/project detail pages
    return children;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient background - behind everything */}
      <FlowBackground variant="dashboard" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
      
      <TeamHeader />
      <div className="h-16" />
      
      <div className="flex-1 flex relative z-10">
        <TeamSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
