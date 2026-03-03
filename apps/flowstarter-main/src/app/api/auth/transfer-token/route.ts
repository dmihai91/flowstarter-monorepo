import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Creates a Clerk sign-in token that can be used to establish a session
 * on a cross-domain satellite app (e.g. editor.flowstarter.dev).
 *
 * Called by AuthRedirectWrapper before redirecting to the editor.
 * The token is passed as ?__clerk_ticket= in the redirect URL.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { redirectUrl } = await req.json();

  try {
    const clerk = await clerkClient();
    const token = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60, // 1 minute - short-lived
    });

    // Append as __clerk_ticket - Clerk reads this on the satellite
    const url = new URL(redirectUrl);
    url.searchParams.set('__clerk_ticket', token.token);

    return NextResponse.json({ url: url.toString() });
  } catch (err) {
    console.error('[transfer-token] Failed to create sign-in token:', err);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}
