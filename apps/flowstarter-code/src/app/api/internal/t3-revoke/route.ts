import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revokeClientSessionsByLabel } from '@/lib/t3AuthBridge';

/**
 * POST /api/internal/t3-revoke
 *
 * Called from the client just before Clerk sign-out. Revokes every T3 client
 * session whose label matches `clerk:<userId>` so the T3 server drops the
 * session that backed the iframe.
 */
export async function POST() {
  const session = await auth();

  if (!session.userId) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  try {
    const revoked = await revokeClientSessionsByLabel(`clerk:${session.userId}`);
    return NextResponse.json(
      { revoked },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[t3-revoke] failed to revoke client sessions', error);
    return new NextResponse('T3 bridge unavailable', { status: 502 });
  }
}
