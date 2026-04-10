import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { hasInternalTeamAccess } from '@/lib/teamAccess';

function unauthorized(status: number, message: string) {
  return new NextResponse(message, { status });
}

export async function GET() {
  const session = await auth();

  if (!session.userId) {
    return unauthorized(401, 'Authentication required');
  }

  if (!hasInternalTeamAccess(session.sessionClaims)) {
    return unauthorized(403, 'Internal team access required');
  }

  return NextResponse.json(
    { ok: true, userId: session.userId },
    {
      headers: {
        'Cache-Control': 'no-store',
        'x-flowstarter-internal-access': 'true',
      },
    },
  );
}
