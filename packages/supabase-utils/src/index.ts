import { createClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any;

/**
 * Basic anon client — works in both server and client contexts.
 * Does not persist auth session.
 */
export const createSupabaseClient = (): SupabaseClient<AnyDatabase> => {
  return createClient<AnyDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
};

/**
 * Alias for createSupabaseClient — makes server-side intent explicit.
 */
export const createSupabaseServerClient = createSupabaseClient;

/**
 * Server-side client authenticated with a JWT (e.g. Clerk → Supabase RLS).
 */
export const createSupabaseServerClientWithAuth = (jwt: string): SupabaseClient<AnyDatabase> => {
  return createClient<AnyDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
};

/**
 * Service role client — bypasses RLS. Use ONLY in server routes.
 */
export const createSupabaseServiceRoleClient = (): SupabaseClient<AnyDatabase> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient<AnyDatabase>(url, serviceKey, {
    auth: { persistSession: false },
  });
};
