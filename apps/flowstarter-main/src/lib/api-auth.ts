/**
 * API Route Authentication Utilities
 *
 * Provides standardized authentication checks for API routes.
 * Ensures consistent security patterns across all protected endpoints.
 *
 * @module lib/api-auth
 */

import { auth, currentUser } from '@clerk/nextjs/server';
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
      console.log('[API Auth] E2E bypass — userId:', userId);
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
 * Require team-or-admin role for /api/team/* routes.
 *
 * Reads role from Clerk session claims first, falls back to publicMetadata.
 * Mirrors the inline checks in app/api/team/clients and projects/[id].
 */
export type TeamAuthResult =
  | { authorized: true; userId: string; role: 'team' | 'admin' }
  | { authorized: false; response: NextResponse };

export async function requireTeamAuth(): Promise<TeamAuthResult> {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return { authorized: false, response: unauthorizedResponse() };
    }

    let role = (
      sessionClaims?.metadata as { role?: string } | undefined
    )?.role?.toLowerCase();

    if (!role) {
      const user = await currentUser();
      role = (
        user?.publicMetadata as { role?: string } | undefined
      )?.role?.toLowerCase();
    }

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
