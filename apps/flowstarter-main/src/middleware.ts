import {
  ajWithRateLimit,
  createBlockedResponse,
  getRateLimitHeaders,
} from '@/lib/arcjet';
import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server';
import {
  getAllowedRedirectOrigins,
  isSafeRedirectUrl,
} from '@flowstarter/platform-config';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './utils/security-headers';

/**
 * Generate a cryptographically secure nonce for CSP using Web Crypto API
 * (Edge Runtime compatible)
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Timing-safe string comparison using Web Crypto API
 * (Edge Runtime compatible)
 */
async function _timingSafeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // Use subtle crypto to create keys and compare in constant time
  const key = await crypto.subtle.importKey(
    'raw',
    aBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig1 = await crypto.subtle.sign('HMAC', key, aBytes);
  const sig2 = await crypto.subtle.sign('HMAC', key, bBytes);

  const sig1Array = new Uint8Array(sig1);
  const sig2Array = new Uint8Array(sig2);

  if (sig1Array.length !== sig2Array.length) return false;

  let result = 0;
  for (let i = 0; i < sig1Array.length; i++) {
    result |= sig1Array[i] ^ sig2Array[i];
  }

  return result === 0;
}

/**
 * Log security event (Edge Runtime compatible - console only)
 * Full database logging happens in API routes, not middleware
 */
function logSecurityEventEdge(
  event: string,
  context?: { route?: string; method?: string }
): void {
  const logParts = [
    `[SECURITY]`,
    `event=${event}`,
    context?.route ? `route=${context.route}` : null,
    context?.method ? `method=${context.method}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (event.includes('blocked') || event.includes('csrf')) {
    console.warn(logParts);
  } else {
    console.info(logParts);
  }
}

// Create a middleware matcher to determine which routes should be public
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/login(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/verify(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/auth/session(.*)', // Session check
  '/api/contact(.*)', // Public contact form API
  '/api/ecommerce-waitlist(.*)', // Public ecommerce waitlist signup
  '/api/support-chat(.*)', // Public support bot LLM endpoint
  '/gdpr(.*)',
  '/contact(.*)',
  '/help(.*)', // Public help page
  '/privacy(.*)', // Public privacy policy
  '/terms(.*)', // Public terms of service
  '/pricing(.*)', // Public pricing page
  '/cookies(.*)', // Public cookie policy
  '/blog(.*)', // Public blog
  '/guides(.*)',
  '/blogs(.*)',
  '/cookie-policy(.*)',
  '/term-of-service(.*)',
  '/privacy-policy(.*)',
  '/sitemap(.*)',
  '/accessibility(.*)',
  '/security(.*)',
  '/team', // Team index (redirects to login)
  '/team/login(.*)', // Team login page (public, auth handled by Clerk)
  '/team/join(.*)', // Team join/invitation page (public)

  // Public static pages — landing sections, legal, support
  '/about(.*)',
  '/relaunch(.*)',
  '/faq(.*)',
  '/library(.*)', // Public template library (also reachable via library.* subdomain rewrite)
]);

// Routes that only exist if they match a known app path prefix.
// Everything else is a 404 — let Next.js render it instead of redirecting to login.
const isKnownAppRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/login(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/verify(.*)',
  '/sso-callback(.*)',
  '/gdpr(.*)',
  '/contact(.*)',
  '/help(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/pricing(.*)',
  '/cookies(.*)',
  '/blog(.*)',
  '/guides(.*)',
  '/blogs(.*)',
  '/cookie-policy(.*)',
  '/term-of-service(.*)',
  '/privacy-policy(.*)',
  '/sitemap(.*)',
  '/accessibility(.*)',
  '/security(.*)',
  '/faq(.*)',
  '/relaunch(.*)',
  '/team(.*)',
  '/dashboard(.*)',
  '/new(.*)',
  '/api(.*)',
  '/library(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // ── Library subdomain rewrite ─────────────────────────────────────────────
  // The library lives at https://library.flowstarter.net but is served from
  // the same Next.js app under /library/*. Rewrite the host to the internal
  // route segment so the address bar stays clean (no /library/ prefix).
  // Static asset paths (preview iframes, showcase images, _next, api) must
  // pass through unchanged so the Astro previews and Next runtime keep
  // working from the library subdomain.
  {
    const host = (req.headers.get('host') ?? '').toLowerCase();
    const reqPath = req.nextUrl.pathname;
    const isLibrarySubdomain = host.startsWith('library.');
    const passThrough =
      reqPath.startsWith('/library') ||
      reqPath.startsWith('/_next') ||
      reqPath.startsWith('/api') ||
      reqPath.startsWith('/preview') ||
      reqPath.startsWith('/showcase') ||
      reqPath.startsWith('/favicon') ||
      reqPath === '/robots.txt' ||
      reqPath === '/sitemap.xml' ||
      reqPath === '/manifest.json';
    if (isLibrarySubdomain && !passThrough) {
      const url = req.nextUrl.clone();
      url.pathname = `/library${reqPath === '/' ? '' : reqPath}`;
      return NextResponse.rewrite(url);
    }
  }

  // Generate nonce for CSP - must be forwarded as a REQUEST header so
  // server components (layout.tsx) can read it via headers(). Setting it
  // only on the response headers is not visible to server components.
  const nonce = generateNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Also set on response so it can be inspected during debugging
  res.headers.set('x-nonce', nonce);

  // --- Path traversal protection ---
  // Block any request with path traversal patterns in the URL
  const rawUrl = req.url;
  const pathname = req.nextUrl.pathname;

  // Check for path traversal patterns (including URL-encoded variants)
  const pathTraversalPatterns = [
    /\.\.\//g, // ../
    /\.\.%2[Ff]/gi, // URL-encoded ../
    /%2[Ee]%2[Ee]%2[Ff]/gi, // Double URL-encoded
    /\.\.[\\/]/g, // ..\ or ../
    /%2[Ee]{2}/gi, // %2E%2E (encoded ..)
  ];

  const hasPathTraversal = pathTraversalPatterns.some(
    (pattern) => pattern.test(rawUrl) || pattern.test(pathname)
  );

  if (hasPathTraversal) {
    logSecurityEventEdge('security.path_traversal_blocked', {
      route: pathname,
      method: req.method,
    });
    const response = NextResponse.json(
      { error: 'Invalid request path', code: 'BAD_REQUEST' },
      { status: 400 }
    );
    applySecurityHeaders(response, nonce);
    return response;
  }

  // --- CORS, Rate limiting, and CSRF for API routes ---
  try {
    const isApi = pathname.startsWith('/api');
    const isWebhook = pathname.startsWith('/api/webhooks');
    const isHealth = pathname.startsWith('/api/health');

    // CORS allowlist
    if (isApi) {
      const origin = req.headers.get('origin') || '';
      const referer = req.headers.get('referer') || '';
      const siteOrigin = req.nextUrl.origin;
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : undefined,
        // editor.${domain} subdomains are included in getAllowedRedirectOrigins
        // (see @flowstarter/platform-config). No separate EDITOR_URL needed
        // post master-doc realignment.
        ...getAllowedRedirectOrigins(req.headers.get('host') ?? undefined),
      ].filter(Boolean) as string[];
      const isAllowedOrigin = !!origin && allowedOrigins.includes(origin);
      const isSameOrigin =
        (!!origin && origin === siteOrigin) || referer.startsWith(siteOrigin);

      const applyCorsHeaders = (response: NextResponse) => {
        if (isAllowedOrigin) {
          response.headers.set('Access-Control-Allow-Origin', origin);
          response.headers.set('Vary', 'Origin');
          response.headers.set(
            'Access-Control-Allow-Methods',
            'GET,POST,PUT,PATCH,DELETE,OPTIONS'
          );
          response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-CSRF-Token'
          );
          response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
      };

      // Preflight handling
      if (req.method === 'OPTIONS') {
        if (!isAllowedOrigin) {
          return new NextResponse(null, { status: 403 });
        }
        const preflight = new NextResponse(null, { status: 204 });
        applyCorsHeaders(preflight);
        applySecurityHeaders(preflight, nonce);
        return preflight;
      }

      // CSRF: rely on same-origin checks; block cross-origin unsafe methods
      // Skip CSRF for team API routes, AI routes, and integration routes (protected by Clerk auth)
      const isTeamApi = pathname.startsWith('/api/team/');
      const isAiApi = pathname.startsWith('/api/ai/');
      const isAuthApi = pathname.startsWith('/api/auth/'); // Protected by Clerk auth
      const isIntegrationsApi = pathname.startsWith('/api/integrations/'); // Protected by Clerk auth
      const isAnalyticsApi = pathname.startsWith('/api/analytics/'); // Protected by Clerk auth
      const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      if (
        unsafe &&
        !isWebhook &&
        !isTeamApi &&
        !isAiApi &&
        !isAuthApi &&
        !isIntegrationsApi &&
        !isAnalyticsApi
      ) {
        if (!isSameOrigin) {
          // Log CSRF block
          logSecurityEventEdge('security.csrf_blocked', {
            route: pathname,
            method: req.method,
          });
          const resp = NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
          applyCorsHeaders(resp);
          applySecurityHeaders(resp, nonce);
          return resp;
        }
      }

      // No CSRF cookie needed when relying on same-origin checks

      // Rate limiting and security using Arcjet (skip webhooks/health)
      const hasArcjet = !!process.env.ARCJET_KEY;
      if (hasArcjet && !isWebhook && !isHealth) {
        try {
          const decision = await ajWithRateLimit.protect(req);

          // Check if request is denied
          const blockedResponse = createBlockedResponse(decision);
          if (blockedResponse) {
            // Log security block (rate limit, bot, or shield)
            const reason = decision.reason;
            const eventType = reason.isRateLimit()
              ? 'security.rate_limited'
              : reason.isBot()
              ? 'security.bot_blocked'
              : 'security.shield_blocked';
            logSecurityEventEdge(eventType, { route: pathname });

            applyCorsHeaders(blockedResponse);
            applySecurityHeaders(blockedResponse, nonce);
            return blockedResponse;
          }

          // Add rate limit headers to successful responses
          const rateLimitHeaders = getRateLimitHeaders(decision);
          Object.entries(rateLimitHeaders).forEach(([key, value]) => {
            res.headers.set(key, value);
          });
        } catch (arcjetError) {
          // Fail-open: if Arcjet fails, allow the request through
          console.error('[Arcjet] Error during protection:', arcjetError);
        }
      }

      // Attach CORS headers to normal flow response
      applyCorsHeaders(res);
    }
  } catch {
    // Fail-open for infra issues
  }

  try {
    const existing = req.cookies.get('fs_country')?.value;
    if (!existing) {
      // Prefer platform geo detection when available
      // Fallback to Accept-Language header
      const geoCountry = (req as unknown as { geo?: { country?: string } })?.geo
        ?.country;
      const acceptLanguage = req.headers.get('accept-language') || '';
      const inferred =
        geoCountry ||
        (acceptLanguage.toLowerCase().includes('ro') ? 'RO' : undefined);
      if (inferred) {
        res.cookies.set('fs_country', inferred, {
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }
  } catch {
    // ignore cookie/geo issues
  }

  // Check if user is authenticated and redirect based on role
  if (pathname === '/') {
    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        // Prefer the role from sessionClaims (already in the request) so we
        // don't pay a Clerk API roundtrip on every cold landing-page hit.
        let role = (
          sessionClaims?.metadata as { role?: string } | undefined
        )?.role?.toLowerCase();

        // Fallback: only when the claim is missing, fetch the user object.
        if (!role) {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          role = ((user.publicMetadata?.role as string) || '').toLowerCase();
        }

        const isTeamMember = role === 'team' || role === 'admin';

        // Team users → /team/dashboard, Clients → /dashboard
        const targetPath = isTeamMember ? '/team/dashboard' : '/dashboard';

        const url = req.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }
    } catch {
      // User not authenticated, continue to landing page
    }
  }

  // Unknown route — not a known app path at all. Let Next.js serve the 404.
  if (!isKnownAppRoute(req)) {
    applySecurityHeaders(res, nonce);
    return res;
  }

  if (isPublicRoute(req)) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    const pathname = req.nextUrl.pathname;
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/team/login')
    ) {
      try {
        const { userId, sessionClaims } = await auth();
        if (userId) {
          // If there's a safe cross-domain redirect_url, redirect through
          // the transfer-token API route (runs in Node, not Edge).
          const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
          if (redirectUrl) {
            const isSafe = isSafeRedirectUrl(
              redirectUrl,
              req.headers.get('host') ?? undefined
            );
            if (isSafe) {
              try {
                const parsed = new URL(redirectUrl);
                const isCrossDomain =
                  parsed.hostname !==
                  (req.headers.get('host')?.split(':')[0] ?? '');
                if (isCrossDomain) {
                  // Redirect to the transfer-token page route which creates
                  // a Clerk sign-in token and redirects with __clerk_ticket.
                  const transferUrl = req.nextUrl.clone();
                  transferUrl.pathname = '/api/auth/transfer-redirect';
                  transferUrl.searchParams.set('redirect_url', redirectUrl);
                  return NextResponse.redirect(transferUrl);
                }
              } catch {
                // invalid URL — fall through
              }
              return NextResponse.redirect(redirectUrl);
            }
          }

          const url = req.nextUrl.clone();
          // /team/login always goes to team dashboard — avoids stale session claims
          // causing team members to land on client dashboard right after login.
          if (pathname.startsWith('/team/login')) {
            url.pathname = '/team/dashboard';
            return NextResponse.redirect(url);
          }
          // For /login and /sign-up check role
          const role = (
            sessionClaims?.metadata as { role?: string }
          )?.role?.toLowerCase();
          const isTeamMember = role === 'team' || role === 'admin';
          url.pathname = isTeamMember ? '/team/dashboard' : '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch {
        // ignore auth errors for public routes
      }
      // Prevent caching of login/sign-up pages
      res.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
    }
    // Apply baseline security headers even on public routes
    applySecurityHeaders(res, nonce);
    return res;
  }

  // If the route is protected, authenticate the user.
  // For API routes: return 401 JSON response
  // For page routes: redirect to login with return path

  // ── E2E dev bypass — skip Clerk check when secret header present ──────────
  if (process.env.NODE_ENV !== 'production' && process.env.E2E_SECRET) {
    const e2eSecret = req.headers.get('x-e2e-secret');
    if (e2eSecret === process.env.E2E_SECRET) {
      return NextResponse.next();
    }
  }

  // ── Clerk ticket pass-through ─────────────────────────────────────────────
  // Allow __clerk_ticket params through on any page — Clerk JS processes the
  // ticket client-side to establish a session. Redirecting away strips the
  // ticket and the session is never created. The ticket is HMAC-signed by
  // Clerk and single-use, so this is safe.
  if (req.nextUrl.searchParams.has('__clerk_ticket')) {
    return NextResponse.next();
  }

  try {
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      // User is not authenticated
      if (pathname.startsWith('/api')) {
        // For API routes, return 401 JSON response
        logSecurityEventEdge('security.api_unauthorized', {
          route: pathname,
          method: req.method,
        });
        const response = NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
        applySecurityHeaders(response, nonce);
        return response;
      }

      // For page routes, redirect to login with explanatory message and return path
      // Team routes → team login, everything else → client login
      const url = req.nextUrl.clone();
      const next = req.nextUrl.pathname + (req.nextUrl.search || '');
      // /new?template= is an operator flow — send to team login
      const isTeamRoute =
        req.nextUrl.pathname.startsWith('/team/') ||
        (req.nextUrl.pathname === '/new' &&
          req.nextUrl.searchParams.has('template'));
      url.pathname = isTeamRoute ? '/team/login' : '/login';
      url.searchParams.set('reason', 'unauthenticated');
      url.searchParams.set('next', next);
      return NextResponse.redirect(url);
    }

    // User is authenticated, allow the request
    applySecurityHeaders(res, nonce);
    return res;
  } catch (authError) {
    // If auth check fails, block the request for safety
    console.error('[Middleware] Auth error:', authError);
    if (pathname.startsWith('/api')) {
      const response = NextResponse.json(
        { error: 'Authentication failed', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
      applySecurityHeaders(response, nonce);
      return response;
    }
    // For page routes, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'error');
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Run middleware on app routes EXCEPT static assets, Next.js internals,
    // and common static files. The narrower the matcher, the fewer cold-start
    // function invocations we pay on a fresh deploy.
    '/((?!_next/static|_next/image|_next/data|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff|woff2|ttf|otf|eot|mp4|webm)).*)',
    '/api/:path*',
  ],
};
