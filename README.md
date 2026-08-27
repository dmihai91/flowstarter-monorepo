# Flowstarter — monorepo

Flowstarter is a **concierge web service**: a small team builds and maintains
premium websites and storefronts for service businesses and small product
sellers, then hands the client a constrained AI editor to keep the site
current themselves. It is not a self-serve site builder.

This is an Nx + pnpm monorepo.

## Apps

| App | What it is |
|-----|-----------|
| `apps/flowstarter-main` | The platform: marketing site, public discovery funnel, team admin dashboard, REST APIs, billing. Hosts on Netlify. |
| `apps/flowstarter-editor` | Fork of [T3 Code](https://github.com/pingdotgg/t3code) — the multitenant AI editor. Hosts on Hetzner. |
| `apps/flowstarter-library` | The template library used as the foundation for client builds. |
| `apps/deploy-agent` | Bun HTTP service on each Hetzner Caddy host: receives a built artifact, extracts it, writes the Caddy snippet, reloads Caddy. |
| `apps/flowstarter-templates/*` | Per-client / starter site templates (Astro). |

## Packages

- `packages/platform-config` — single source of truth for domains/URLs.
  **Never hardcode a domain**; derive it from `PLATFORM_DOMAIN`/hostname via
  `getMainUrl` / `getSubdomainUrl`.
- `packages/flow-design-system` — shared UI (`Button`, `FlowBackground`, …).

## How it fits together

1. A prospect completes the **discovery wizard** on `flowstarter-main`
   (about → business → goals → commerce → recommended build → monthly plan →
   AI-generated site preview), pays a refundable booking deposit via Stripe,
   and books the discovery call.
2. The team scopes and builds the site (template + AI assist), deployed via
   the deploy-agent onto a Hetzner Caddy host.
3. The client gets a constrained editor (`flowstarter-editor`); the team has
   the full editor. Pricing: one-time build, plus a **separate** monthly
   plan sized by editor capabilities.

Canonical product/pricing decisions: **`docs/FLOWSTARTER_MASTER_DECISIONS.md`**.
Anthropic org user workflow: **`docs/ANTHROPIC_ORG_USERS.md`**.

## Develop

```sh
pnpm install
pnpm dev                 # repo root: mprocs (needs a TTY)
# or run one app directly:
cd apps/flowstarter-main && pnpm dev   # next dev on :3000
```

Common Nx targets:

```sh
npx nx build <project>
npx nx typecheck <project>
npx nx test <project>
```

## Notes

- `pnpm dev` at the repo root runs `mprocs` (a multi-process TUI) and needs
  an interactive terminal. In a non-TTY context run each app's own `dev`
  script instead.
- Pre-commit / pre-push hooks run a CI-equivalent suite locally — don't
  `--no-verify`; fix the underlying issue (see
  `docs/PIPELINE_HARDENING_PLAN.md`).
