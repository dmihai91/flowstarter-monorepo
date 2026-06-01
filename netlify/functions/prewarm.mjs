// Scheduled function — keeps the SSR/auth Lambdas warm so visitors don't pay a
// multi-second cold start. Pings the dynamic (function-backed) routes every 5
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
