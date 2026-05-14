'use client';

import {
  createContext,
  useContext,
  useState,
  useLayoutEffect,
  type ReactNode,
} from 'react';

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-collapsed-v2';
const SIDEBAR_COOKIE = SIDEBAR_STORAGE_KEY;
const SIDEBAR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function writeSidebarCookie(collapsed: boolean) {
  if (typeof document === 'undefined') return;
  const value = JSON.stringify(collapsed);
  document.cookie = `${SIDEBAR_COOKIE}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${SIDEBAR_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  /** From server cookie so first paint matches persisted preference (SSR + hydration). */
  initialCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsedState] = useState(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If localStorage differs from the server-provided cookie (e.g. legacy LS-only
  // sessions), reconcile before paint to avoid a width flash.
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === null) return;
      const parsed = JSON.parse(stored);
      if (typeof parsed !== 'boolean') return;
      if (parsed !== initialCollapsed) {
        setIsCollapsedState(parsed);
        writeSidebarCookie(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [initialCollapsed]);

  const setIsCollapsed = (value: boolean) => {
    setIsCollapsedState(value);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
    writeSidebarCookie(value);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        setIsMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
