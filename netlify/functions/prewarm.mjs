// Scheduled function — keeps the SSR/auth Lambdas warm so visitors don't pay a
// multi-second cold start. Pings the dynamic (function-backed) routes every 3
// minutes. Cached routes (the homepage) are served from the CDN and don't
// invoke a function, so we hit the SSR/auth paths instead.
//
// NOTE: this is a mitigation. The bigger cold-start lever is the function
// region — set Functions → Region → eu-central-1 (Frankfurt, matching Supabase
// + EU users) in the Netlify dashboard; that can't be set from netlify.toml.

export default async () => {
  const base = process.env.URL || 'https://flowstarter.net';
  const routes = [
    '/library', // SSR library catalog
    '/assistant', // branded sign-in (auth/middleware)
    '/account/billing', // auth-gated SSR (middleware + Clerk)
    '/api/auth/session', // pure function, no DB
    // Mockup generation — the funnel's first preview call (LLM site copy +
    // demo build). Warms the container's AI/Supabase deps without generating.
    '/api/discovery/preview?warm=1',
    // AI live-preview generation — loads the heavy agentic-codegen +
    // daytona-utils module graph (the expensive cold import) without running a
    // real generation, so the funnel's first visitor doesn't wait on it.
    '/api/discovery/preview/live?warm=1',
  ];
  await Promise.allSettled(
    routes.map((r) =>
      fetch(`${base}${r}`, {
        headers: { 'x-prewarm': '1' },
        redirect: 'manual',
      }).catch(() => {}),
    ),
  );
  return new Response('warmed');
};

export const config = { schedule: '*/3 * * * *' };
