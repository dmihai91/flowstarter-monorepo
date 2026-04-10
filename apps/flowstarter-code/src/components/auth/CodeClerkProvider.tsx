'use client';

import { ClerkProvider } from '@clerk/nextjs';
import {
  getSharedCookieDomain,
  getTeamLoginUrl,
  getAllowedRedirectOrigins,
} from '@flowstarter/platform-config';

export function CodeClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      domain={getSharedCookieDomain()}
      signInUrl={getTeamLoginUrl()}
      signUpUrl={getTeamLoginUrl()}
      allowedRedirectOrigins={getAllowedRedirectOrigins()}
    >
      {children}
    </ClerkProvider>
  );
}
