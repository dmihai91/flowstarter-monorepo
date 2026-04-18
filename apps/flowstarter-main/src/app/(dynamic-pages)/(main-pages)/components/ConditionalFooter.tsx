'use client';

import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isRelaunchPage = pathname === '/relaunch';
  const isLoggedInPage =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/projects/') ||
    pathname?.startsWith('/help');

  if (isLandingPage || isRelaunchPage || isLoggedInPage) return null;
  return <Footer />;
}
