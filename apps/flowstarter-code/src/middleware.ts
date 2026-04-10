import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTeamLoginUrl } from '@flowstarter/platform-config';

function getPublicOrigin(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(req.url).origin;
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Static assets, T3 proxy, and T3 assets — always public
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/t3') ||
    pathname.startsWith('/assets/')
  ) {
    return NextResponse.next();
  }

  // Clerk ticket callback from team login — let through
  if (req.nextUrl.searchParams.has('__clerk_ticket')) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session.userId) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Authentication required', { status: 401 });
    }
    const origin = getPublicOrigin(req);
    return NextResponse.redirect(getTeamLoginUrl(origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
