'use client';

import {
  FlowBackground,
  type FlowBackgroundVariant,
} from '@flowstarter/flow-design-system';
import { useSidebar } from '@/contexts/SidebarContext';
import { AppHeader } from '@/components/ui/app-header';
import { useEffect, type ReactNode } from 'react';

type DashboardBaseLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  hideSidebar?: boolean;
  /** FlowBackground variant. Defaults to "landing" so admin pages
   *  inherit the same brand orb intensities as auth + editor. Override
   *  to "dashboard" only when an editorial surface needs the orbs
   *  whisper-quiet behind dense data tables. */
  bgVariant?: FlowBackgroundVariant;
  /** Suppress the dashboard gradient film + grain so FlowBackground is sole atmosphere. */
  quietOverlays?: boolean;
};

export function DashboardBaseLayout({
  children,
  sidebar,
  hideSidebar = false,
  bgVariant = 'landing',
  quietOverlays = false,
}: DashboardBaseLayoutProps) {
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // The dashboard atmosphere overlays were tuned to compensate for the
  // muted "dashboard" FlowBackground variant. When the brighter "landing"
  // variant is in play the overlays fight the orbs — auto-quiet them so
  // admin reads like the editor + auth pages.
  const effectiveQuietOverlays = quietOverlays || bgVariant === 'landing';

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <FlowBackground
        variant={bgVariant}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      {!effectiveQuietOverlays && (
        <>
          <div
            aria-hidden
            className="dashboard-atmosphere-light fixed inset-0 z-[1] pointer-events-none dark:hidden"
          />
          <div
            aria-hidden
            className="dashboard-atmosphere-dark fixed inset-0 z-[1] pointer-events-none hidden dark:block"
          />
          <div
            aria-hidden
            className="dashboard-atmosphere-grain fixed inset-0 z-[2] pointer-events-none opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]"
          />
        </>
      )}

      <AppHeader />
      {!hideSidebar && sidebar}
      <main
        className={`flex-1 pt-16 relative z-10 min-w-0 overflow-y-auto overflow-x-hidden ${
          hideSidebar ? '' : isCollapsed ? 'md:ml-[72px]' : 'md:ml-52 lg:ml-60'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
