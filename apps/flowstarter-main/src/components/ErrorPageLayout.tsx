'use client';

import { ReactNode } from 'react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import Footer from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { BookingModalProvider } from '@/app/(dynamic-pages)/(main-pages)/components/BookingModalProvider';

interface ErrorPageLayoutProps {
  children: ReactNode;
}

export function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen font-display text-[var(--fs-ink)]">
      <FlowBackground
        variant="landing"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      {/* `landing` is the canonical public header (just "Sign In"). "public"
          isn't a handled SiteHeader mode and fell through to a default that
          rendered both Sign In + Sign Up, looking inconsistent on error pages. */}
      <SiteHeader mode="landing" />

      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-16 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <BookingModalProvider />
      <Footer />
    </div>
  );
}
