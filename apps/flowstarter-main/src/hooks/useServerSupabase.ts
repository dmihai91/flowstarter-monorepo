import { getSupabaseJWT } from '@/lib/clerk-supabase-jwt';
import {
  createSupabaseServerClient,
  createSupabaseServerClientWithAuth,
} from '@/supabase-clients/server';
import { SupabaseClient } from '@supabase/supabase-js';

let globalServerSupabase: SupabaseClient | null = null;

// This is for pure server usage only (Server Components, API routes, etc.)
// WARNING: This client does NOT enforce RLS. Use useServerSupabaseWithAuthStrict for protected routes.
export const useServerSupabase = () => {
  if (!globalServerSupabase) {
    globalServerSupabase = createSupabaseServerClient();
  }
  return globalServerSupabase;
};

/**
 * Authenticated variant for server routes protected by RLS.
 *
 * DEPRECATED: This function falls back to unauthenticated client if JWT is missing.
 * Use useServerSupabaseWithAuthStrict instead for API routes.
 *
 * @deprecated Use useServerSupabaseWithAuthStrict for API routes to ensure proper authentication
 */
export const useServerSupabaseWithAuth = async () => {
  const jwt = await getSupabaseJWT();
  if (!jwt) {
    console.warn(
      '[Auth] useServerSupabaseWithAuth: No JWT available, falling back to unauthenticated client. ' +
        'Consider using useServerSupabaseWithAuthStrict for API routes.'
    );
    return useServerSupabase();
  }
  return createSupabaseServerClientWithAuth(jwt);
};

/**
 * Strict authenticated variant that throws if authentication is not available.
 *
 * This is the preferred method for API routes that require authentication.
 * It will throw an error if the JWT is not available, preventing
 * accidental unauthenticated database access.
 *
 * @throws Error if no JWT is available (user not authenticated)
 *
 * @example
 * ```ts
 * export async function GET() {
 *   try {
 *     const supabase = await useServerSupabaseWithAuthStrict();
 *     const { data } = await supabase.from('projects').select('*');
 *     return NextResponse.json({ projects: data });
 *   } catch (error) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 * }
 * ```
 */
export const useServerSupabaseWithAuthStrict = async () => {
  const jwt = await getSupabaseJWT();
  if (!jwt) {
    console.error(
      '[Auth] useServerSupabaseWithAuthStrict: No JWT available. User must be authenticated.'
    );
    throw new Error('Authentication required: No valid JWT token');
  }
  return createSupabaseServerClientWithAuth(jwt);
};
