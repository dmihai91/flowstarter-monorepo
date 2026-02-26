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
];

const ALLOWED_FONT_DOMAINS = ["'self'", 'https://fonts.gstatic.com', 'data:'];

const ALLOWED_FRAME_DOMAINS = [
  'https://accounts.google.com', // Google OAuth
  'https://*.clerk.accounts.dev', // Clerk OAuth
  'https://challenges.cloudflare.com', // Turnstile if used
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

  // In development, use relaxed CSP to allow Next.js hot reload and dev scripts
  // In production, use strict CSP with nonces
  const scriptSrc = isDev
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...ALLOWED_SCRIPT_DOMAINS]
    : nonce
    ? [`'nonce-${nonce}'`, "'strict-dynamic'", ...ALLOWED_SCRIPT_DOMAINS]
    : ["'self'", "'unsafe-inline'", ...ALLOWED_SCRIPT_DOMAINS];

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, // CSS-in-JS requires unsafe-inline
    `img-src ${ALLOWED_IMG_DOMAINS.join(' ')}`,
    `connect-src ${ALLOWED_CONNECT_DOMAINS.join(' ')}${
      isDev ? ' ws://localhost:* http://localhost:*' : ''
    }`,
    `font-src ${ALLOWED_FONT_DOMAINS.join(' ')}`,
    `frame-src ${ALLOWED_FRAME_DOMAINS.join(' ')}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    isDev ? '' : `upgrade-insecure-requests`, // Skip in dev to allow localhost HTTP
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
