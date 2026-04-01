export { auth as default } from '@/lib/auth';

export const config = {
  // Protect all routes except NextAuth internals, static assets, and favicon
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
