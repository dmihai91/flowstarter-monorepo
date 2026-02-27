'use client';

import { GradientBackground } from '@/components/ui/gradient-background';
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
      <GradientBackground variant="dashboard" className="fixed inset-0 z-0" />
      
      {/* Header - always visible */}
      <ClientHeader />
      
      <Sidebar />
      
      <main
        className={`flex-1 mt-16 relative z-10 ${
          isCollapsed ? 'md:ml-[68px]' : 'md:ml-64'
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
