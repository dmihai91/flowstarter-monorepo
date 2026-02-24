'use client';

import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function MainPagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isLoggedInPage =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/projects/') ||
    pathname?.startsWith('/wizard') ||
    pathname?.startsWith('/help');

  // Hide footer on landing page (has its own) and logged-in pages
  const hideFooter = isLandingPage || isLoggedInPage;

  return (
    <>
      {children}
      {!hideFooter && <Footer />}
    </>
  );
}
