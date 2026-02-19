import type { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { match } from 'path-to-regexp';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          // This is needed because response and request objects are different for middleware
          request.cookies.set(name, value);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        },
        remove(name: string) {
          // This is needed because response and request objects are different for middleware
          request.cookies.delete(name);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete(name);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes that require authentication
  const protectedPages = ['/dashboard'];

  if (
    !user &&
    protectedPages.some((page) => {
      const matcher = match(page);
      return matcher(request.nextUrl.pathname);
    })
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
