'use client';

import { SidebarProvider } from '@/contexts/SidebarContext';
import { FlowBackground } from '@flowstarter/flow-design-system';

export default function TeamAdminLayoutClient({
  children,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  initialSidebarCollapsed: boolean;
}) {
  return (
    <SidebarProvider initialCollapsed={initialSidebarCollapsed}>
      <div className="relative min-h-screen">
        {/* `landing` variant matches the editor + auth pages so the
            Flowstarter orbs read consistently across the whole product.
            The previous "dashboard" variant was muted to ~0.12 bloom
            which made the brand pattern nearly invisible on admin. */}
        <FlowBackground
          variant="landing"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </SidebarProvider>
  );
}
