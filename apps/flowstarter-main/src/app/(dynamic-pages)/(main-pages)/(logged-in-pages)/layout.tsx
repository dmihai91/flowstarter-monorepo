'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthCheck } from './AuthCheck';
import { ClientHeader } from './dashboard/components/ClientHeader';

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hidesSidebar =
    pathname?.startsWith('/dashboard/new') || pathname?.startsWith('/wizard');

  const { isCollapsed } = useSidebar();

  if (hidesSidebar) {
    // Full-width layout for wizard pages
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
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
            radial-gradient(ellipse at 0% 0%, rgba(77, 93, 217, 0.03) 0%, transparent 45%),
            radial-gradient(ellipse at 100% 20%, rgba(59, 68, 168, 0.02) 0%, transparent 45%),
            radial-gradient(ellipse 130% 70% at 40% 100%, rgba(160, 145, 50, 0.025) 0%, transparent 55%)
          `,
        }}
      />
      
      {/* Header - always visible */}
      <ClientHeader />
      
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
