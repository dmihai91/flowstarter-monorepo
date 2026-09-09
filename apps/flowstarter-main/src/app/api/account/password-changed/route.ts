/**
 * POST /api/account/password-changed
 *
 * Clears `publicMetadata.mustChangePassword` for the calling user, and nothing
 * else. It is the second half of the change: Clerk owns the password itself and
 * the browser sets it directly via `user.updatePassword`, but the flag that the
 * middleware gates on lives in public metadata, which only a backend key may
 * write.
 *
 * Scoped to the caller's own user id, taken from the session and never from the
 * body, so the worst this route can do is let somebody clear their own flag.
 * That buys an attacker nothing: they would still be holding only the temporary
 * password we emailed, which is the thing the gate is protecting against
 * lingering, not a secret this route could leak.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { clearMustChangePassword } from '@/lib/flowstarter/guest-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    await clearMustChangePassword(auth.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // A client stuck behind the gate with a password they already changed is a
    // dead end they cannot escape on their own, so this has to be findable.
    console.error(
      '[Flowstarter] could not clear the forced password change flag: ' +
        (error instanceof Error ? error.message : 'unknown error')
    );
    return NextResponse.json(
      { error: 'We saved your password but could not finish. Try again.' },
      { status: 500 }
    );
  }
}
