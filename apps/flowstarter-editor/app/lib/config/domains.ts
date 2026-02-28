/**
 * Domain and URL Configuration
 *
 * Centralized configuration for all domains and URLs used across the application.
 * Uses environment variables with sensible fallbacks based on the current domain.
 */

/**
 * Get the main platform URL from environment variables or current domain
 */
export function getMainPlatformUrl(): string {
  // Try environment variable first (for explicit configuration)
  const envUrl = import.meta.env.VITE_MAIN_PLATFORM_URL;

  if (envUrl) {
    return envUrl;
  }

  // Fallback: derive from current domain
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const hostname = window.location.hostname;

  // Check for production domain
  if (hostname.includes('flowstarter.app')) {
    return 'https://flowstarter.app';
  }

  // Check for dev domain
  if (hostname.includes('flowstarter.dev')) {
    return 'https://flowstarter.dev';
  }

  // Default to localhost for local development
  return 'http://localhost:3000';
}

/**
 * Get the shared cookie domain for cross-subdomain authentication
 */
export function getSharedCookieDomain(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const hostname = window.location.hostname;

  if (hostname.includes('flowstarter.app')) {
    return '.flowstarter.app';
  }

  if (hostname.includes('flowstarter.dev')) {
    return '.flowstarter.dev';
  }

  return undefined;
}

/**
 * Get the preview/display domain for published projects
 */
export function getPreviewDomain(): string {
  const envDomain = import.meta.env.VITE_PREVIEW_DOMAIN;

  if (envDomain) {
    return envDomain;
  }

  // Fallback based on current domain
  if (typeof window === 'undefined') {
    return 'flowstarter.app';
  }

  const hostname = window.location.hostname;

  if (hostname.includes('flowstarter.app')) {
    return 'flowstarter.app';
  }

  if (hostname.includes('flowstarter.dev')) {
    return 'flowstarter.dev';
  }

  // Default to production domain
  return 'flowstarter.app';
}

/**
 * Generate a preview URL for a project
 */
export function generatePreviewUrl(slug: string): string {
  const domain = getPreviewDomain();
  return `https://${slug}.${domain}`;
}

/**
 * Get the public-facing homepage URL for the main platform.
 * Always returns the real website URL (never localhost).
 * Use this for user-facing links like the logo.
 */
export function getMainPlatformHomepage(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname.includes('flowstarter.app')) {
      return 'https://flowstarter.app';
    }
  }

  // Default to dev/staging domain (covers local dev + flowstarter.dev)
  return 'https://flowstarter.dev';
}

/**
 * Get the Calendly discovery URL
 */
export function getCalendlyUrl(): string {
  return import.meta.env.VITE_CALENDLY_DISCOVERY_URL || 'https://calendly.com/flowstarter-app/discovery';
}

/**
 * Get the Flowstarter API base URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'https://api.flowstarter.app/v1';
}

/**
 * Get the shared cookie domain from a request URL (server-side).
 * Returns the parent domain (e.g., '.flowstarter.dev') for cross-subdomain auth.
 */
export function getSharedCookieDomainFromRequest(requestUrl: string): string {
  try {
    const url = new URL(requestUrl);

    if (url.hostname.includes('flowstarter.app')) {
      return '.flowstarter.app';
    }

    if (url.hostname.includes('flowstarter.dev')) {
      return '.flowstarter.dev';
    }
  } catch {
    // Invalid URL
  }

  return '';
}

/**
 * Determine if the editor is running as a Clerk satellite app.
 * Returns true when running on a flowstarter subdomain (not localhost).
 */
export function isEditorSatellite(requestUrl: string): boolean {
  try {
    const url = new URL(requestUrl);
    return url.hostname.includes('flowstarter.dev') || url.hostname.includes('flowstarter.app');
  } catch {
    return false;
  }
}

/**
 * Get the sign-in URL for Clerk authentication
 * Works both client-side and server-side
 */
export function getSignInUrl(requestUrl?: string): string {
  // Server-side: check process.env first, then derive from request
  if (typeof window === 'undefined') {
    const envUrl = process.env.CLERK_SIGN_IN_URL || process.env.VITE_SIGN_IN_URL;

    if (envUrl) {
      return envUrl;
    }

    // Derive from request URL if provided
    if (requestUrl) {
      try {
        const url = new URL(requestUrl);
        const hostname = url.hostname;

        if (hostname.includes('flowstarter.app')) {
          return 'https://flowstarter.app/login';
        }

        if (hostname.includes('flowstarter.dev')) {
          return 'https://flowstarter.dev/login';
        }
      } catch {
        // Invalid URL, fall through
      }
    }

    return 'https://flowstarter.dev/login'; // Default fallback
  }

  // Client-side: use import.meta.env or derive from current domain
  const envUrl = import.meta.env.VITE_SIGN_IN_URL;

  if (envUrl) {
    return envUrl;
  }

  const mainUrl = getMainPlatformUrl();

  return `${mainUrl}/login`;
}

/**
 * Get the sign-up URL for Clerk authentication
 * Works both client-side and server-side
 */
export function getSignUpUrl(requestUrl?: string): string {
  // Server-side: check process.env first, then derive from request
  if (typeof window === 'undefined') {
    const envUrl = process.env.CLERK_SIGN_UP_URL || process.env.VITE_SIGN_UP_URL;

    if (envUrl) {
      return envUrl;
    }

    // Derive from request URL if provided
    if (requestUrl) {
      try {
        const url = new URL(requestUrl);
        const hostname = url.hostname;

        if (hostname.includes('flowstarter.app')) {
          return 'https://flowstarter.app/login';
        }

        if (hostname.includes('flowstarter.dev')) {
          return 'https://flowstarter.dev/login';
        }
      } catch {
        // Invalid URL, fall through
      }
    }

    return 'https://flowstarter.dev/login'; // Default fallback
  }

  // Client-side: use import.meta.env or derive from current domain
  const envUrl = import.meta.env.VITE_SIGN_UP_URL;

  if (envUrl) {
    return envUrl;
  }

  const mainUrl = getMainPlatformUrl();

  return `${mainUrl}/login`;
}
