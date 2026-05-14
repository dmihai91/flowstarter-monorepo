'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@flowstarter/flow-design-system';
import { isSafeRedirectUrl } from '@flowstarter/platform-config';

interface AuthRedirectWrapperProps {
  children: React.ReactNode;
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
      // The team login page renders a "this account isn't an admin" sign-out
      // UI when middleware bounces a non-team user to /admin/login?reason=not_admin.
      // Auto-redirecting in that state would push the user to /admin/dashboard,
      // which the middleware rejects right back to /admin/login?reason=not_admin —
      // an infinite loop. Skip the redirect and let the host page render its own UI.
      if (searchParams.get('reason') === 'not_admin') {
        setShowLoading(false);
        return;
      }

      setShowLoading(true);

      // Check for redirect_url parameter (e.g., from editor satellite app)
      const redirectUrl = searchParams.get('redirect_url');
      const nextUrl = searchParams.get('next');
      const targetUrl = redirectUrl || nextUrl;

      // Add a small delay to ensure loading state is visible and smooth transition
      const redirectTimer = setTimeout(async () => {
        if (targetUrl && isSafeRedirectUrl(targetUrl)) {
          // For cross-domain redirects (e.g. editor subdomain), use
          // a server-generated sign-in token (__clerk_ticket) so the
          // satellite can establish a session without a registered handshake.
          try {
            const parsed = new URL(targetUrl);
            const isCrossDomain = parsed.hostname !== window.location.hostname;
            if (isCrossDomain) {
              const res = await fetch('/api/auth/transfer-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ redirectUrl: targetUrl }),
              });
              if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
                return;
              }
            }
          } catch {
            // fall through to plain redirect
          }
          window.location.href = targetUrl;
        } else {
          // Default: go to team dashboard
          router.push('/admin/dashboard');
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
