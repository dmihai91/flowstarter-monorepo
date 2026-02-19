'use client';

import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function MainPagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoggedInPage =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/projects/') ||
    pathname?.startsWith('/wizard') ||
    pathname?.startsWith('/help');

  return (
    <>
      {children}
      {!isLoggedInPage && <Footer />}
    </>
  );
}
