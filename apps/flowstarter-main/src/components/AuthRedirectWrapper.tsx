'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
}

/**
 * Check if a redirect URL is safe (same origin or trusted subdomain)
 */
function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    // Allow same-origin
    if (typeof window !== 'undefined' && hostname === window.location.hostname) {
      return true;
    }
    
    // Allow trusted Flowstarter subdomains
    if (hostname.endsWith('.flowstarter.dev') || hostname.endsWith('.flowstarter.app')) {
      return true;
    }
    if (hostname === 'flowstarter.dev' || hostname === 'flowstarter.app') {
      return true;
    }
    
    // Allow localhost for development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export function AuthRedirectWrapper({ children }: AuthRedirectWrapperProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [showLoading, setShowLoading] = useState(true); // Show loading by default
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If Clerk has loaded and user is signed in, show loading and redirect
    if (isLoaded && isSignedIn) {
      setShowLoading(true);
      
      // Check for redirect_url parameter (e.g., from editor satellite app)
      const redirectUrl = searchParams.get('redirect_url');
      const nextUrl = searchParams.get('next');
      const targetUrl = redirectUrl || nextUrl;
      
      // Add a small delay to ensure loading state is visible and smooth transition
      const redirectTimer = setTimeout(() => {
        if (targetUrl && isSafeRedirectUrl(targetUrl)) {
          // Redirect to the requested URL (e.g., back to editor)
          window.location.href = targetUrl;
        } else {
          // Default: go to team dashboard
          router.push('/team/dashboard');
        }
      }, 150);

      return () => clearTimeout(redirectTimer);
    }

    // If Clerk has loaded and user is not signed in, hide loading
    if (isLoaded && !isSignedIn) {
      setShowLoading(false);
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

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
