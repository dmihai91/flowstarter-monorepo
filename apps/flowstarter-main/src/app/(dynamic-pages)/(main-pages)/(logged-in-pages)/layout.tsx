'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import type { ReactNode } from 'react';
import { AuthCheck } from './AuthCheck';
import { DashboardBaseLayout } from '@/components/ui/dashboard-base-layout';

function LayoutContent({ children }: { children: ReactNode }) {
  return (
    <DashboardBaseLayout sidebar={<Sidebar />}>{children}</DashboardBaseLayout>
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
