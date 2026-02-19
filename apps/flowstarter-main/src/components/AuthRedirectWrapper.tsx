'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

export function AuthRedirectWrapper({ children }: AuthRedirectWrapperProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [showLoading, setShowLoading] = useState(true); // Show loading by default
  const { t } = useTranslations();
  const router = useRouter();

  useEffect(() => {
    // If Clerk has loaded and user is signed in, show loading and redirect
    if (isLoaded && isSignedIn) {
      setShowLoading(true);
      // Add a small delay to ensure loading state is visible and smooth transition
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 150);

      return () => clearTimeout(redirectTimer);
    }

    // If Clerk has loaded and user is not signed in, hide loading
    if (isLoaded && !isSignedIn) {
      setShowLoading(false);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading screen while Clerk is loading or while redirecting authenticated users
  if (!isLoaded || (isLoaded && isSignedIn && showLoading)) {
    return (
      <LoadingScreen
        message={
          isSignedIn ? t('app.redirectingToDashboard') : t('app.loading')
        }
      />
    );
  }

  // User is not signed in, show the landing page
  return <>{children}</>;
}
