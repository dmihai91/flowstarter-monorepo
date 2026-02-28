'use client';

import { LoadingScreen } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SSOCallbackPage() {
  const { t } = useTranslations();

  useEffect(() => {
    // Set a timeout fallback in case something goes wrong
    const timeoutId = setTimeout(() => {
      // If we're still on this page after 10 seconds, redirect to login
      window.location.href = '/login?error=sso_timeout';
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <LoadingScreen message={t('auth.signIn.completingSignIn')} />

      {/* Clerk's SSO callback handler (hidden behind loader) */}
      <div className="sr-only">
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/team/dashboard"
          signUpForceRedirectUrl="/team/dashboard"
        />
      </div>
    </>
  );
}
