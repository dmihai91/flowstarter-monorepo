'use client';

import {
  FlowBackground,
  type FlowBackgroundVariant,
} from '@flowstarter/flow-design-system';
import { useSidebar } from '@/contexts/SidebarContext';
import { AppHeader } from '@/components/ui/app-header';
import {
  dashboardDarkOverlay,
  dashboardGrainBackground,
  dashboardLightOverlay,
} from '@/lib/glass';
import { useEffect, type ReactNode } from 'react';

type DashboardBaseLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  hideSidebar?: boolean;
  /** FlowBackground variant. Defaults to "dashboard". Use "landing" to match the
   * marketing site atmosphere on operator-facing surfaces. */
  bgVariant?: FlowBackgroundVariant;
  /** Suppress the dashboard radial-gradient overlays so the FlowBackground
   * carries all of the atmosphere itself. The legacy overlays add a soft
   * purple/blue/pink wash that competes with the editorial glass aesthetic. */
  quietOverlays?: boolean;
};

export function DashboardBaseLayout({
  children,
  sidebar,
  hideSidebar = false,
  bgVariant = 'dashboard',
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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <FlowBackground
        variant={bgVariant}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      {!quietOverlays && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-[1] pointer-events-none dark:hidden"
            style={{ background: dashboardLightOverlay }}
          />
          <div
            aria-hidden
            className="fixed inset-0 z-[1] pointer-events-none hidden dark:block"
            style={{ background: dashboardDarkOverlay }}
          />
          <div
            aria-hidden
            className="fixed inset-0 z-[2] pointer-events-none opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]"
            style={{
              backgroundImage: dashboardGrainBackground,
              backgroundSize: '160px 160px',
            }}
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
