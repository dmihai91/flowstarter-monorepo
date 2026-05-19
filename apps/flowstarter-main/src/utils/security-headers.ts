import { createSecureHeaders } from 'next-secure-headers';
import { NextResponse } from 'next/server';

/**
 * Security Headers Configuration
 *
 * CSP Strategy:
 * - We use 'strict-dynamic' with nonces for scripts (Next.js generates nonces automatically)
 * - 'unsafe-inline' is kept for styles due to CSS-in-JS limitations, but with strict source restrictions
 * - All external resources are explicitly allowlisted
 */

// Allowed external domains
const ALLOWED_SCRIPT_DOMAINS = [
  "'self'",
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://*.clerk.accounts.dev',
  // Cal.com booking widget used inside Astro template previews
  'https://app.cal.com',
  'https://cal.com',
  process.env.NEXT_PUBLIC_SITE_URL,
];

const ALLOWED_CONNECT_DOMAINS = [
  "'self'",
  // Supabase
  'https://*.supabase.co',
  'wss://*.supabase.co',
  // Clerk
  'https://api.clerk.com',
  'https://api.clerk.dev',
  'https://*.clerk.accounts.dev',
  // Google Analytics
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  // Clerk telemetry
  'https://clerk-telemetry.com',
];

const ALLOWED_IMG_DOMAINS = [
  "'self'",
  'data:',
  'blob:',
  'https://*.supabase.co',
  'https://*.supabase.com',
  'https://images.unsplash.com',
  'https://*.unsplash.com',
  'https://img.clerk.com',
  'https://img.clerk.dev',
  'https://*.clerk.com',
  'https://*.clerk.dev',
  'https://www.google-analytics.com',
  // Template thumbnails served from Cloudflare R2
  'https://assets.flowstarter.dev',
];

const ALLOWED_FONT_DOMAINS = ["'self'", 'https://fonts.gstatic.com', 'data:'];

/**
 * In dev, allow browser calls to the same machine on a LAN IP when
 * `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_EDITOR_URL` point at http://192.168.x.x:…
 */
function devHttpWsConnectSrcExtras(): string {
  const urls = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_EDITOR_URL,
  ];
  const parts: string[] = [];
  for (const raw of urls) {
    const u = raw?.trim();
    if (!u?.startsWith('http')) continue;
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
      parts.push(parsed.origin);
      const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      parts.push(`${wsProto}//${parsed.host}`);
    } catch {
      /* skip */
    }
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

const ALLOWED_FRAME_DOMAINS = [
  'https://accounts.google.com', // Google OAuth
  'https://*.clerk.accounts.dev', // Clerk OAuth
  'https://challenges.cloudflare.com', // Turnstile if used
  'https://calendly.com', // Calendly inline embed
  // Cal.com booking widget embedded inside Astro template previews
  'https://cal.com',
  'https://*.cal.com',
  // Library "Live template" iframes for shipped client work. The detail
  // page at /library/templates/<slug> renders the client's live site
  // when the entry sets `externalPreviewUrl`. Each origin must be
  // allowlisted explicitly here or the browser will block the frame
  // under our own CSP (the client site can ALSO block framing via its
  // own X-Frame-Options / frame-ancestors — that we can't override).
  'https://ux-journey.com',
  'https://lebadusularticoledepescuit.ro',
  // Concierge discovery funnel (step 7): the live preview embeds the
  // generated site while it runs in its Daytona sandbox. PreviewStep.tsx
  // frames https://<port>-<sandboxId>.daytonaproxy01.net — without this
  // the browser blocks the frame under our own CSP and the wizard
  // preview stays permanently blank.
  'https://*.daytonaproxy01.net',
];

// Create headers without CSP (we'll add it dynamically with nonce)
const baseHeaders = createSecureHeaders({
  forceHTTPSRedirect: [
    true,
    { maxAge: 60 * 60 * 24 * 730, includeSubDomains: true },
  ],
  referrerPolicy: 'strict-origin-when-cross-origin',
  frameGuard: 'deny',
  nosniff: 'nosniff',
});

/**
 * Build CSP header value
 * @param nonce - Optional nonce for inline scripts (generated per-request)
 */
export function buildCSPHeader(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const nonceToken = nonce ? `'nonce-${nonce}'` : undefined;

  // In development, use relaxed CSP to allow Next.js hot reload and dev scripts.
  // In production, use nonce + host allowlist. We deliberately do NOT emit
  // `'strict-dynamic'` here — it would override the host allowlist and block
  // external `<script src="https://...clerk.accounts.dev/...">` tags that
  // Clerk's SDK injects without a nonce, breaking auth on every page that
  // loads Clerk. The nonce still locks down all inline scripts, and the
  // allowlist still constrains which third-party hosts can serve scripts.
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...ALLOWED_SCRIPT_DOMAINS]
    : nonceToken
    ? ["'self'", nonceToken, ...ALLOWED_SCRIPT_DOMAINS]
    : ["'self'", "'unsafe-inline'", ...ALLOWED_SCRIPT_DOMAINS];

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `worker-src 'self' blob:`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, // CSS-in-JS requires unsafe-inline
    `img-src ${ALLOWED_IMG_DOMAINS.join(' ')}`,
    `connect-src ${ALLOWED_CONNECT_DOMAINS.join(' ')}${
      isDev
        ? `${devHttpWsConnectSrcExtras()} ws://localhost:* http://localhost:*`
        : ''
    }`,
    `font-src ${ALLOWED_FONT_DOMAINS.join(' ')}`,
    `frame-src ${ALLOWED_FRAME_DOMAINS.join(' ')}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Only upgrade insecure requests when the site is actually served over HTTPS.
    // Staging / LAN access over plain HTTP would break all sub-resource loads
    // because the browser would silently rewrite http→https.
    !isDev && process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')
      ? 'upgrade-insecure-requests'
      : '',
  ].filter(Boolean);

  return directives.join('; ');
}

/**
 * Apply security headers to a NextResponse
 * @param response - The NextResponse to modify
 * @param nonce - Optional nonce for CSP (when available from Next.js)
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string) {
  // Apply base headers
  for (const [key, value] of Object.entries(baseHeaders)) {
    if (value !== undefined && value !== null) {
      response.headers.set(key, String(value));
    }
  }

  // Apply CSP with nonce if provided
  response.headers.set('Content-Security-Policy', buildCSPHeader(nonce));

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
}

/**
 * Get CSP header for use in Next.js metadata
 * This is for the static CSP without nonces
 */
export function getStaticCSPHeader(): string {
  return buildCSPHeader();
}
