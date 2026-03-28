'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import type { ReactNode } from 'react';

interface PublicPageLayoutProps {
  children: ReactNode;
}

/**
 * Shared layout for all public/marketing pages (contact, pricing, about, faq, help, etc.)
 * Provides the FlowBackground, SupportHeader, and Footer consistently.
 */
export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col font-display">
      <FlowBackground variant="landing" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <SupportHeader />
      {children}
      <Footer />
    </div>
  );
}
