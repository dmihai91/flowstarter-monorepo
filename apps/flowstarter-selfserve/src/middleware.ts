import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public surface: landing/entry, the gallery-style site preview, Stripe
// webhooks (verified by signature), and the internal watchdog (token gated).
const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/site/(.*)',
  '/draft/(.*)',
  '/api/demo-preview(.*)',
  '/api/leads(.*)',
  '/api/webhooks/(.*)',
  '/api/internal/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|woff2?)).*)', '/(api|trpc)(.*)'],
};
