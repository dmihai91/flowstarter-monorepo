'use client';

import FooterCompact from '@/components/FooterCompact';
import { MobileSidebarToggle } from '@/components/ui/mobile-sidebar-toggle';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthCheck } from './AuthCheck';

function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hidesSidebar =
    pathname?.startsWith('/dashboard/new') || pathname?.startsWith('/wizard');

  // Hide footer on all /dashboard/new pages and wizard (full-screen experiences)
  const hidesFooter = hidesSidebar;

  const { isCollapsed } = useSidebar();

  return (
    <>
      <div className="min-h-screen flex flex-col">
        {!hidesSidebar && <Sidebar />}
        {!hidesSidebar && <MobileSidebarToggle />}
        <main
          className={`flex-1 mt-16 ${
            hidesSidebar ? '' : isCollapsed ? 'lg:ml-16' : 'lg:ml-60'
          }`}
        >
          {children}
        </main>
        {!hidesFooter && (
          <div
            className={`${
              hidesSidebar ? '' : isCollapsed ? 'lg:ml-16' : 'lg:ml-60'
            }`}
          >
            <FooterCompact />
          </div>
        )}
      </div>
    </>
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
