/**
 * API Route Authentication Utilities
 *
 * Provides standardized authentication checks for API routes.
 * Ensures consistent security patterns across all protected endpoints.
 *
 * @module lib/api-auth
 */

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { createSupabaseServerClient } from '@/supabase-clients/server';

/**
 * Authentication result type
 */
export type AuthResult =
  | {
      authenticated: true;
      userId: string;
      getToken: () => Promise<string | null>;
    }
  | { authenticated: false; response: NextResponse };

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

/**
 * Standard forbidden response (authenticated but not authorized)
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}

/**
 * Check authentication for API routes
 *
 * Returns userId and getToken if authenticated, or a 401 response if not.
 * This should be called at the start of every protected API route handler.
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const authResult = await requireAuth();
 *   if (!authResult.authenticated) {
 *     return authResult.response;
 *   }
 *
 *   const { userId } = authResult;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAuth(request?: Request): Promise<AuthResult> {
  // ── E2E dev bypass ────────────────────────────────────────────────────────
  // Allows Playwright tests to call protected API routes without a browser
  // session. ONLY active in non-production + correct E2E_SECRET header.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.E2E_SECRET &&
    request
  ) {
    const secret = request.headers.get('x-e2e-secret');
    const userId = request.headers.get('x-e2e-user-id');
    if (secret === process.env.E2E_SECRET && userId) {
      // Do not log user ids — keeps dev logs safe for screenshots / CI artifacts.
      return { authenticated: true, userId, getToken: async () => null };
    }
  }

  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      console.warn('[API Auth] No userId found in session');
      return {
        authenticated: false,
        response: unauthorizedResponse('Authentication required'),
      };
    }

    return {
      authenticated: true,
      userId,
      getToken: session.getToken.bind(session),
    };
  } catch (error) {
    console.error('[API Auth] Authentication check failed:', error);
    return {
      authenticated: false,
      response: unauthorizedResponse('Authentication failed'),
    };
  }
}

/**
 * Get authenticated Supabase client or return error response
 *
 * Combines auth check with Supabase client creation.
 * This is the preferred method for API routes that need database access.
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const result = await requireAuthWithSupabase();
 *   if (!result.authenticated) {
 *     return result.response;
 *   }
 *
 *   const { supabase, userId } = result;
 *   const { data } = await supabase.from('projects').select('*');
 *   // ...
 * }
 * ```
 */
type ServerSupabaseClient = ReturnType<typeof createSupabaseServerClient>;

export async function requireAuthWithSupabase(request?: Request): Promise<
  | {
      authenticated: true;
      userId: string;
      supabase: ServerSupabaseClient;
    }
  | { authenticated: false; response: NextResponse }
> {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  // ── E2E bypass: use service-role client (no JWT needed) ───────────────────
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.E2E_SECRET &&
    request?.headers.get('x-e2e-secret') === process.env.E2E_SECRET
  ) {
    const { createSupabaseServiceRoleClient } = await import(
      '@/supabase-clients/server'
    );
    return {
      authenticated: true,
      userId: authResult.userId,
      supabase: createSupabaseServiceRoleClient(),
    };
  }

  // Dynamically import to avoid circular dependencies
  const { useServerSupabaseWithAuthStrict } = await import(
    '@/hooks/useServerSupabase'
  );

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- server-only utility, not a React hook
    const supabase = await useServerSupabaseWithAuthStrict();
    return {
      authenticated: true,
      userId: authResult.userId,
      supabase,
    };
  } catch (error) {
    console.error(
      '[API Auth] Failed to create authenticated Supabase client:',
      error
    );
    return {
      authenticated: false,
      response: unauthorizedResponse(
        'Failed to establish authenticated database connection'
      ),
    };
  }
}

/**
 * Domains whose primary verified email auto-resolves to the `admin` role.
 * Lets new internal hires hit /admin/* without a manual Clerk metadata edit.
 */
const TEAM_EMAIL_DOMAINS = new Set([
  'flowstarter.net',
  'flowstarter.app',
  'flowstarter.dev',
  'flowstarter.com',
]);

function emailDomainRole(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && TEAM_EMAIL_DOMAINS.has(domain) ? 'admin' : undefined;
}

/**
 * Resolve a Clerk user's effective role.
 *
 * Order: session-claim metadata → publicMetadata.role → flowstarter-domain
 * email fallback. Returns undefined when the user has no team-level role.
 */
export async function resolveUserRole(
  userId: string
): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  const claimRole = (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (claimRole) return claimRole;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metaRole = (
    user.publicMetadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (metaRole) return metaRole;

  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  return emailDomainRole(primaryEmail);
}

/**
 * Require team-or-admin role for /api/admin/* routes.
 */
export type TeamAuthResult =
  | { authorized: true; userId: string; role: 'team' | 'admin' }
  | { authorized: false; response: NextResponse };

export async function requireTeamAuth(): Promise<TeamAuthResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { authorized: false, response: unauthorizedResponse() };
    }

    const role = await resolveUserRole(userId);
    if (role !== 'team' && role !== 'admin') {
      return {
        authorized: false,
        response: forbiddenResponse('Not a team member'),
      };
    }

    return { authorized: true, userId, role: role as 'team' | 'admin' };
  } catch (error) {
    console.error('[Team Auth] Error:', error);
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Auth failed' }, { status: 500 }),
    };
  }
}
