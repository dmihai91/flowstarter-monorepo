'use client';

import { LoadingScreen } from '@flowstarter/flow-design-system';
import {
  getIsErrorPage,
  resetErrorPageFlag,
} from '@/contexts/ErrorPageContext';
import { I18nProvider, useTranslations } from '@/lib/i18n';
import en from '@/locales/en';
import ro from '@/locales/ro';
import { useWizardStore } from '@/store/wizard-store';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ExternalNavigation, ExternalNavigationWithAuth } from './Navbar';

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/login',
  '/sign-up',
  '/team',
  '/team/login',
];

// Routes where we hide the default navbar (they have their own header)
const noNavbarRoutes = [
  '/',
  '/team',
  '/team/login',
  '/team/dashboard',
  '/team/dashboard/new',
  // Support pages with SupportHeader
  '/help',
  '/contact',
  '/about',
  '/privacy',
  '/terms',
  '/cookies',
  '/pricing',
];

export function NavigationWrapper() {
  const pathname = usePathname() || '';

  // Check for team routes early - they have their own layout
  const isTeamRoute = pathname.startsWith('/team');

  const { isLoaded } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const isDraftDiscarding = useWizardStore((state) => state.isDiscarding);
  const skipLoadingScreen = useWizardStore((state) => state.skipLoadingScreen);
  const loaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPublicRoute = publicRoutes.includes(pathname) || isTeamRoute;
  const { t } = useTranslations();
  const [hasSeenInitial, setHasSeenInitial] = useState(false);
  const isDashboardRoute = pathname === '/dashboard';
  const isWizardRoute = pathname === '/dashboard/new';
  const isClientDashboard = pathname.startsWith('/dashboard'); // Client dashboard has its own header
  const isNoNavbarRoute = noNavbarRoutes.includes(pathname) || isTeamRoute || isClientDashboard;
  const [, setIsErrorPage] = useState(false);

  // Check synchronously during render to catch error pages immediately
  // This ensures the navbar is hidden even on the first render
  const errorPageFlag = getIsErrorPage();
  const shouldHideNavbar = errorPageFlag || isNoNavbarRoute;

  // Sync state with flag for useEffect dependencies
  useEffect(() => {
    if (isTeamRoute) return; // Skip for team routes
    setIsErrorPage(errorPageFlag);
  }, [errorPageFlag, isTeamRoute]);

  // Poll periodically to catch error pages that set the flag after NavigationWrapper renders
  useEffect(() => {
    const checkErrorPage = () => {
      const currentFlag = getIsErrorPage();
      setIsErrorPage(currentFlag);
    };

    // Poll periodically to catch error pages that render after NavigationWrapper
    const interval = setInterval(checkErrorPage, 100);

    return () => {
      clearInterval(interval);
    };
  }, [pathname]);

  // Reset error page flag when pathname changes (user navigates away)
  useEffect(() => {
    // Small delay to allow error pages to set the flag if needed
    const timer = setTimeout(() => {
      if (!errorPageFlag && getIsErrorPage()) {
        // Reset the flag if we're not on an error page anymore
        resetErrorPageFlag();
        setIsErrorPage(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, errorPageFlag]);

  // Prevent SSR flash by waiting for client-side mounting
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      try {
        setHasSeenInitial(
          Boolean(window.sessionStorage.getItem('fs_seen_initial_v1'))
        );
      } catch {
        // no-op
      }
    }
  }, []);

  // Listen for draft loading events dispatched by pages (e.g., wizard)
  // Don't show global loading screen for draft fetches on dashboard page
  // Don't show if wizard has skipLoadingScreen enabled
  useEffect(() => {
    const handleStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Skip showing loader if we're on dashboard and it's just a draft fetch
      if (isDashboardRoute && customEvent.detail?.scope === 'draftFetch') {
        return;
      }
      // Skip showing loader if wizard wants to skip it (e.g., quick mode)
      if (isWizardRoute && skipLoadingScreen) {
        return;
      }
      setIsDraftLoading(true);
    };
    const handleEnd = () => setIsDraftLoading(false);
    window.addEventListener('draft-loading-start', handleStart);
    window.addEventListener('draft-loading-end', handleEnd);

    return () => {
      window.removeEventListener('draft-loading-start', handleStart);
      window.removeEventListener('draft-loading-end', handleEnd);
    };
  }, [isDashboardRoute, isWizardRoute, skipLoadingScreen]);

  // Remove route-driven loader; rely solely on query events
  useEffect(() => {
    return () => {
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current);
        loaderTimeoutRef.current = null;
      }
    };
  }, []);

  // Persist that we've already shown the initial loader once per tab session
  useEffect(() => {
    if (!hasSeenInitial && isMounted && (isPublicRoute || isLoaded)) {
      try {
        window.sessionStorage.setItem('fs_seen_initial_v1', '1');
      } catch {
        // ignore
      }
      setHasSeenInitial(true);
    }
  }, [hasSeenInitial, isMounted, isLoaded, isPublicRoute]);

  // Show the general app loader once on the very first load of the app (public or protected)
  // Never show for team routes - they handle their own loading
  const shouldShowInitial =
    !isTeamRoute && !hasSeenInitial && (!isMounted || !isLoaded);

  // Consolidate all loading conditions to prevent duplicate loading screens
  // Never show for team routes
  const showLoading =
    !isTeamRoute &&
    (shouldShowInitial ||
      isDraftLoading ||
      isDraftDiscarding ||
      !isMounted ||
      (!isPublicRoute && !isLoaded));

  // Don't render navigation for template previews, error pages, or team routes
  // Check this FIRST before any loading logic to prevent flicker
  if (shouldHideNavbar) {
    return null;
  }

  // Don't render navbar until client is mounted - prevents SSR hydration flash
  if (!isMounted) {
    return null;
  }

  if (showLoading && !shouldHideNavbar) {
    // Determine message based on context and priority
    let message = t('app.loadingExperience');

    if (isDraftDiscarding) {
      message = t('draft.discardingDraft');
    } else if (isDraftLoading && !shouldShowInitial) {
      message = t('draft.restoringDraft');
    } else if (isDashboardRoute) {
      message = t('dashboard.loading');
    } else if (isWizardRoute) {
      message = t('wizard.loading');
    }

    return <LoadingScreen message={message} />;
  }

  return isPublicRoute ? (
    <I18nProvider initialLocale="en" initialMessages={{ en, ro }}>
      <ExternalNavigation />
    </I18nProvider>
  ) : (
    <I18nProvider initialLocale="en" initialMessages={{ en, ro }}>
      <ExternalNavigationWithAuth />
    </I18nProvider>
  );
}
