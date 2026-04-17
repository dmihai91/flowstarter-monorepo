import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { mintPairingCredential } from '@/lib/t3AuthBridge';

/**
 * GET /api/internal/t3-token
 *
 * Mints a fresh single-use T3 pairing credential scoped to the current Clerk
 * user. The client POSTs this credential to /t3/api/auth/bootstrap to obtain
 * a T3 session cookie for the iframe.
 */
export async function GET() {
  const session = await auth();

  if (!session.userId) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  try {
    const { credential, expiresAt } = await mintPairingCredential(
      `clerk:${session.userId}`,
    );
    return NextResponse.json(
      { token: credential, expiresAt },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[t3-token] failed to mint pairing credential', error);
    return new NextResponse('T3 bridge unavailable', { status: 502 });
  }
}
