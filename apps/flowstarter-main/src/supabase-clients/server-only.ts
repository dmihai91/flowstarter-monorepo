import type { Database } from '@/lib/database.types';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This client should ONLY be used in app directory server components
// DO NOT use this in pages directory components
export const createServerOnlyClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );
};
