# Shopify operator landing (template)

The per-client home page for a Flowstarter-run Shopify store — served at the
root of each workspace host (e.g. `lebadusul.flowstarter.net`), with the editor
under `/editor`. Visit the store, edit it with the AI assistant, preview pending
changes, and see the current workspace status.

A small Vite + React app. Everything client-specific lives in one config file,
so a new store is a config + a screenshot — no code changes.

## Add a new Shopify project

1. **Config** — add `sites/<slug>.ts` exporting a `SiteConfig` (copy
   `sites/lebadusul.ts`). Fill in store name, URLs, kicker, badges, etc.
2. **Screenshot** — drop the storefront image at `public/assets/<slug>.jpg`
   (1600×1000, no cookie banner) and point `storefrontImage` at
   `/assets/<slug>.jpg`.
3. **Build** — `VITE_SITE=<slug> pnpm build`.
4. **Deploy** — copy `dist/` to the host's web root
   (`/srv/landings/<slug>/`), preserving any `preview.html`.

## Env

| Var | Purpose |
|-----|---------|
| `VITE_SITE` | which `sites/<slug>.ts` to build (default `lebadusul`) |
