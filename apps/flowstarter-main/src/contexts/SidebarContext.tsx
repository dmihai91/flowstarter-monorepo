'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState(false); // Start expanded
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('client-sidebar-collapsed');
      if (stored !== null) {
        setIsCollapsedState(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Persist to localStorage
  const setIsCollapsed = (value: boolean) => {
    setIsCollapsedState(value);
    try {
      localStorage.setItem('client-sidebar-collapsed', JSON.stringify(value));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  // Prevent hydration mismatch by using default until mounted
  const effectiveCollapsed = mounted ? isCollapsed : false;

  return (
    <SidebarContext.Provider
      value={{ 
        isCollapsed: effectiveCollapsed, 
        setIsCollapsed, 
        isMobileOpen, 
        setIsMobileOpen 
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
