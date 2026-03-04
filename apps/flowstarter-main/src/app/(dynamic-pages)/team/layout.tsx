'use client';

import { SidebarProvider } from '@/contexts/SidebarContext';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
