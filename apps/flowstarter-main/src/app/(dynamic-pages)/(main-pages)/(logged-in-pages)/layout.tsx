'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthCheck } from './AuthCheck';
import { AppHeader } from '@/components/ui/app-header';

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hidesSidebar =
    pathname?.startsWith('/dashboard/new') || pathname?.startsWith('/wizard');

  const { isCollapsed } = useSidebar();

  if (hidesSidebar) {
    // Full-width layout for wizard pages
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 mt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient background - behind everything */}
      <FlowBackground variant="dashboard" style={{ position: "fixed", inset: 0, zIndex: 0 }} />
      {/* Gradient overlay with indigo + amber glows */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, rgba(99, 70, 200, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 100% 20%, rgba(77, 93, 217, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 120% 60% at 50% 100%, rgba(130, 80, 200, 0.06) 0%, transparent 55%)
          `,
        }}
      />
      
      {/* Header - always visible */}
      <AppHeader />
      
      <Sidebar />
      
      <main
        className={`flex-1 mt-16 relative z-10 ${
          isCollapsed ? 'md:ml-[68px]' : 'md:ml-52 lg:ml-60'
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthCheck>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </AuthCheck>
  );
}
