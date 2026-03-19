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
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
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
  '/api/auth/session(.*)', // Session check for editor SSO
  '/api/contact(.*)', // Public contact form API
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
]);

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // Generate nonce for CSP - passed to layouts via header
  const nonce = generateNonce();
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
        process.env.NEXT_PUBLIC_EDITOR_URL,
        process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : undefined,
        'https://editor.flowstarter.dev',
        'https://editor.flowstarter.app',
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
      // Skip CSRF for team API routes, AI routes, and feedback (protected by Clerk auth)
      const isTeamApi = pathname.startsWith('/api/team/');
      const isAiApi = pathname.startsWith('/api/ai/');
      const isFeedbackApi = pathname === '/api/feedback';
      const isAuthApi = pathname.startsWith('/api/auth/'); // Protected by Clerk auth
      const isEditorApi = pathname.startsWith('/api/editor/'); // Protected by handoff tokens / Clerk auth
      const isProjectsApi = pathname.startsWith('/api/projects/') || pathname === '/api/projects';
      const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      if (unsafe && !isWebhook && !isTeamApi && !isAiApi && !isFeedbackApi && !isAuthApi && !isEditorApi && !isProjectsApi) {
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
          httpOnly: false,
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
      const { userId } = await auth();
      if (userId) {
        // Fetch user to get publicMetadata
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const role = (
          (user.publicMetadata?.role as string) || ''
        ).toLowerCase();
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

  if (isPublicRoute(req)) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    const pathname = req.nextUrl.pathname;
    if (pathname.startsWith('/login') || pathname.startsWith('/sign-up') || pathname.startsWith('/team/login')) {
      try {
        const { userId, sessionClaims } = await auth();
        if (userId) {
          const url = req.nextUrl.clone();
          // Check if user is a team member
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
      const isTeamRoute = req.nextUrl.pathname.startsWith('/team/') ||
        (req.nextUrl.pathname === '/new' && req.nextUrl.searchParams.has('template'));
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
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
