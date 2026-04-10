/**
 * Domain and URL Configuration
 *
 * Thin wrappers around @flowstarter/platform-config.
 * Kept for backward-compatibility with existing editor imports.
 */

import {
  getMainUrl,
  getPlatformDomain,
  getSharedCookieDomain as sharedCookieDomain,
  getSharedCookieDomainFromUrl,
  isDeployedHost,
  getLoginUrl,
} from '@flowstarter/platform-config';

/**
 * Get the main platform URL from environment variables or current domain
 */
export function getMainPlatformUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env
          ?.VITE_MAIN_PLATFORM_URL
      : undefined;
  if (envUrl) return envUrl;
  return getMainUrl();
}

/**
 * Get the shared cookie domain for cross-subdomain authentication
 */
export function getSharedCookieDomain(): string | undefined {
  return sharedCookieDomain();
}

/**
 * Get the preview/display domain for published projects
 */
export function getPreviewDomain(): string {
  const envDomain =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env
          ?.VITE_PREVIEW_DOMAIN
      : undefined;
  if (envDomain) return envDomain;
  return getPlatformDomain();
}

/**
 * Generate a preview URL for a project
 */
export function generatePreviewUrl(slug: string): string {
  return `https://${slug}.${getPreviewDomain()}`;
}

/**
 * Get the public-facing homepage URL for the main platform.
 */
export function getMainPlatformHomepage(): string {
  return getMainUrl();
}

/**
 * Get the Calendly discovery URL
 */
export function getCalendlyUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env
          ?.VITE_CALENDLY_DISCOVERY_URL
      : undefined;
  return envUrl || 'https://calendly.com/flowstarter-app/discovery';
}

/**
 * Get the Flowstarter API base URL
 */
export function getApiBaseUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env
          ?.VITE_API_BASE_URL
      : undefined;
  if (envUrl) return envUrl;
  return `https://api.${getPlatformDomain()}/v1`;
}

/**
 * Get the shared cookie domain from a request URL (server-side).
 */
export { getSharedCookieDomainFromUrl as getSharedCookieDomainFromRequest };

/**
 * Determine if the editor is running as a Clerk satellite app.
 */
export function isEditorSatellite(requestUrl: string): boolean {
  try {
    return isDeployedHost(new URL(requestUrl).hostname);
  } catch {
    return false;
  }
}

/**
 * Get the sign-in URL for Clerk authentication
 */
export function getSignInUrl(requestUrl?: string): string {
  const envUrl =
    typeof window === 'undefined'
      ? process.env.CLERK_SIGN_IN_URL || process.env.VITE_SIGN_IN_URL
      : typeof import.meta !== 'undefined'
        ? (import.meta as { env?: Record<string, string | undefined> }).env
            ?.VITE_SIGN_IN_URL
        : undefined;
  if (envUrl) return envUrl;

  if (requestUrl) {
    try {
      return getLoginUrl(new URL(requestUrl).hostname);
    } catch {
      // fall through
    }
  }
  return getLoginUrl();
}

/**
 * Get the sign-up URL for Clerk authentication
 */
export function getSignUpUrl(requestUrl?: string): string {
  const envUrl =
    typeof window === 'undefined'
      ? process.env.CLERK_SIGN_UP_URL || process.env.VITE_SIGN_UP_URL
      : typeof import.meta !== 'undefined'
        ? (import.meta as { env?: Record<string, string | undefined> }).env
            ?.VITE_SIGN_UP_URL
        : undefined;
  if (envUrl) return envUrl;

  if (requestUrl) {
    try {
      return getLoginUrl(new URL(requestUrl).hostname);
    } catch {
      // fall through
    }
  }
  return getLoginUrl();
}
