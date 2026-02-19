import type { Database } from '@/lib/database.types';
import { createClient } from '@supabase/supabase-js';

// Super simple server-side client with no auth persistence
// Will work in both pages and app directory, but won't maintain auth state
export const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );
};

// Export an alias that makes the purpose clearer
export const createSupabaseServerClient = createSupabaseClient;

// Create a server-side client that authenticates with a JWT (e.g., Clerk -> Supabase)
export const createSupabaseServerClientWithAuth = (jwt: string) => {
  // Debug breadcrumb (no secrets)
  console.info(
    `[Auth] createSupabaseServerClientWithAuth url=${process.env.NEXT_PUBLIC_SUPABASE_URL}`
  );
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

// Server-only Service Role client (bypasses RLS). Use ONLY in server routes.
export const createSupabaseServiceRoleClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
};
