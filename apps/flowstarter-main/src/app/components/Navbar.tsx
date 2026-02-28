'use client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AuthButtons,
  DashboardNavControls,
  NavbarHeader,
  NavbarLogo,
  PublicNavLinks,
  useCompactViewport,
  useScrolled,
  useWizardNavbar,
  WizardNavControls,
} from './nav';

export const ExternalNavigationWithAuth = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const isScrolled = useScrolled();
  const isCompact = useCompactViewport();
  const wizardState = useWizardNavbar();

  // Handle mounting state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine logo destination based on auth status
  const logoDestination = isSignedIn ? '/dashboard' : '/';

  // Show loading state until auth is fully loaded to prevent navbar flicker
  if (!isMounted || !isLoaded) {
    return null;
  }

  return (
    <NavbarHeader isScrolled={isScrolled}>
      <NavbarLogo href={logoDestination} />

      {isSignedIn ? (
        <>
          {wizardState.isOnWizard ? (
            <WizardNavControls
              isCompact={isCompact}
              wizardState={wizardState}
            />
          ) : (
            <DashboardNavControls />
          )}
        </>
      ) : (
        <nav className="ml-auto flex gap-3 sm:gap-6 items-center">
          <ThemeToggle className="inline-flex mr-2" />
          <AuthButtons />
        </nav>
      )}
    </NavbarHeader>
  );
};

export const ExternalNavigation = () => {
  const isScrolled = useScrolled();
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login' || pathname === '/sign-up' || pathname?.startsWith('/login') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/sign-in') || pathname?.startsWith('/editor');

  if (isAuthRoute) return null;

  return (
    <NavbarHeader isScrolled={isScrolled} maxWidth="6xl">
      <NavbarLogo href="/" />

      <nav className="ml-auto flex gap-3 sm:gap-6 items-center">
        {!isAuthRoute && <PublicNavLinks />}
        <ThemeToggle className="hidden lg:inline-flex mr-2" />
        {!isAuthRoute && <AuthButtons size="compact" />}
      </nav>
    </NavbarHeader>
  );
};
