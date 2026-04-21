'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import type { ReactNode } from 'react';
import { AuthCheck } from './AuthCheck';
import { AppHeader } from '@/components/ui/app-header';

function LayoutContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient background - behind everything */}
      <FlowBackground
        variant="dashboard"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      {/* Gradient overlay — light: soft pastels, dark: rich purples */}
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

      {/* Header - always visible */}
      <AppHeader />

      <Sidebar />

      <main
        className={`flex-1 pt-16 relative z-10 ${
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
