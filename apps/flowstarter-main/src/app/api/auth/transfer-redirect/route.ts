import { auth, clerkClient } from '@clerk/nextjs/server';
import { isSafeRedirectUrl } from '@flowstarter/platform-config';
import { NextResponse } from 'next/server';

/**
 * Server-side redirect handler for cross-domain auth.
 *
 * Called by the middleware when an authenticated user needs to be
 * redirected to a cross-domain satellite app (e.g. code.flowstarter.dev).
 * Creates a short-lived Clerk sign-in token and 302-redirects with
 * ?__clerk_ticket= so the satellite can establish a session.
 *
 * Runs in Node runtime (not Edge) so clerkClient works fully.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectUrl = url.searchParams.get('redirect_url');

  if (!redirectUrl || !isSafeRedirectUrl(redirectUrl)) {
    return NextResponse.redirect(new URL('/team/dashboard', req.url));
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/team/login', req.url));
  }

  try {
    const clerk = await clerkClient();
    const token = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60,
    });

    const target = new URL(redirectUrl);
    target.searchParams.set('__clerk_ticket', token.token);
    return NextResponse.redirect(target.toString());
  } catch (err) {
    console.error('[transfer-redirect] Failed to create sign-in token:', err);
    // Fall back to plain redirect without ticket
    return NextResponse.redirect(redirectUrl);
  }
}
