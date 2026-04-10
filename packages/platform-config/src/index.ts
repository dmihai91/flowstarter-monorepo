/**
 * @flowstarter/platform-config
 *
 * Shared platform domain and URL configuration.
 *
 * All domain logic derives from the current hostname or environment variables —
 * no domain strings are hardcoded. To run the platform on a new domain,
 * set PLATFORM_DOMAIN (e.g. "flowstarter.app") and everything adapts.
 */

// ---------------------------------------------------------------------------
// Core: extract the root domain from any hostname
// ---------------------------------------------------------------------------

/**
 * Extracts the root domain (e.g. "flowstarter.dev") from a hostname.
 * Returns undefined for localhost / IP addresses.
 *
 * Examples:
 *   "code.flowstarter.dev"  → "flowstarter.dev"
 *   "flowstarter.app"       → "flowstarter.app"
 *   "localhost"              → undefined
 */
export function getRootDomain(hostname: string): string | undefined {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('[')
  ) {
    return undefined;
  }

  const parts = hostname.split('.');
  if (parts.length < 2) return undefined;

  // Take the last two segments (covers .dev, .app, .com, etc.)
  return parts.slice(-2).join('.');
}

// ---------------------------------------------------------------------------
// Resolve the platform domain
// ---------------------------------------------------------------------------

/**
 * Resolves the platform's root domain from (in priority order):
 *   1. PLATFORM_DOMAIN env var (or NEXT_PUBLIC_PLATFORM_DOMAIN)
 *   2. The current hostname (browser or request)
 *   3. The provided fallback (defaults to "flowstarter.dev")
 */
export function getPlatformDomain(
  hostname?: string,
  fallback = 'flowstarter.dev',
): string {
  // Check env vars (works in Node & Vite)
  const envDomain =
    typeof process !== 'undefined'
      ? process.env.PLATFORM_DOMAIN ?? process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
      : undefined;
  if (envDomain) return envDomain;

  // Vite env (safe access to avoid TS issues across bundlers)
  try {
    const meta: { env?: Record<string, string | undefined> } =
      import.meta as unknown as { env?: Record<string, string | undefined> };
    if (meta.env?.VITE_PLATFORM_DOMAIN) return meta.env.VITE_PLATFORM_DOMAIN;
  } catch {
    // Not in a Vite context
  }

  // Derive from hostname
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : undefined);

  if (host) {
    const root = getRootDomain(host);
    if (root) return root;
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/** Main platform URL: `https://flowstarter.dev` */
export function getMainUrl(hostname?: string): string {
  return `https://${getPlatformDomain(hostname)}`;
}

/** Subdomain URL: `https://code.flowstarter.dev` */
export function getSubdomainUrl(sub: string, hostname?: string): string {
  return `https://${sub}.${getPlatformDomain(hostname)}`;
}

/** Team login URL with optional redirect */
export function getTeamLoginUrl(
  redirectUrl?: string,
  hostname?: string,
): string {
  const base = `${getMainUrl(hostname)}/team/login`;
  if (!redirectUrl) return base;
  const url = new URL(base);
  url.searchParams.set('redirect_url', redirectUrl);
  return url.toString();
}

/** Client login URL */
export function getLoginUrl(hostname?: string): string {
  return `${getMainUrl(hostname)}/login`;
}

// ---------------------------------------------------------------------------
// Cookie domain
// ---------------------------------------------------------------------------

/**
 * Returns the shared cookie domain (e.g. `.flowstarter.dev`)
 * for cross-subdomain session sharing.
 * Returns undefined for localhost.
 */
export function getSharedCookieDomain(hostname?: string): string | undefined {
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : undefined);

  if (!host) return undefined;

  const root = getRootDomain(host);
  return root ? `.${root}` : undefined;
}

/**
 * Server-side variant: extracts cookie domain from a request URL string.
 */
export function getSharedCookieDomainFromUrl(requestUrl: string): string | undefined {
  try {
    return getSharedCookieDomain(new URL(requestUrl).hostname);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Trust checks
// ---------------------------------------------------------------------------

/**
 * Returns true if the hostname belongs to the same platform.
 * Works for any domain — no hardcoded list.
 *
 * Checks:
 *   - Same root domain as current platform
 *   - Localhost (always trusted in dev)
 */
export function isTrustedHost(
  hostname: string,
  currentHostname?: string,
): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

  const platformDomain = getPlatformDomain(currentHostname);
  const targetRoot = getRootDomain(hostname);

  return targetRoot === platformDomain;
}

/**
 * Validates that a redirect URL is safe (same platform or localhost).
 */
export function isSafeRedirectUrl(
  url: string,
  currentHostname?: string,
): boolean {
  try {
    const parsed = new URL(url);
    return isTrustedHost(parsed.hostname, currentHostname);
  } catch {
    return false;
  }
}

/**
 * Returns true if running on a deployed platform domain (not localhost).
 */
export function isDeployedHost(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : undefined);

  if (!host) return false;
  return getRootDomain(host) !== undefined;
}

// ---------------------------------------------------------------------------
// Team email domains
// ---------------------------------------------------------------------------

/**
 * Returns the list of email domains considered "internal team".
 * Derives from the platform domain + common TLD variants.
 */
export function getTeamEmailDomains(hostname?: string): string[] {
  const root = getPlatformDomain(hostname);
  const base = root.split('.')[0]; // e.g. "flowstarter"

  // Include common TLD variants for the same brand
  const tlds = ['app', 'dev', 'com'];
  return tlds.map((tld) => `${base}.${tld}`);
}

/**
 * Returns true if the email belongs to an internal team domain.
 */
export function isTeamEmail(
  email: string | null | undefined,
  hostname?: string,
): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return getTeamEmailDomains(hostname).includes(domain);
}

// ---------------------------------------------------------------------------
// Allowed redirect origins (for Clerk, CORS, etc.)
// ---------------------------------------------------------------------------

/**
 * Returns the list of allowed redirect origins for auth providers.
 * Includes common subdomains + localhost for dev.
 */
export function getAllowedRedirectOrigins(hostname?: string): string[] {
  const domain = getPlatformDomain(hostname);
  return [
    `https://${domain}`,
    `https://code.${domain}`,
    `https://editor.${domain}`,
    `https://library.${domain}`,
    'http://localhost:3000',
    'http://localhost:3100',
    'http://localhost:5173',
  ];
}
