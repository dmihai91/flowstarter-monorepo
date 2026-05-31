# Shopify operator landing (template)

The per-client home page for a Flowstarter-run Shopify store — served at the
root of each workspace host (e.g. `lebadusul.flowstarter.net`), with the editor
under `/editor`. Visit the store, edit it with the AI assistant, preview pending
changes, and see a live "edits this month" tile.

A small Vite + React app. Everything client-specific lives in one config file,
so a new store is a config + a screenshot — no code changes.

## Add a new Shopify project

1. **Config** — add `sites/<slug>.ts` exporting a `SiteConfig` (copy
   `sites/lebadusul.ts`). Fill in store name, URLs, kicker, badges, etc.
2. **Screenshot** — drop the storefront image at `public/assets/<slug>.jpg`
   (1600×1000, no cookie banner) and point `storefrontImage` at
   `/assets/<slug>.jpg`.
3. **Build** — `VITE_SITE=<slug> VITE_CLERK_PUBLISHABLE_KEY=<pk> pnpm build`.
4. **Deploy** — copy `dist/` to the host's web root
   (`/srv/landings/<slug>/`), preserving any `preview.html`.

## Live usage tile

The "edits this month" + plan tiles read the workspace's real usage from the
editor's `/api/clerk/usage` (same origin; Caddy proxies `/api/*` to the editor
container). The request is authenticated with a Clerk **session token**
(`getToken()` → `Authorization: Bearer`), so it works on dev Clerk instances
too — a cookie-only request there fails the dev-browser handshake. Anonymous
visitors get a neutral `—`; we never render a fabricated count.

`VITE_CLERK_PUBLISHABLE_KEY` must be the **same Clerk instance** the editor on
that host uses. Omit it for a static, no-auth build.

## Env

| Var | Purpose |
|-----|---------|
| `VITE_SITE` | which `sites/<slug>.ts` to build (default `lebadusul`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | workspace Clerk instance (public; enables the usage tile) |
