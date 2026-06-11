import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// APIs are protected by default except the explicitly public ones (webhooks
// are signature-verified, the watchdog is token-gated). Pages are public by
// default — so unknown URLs render the 404 page instead of bouncing through
// sign-in — except the funnel project pages and admin.
const isPublicApi = createRouteMatcher([
  '/api/demo-preview(.*)',
  '/api/leads(.*)',
  '/api/webhooks/(.*)',
  '/api/internal/(.*)',
]);
const isApi = createRouteMatcher(['/api/(.*)', '/trpc/(.*)']);
const isProtectedPage = createRouteMatcher(['/admin(.*)', '/p/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const needsAuth = isApi(req) ? !isPublicApi(req) : isProtectedPage(req);
  if (needsAuth) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|woff2?)).*)', '/(api|trpc)(.*)'],
};
