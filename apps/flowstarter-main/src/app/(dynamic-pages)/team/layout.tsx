'use client';

import { SidebarProvider } from '@/contexts/SidebarContext';
import { FlowBackground } from '@flowstarter/flow-design-system';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="relative min-h-screen">
        <FlowBackground
          variant="dashboard"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </SidebarProvider>
  );
}
