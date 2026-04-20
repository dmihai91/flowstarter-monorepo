# flowstarter-editor

The team + client editor. Currently this directory owns the shared Convex
deployment only — the Next.js wrapper that serves the T3 editor to
operators (`?mode=editor`) and end-customers (`?mode=client`) will land
alongside `convex/` here.

The Remix app that used to live here has been retired: all of its
onboarding UI, Cloudflare worker plumbing, and Convex-backed chat state
has been removed. See git history on `flowstarter-editor/convex/schema.ts`
for the hard-cut commit.

## Storage layout

- **Supabase** (`flowstarter-main`) — team auth, billing, the source-of-
  truth `projects` row (Supabase project id).
- **Convex** (`convex/`) — durable cross-editor state shared by the team
  and client editors: project record, Daytona sandbox pointer, thread +
  checkpoint registry, assets, costs, magic-link access control. _This
  is what lives in this app._
- **T3 SQLite** (`apps/t3-code/server`) — per-session runtime state:
  WebSocket sessions, Claude tool-call streams, ephemeral projections.
  T3 owns it; we do not mirror it into Convex.
- **Daytona sandbox** — one per project; hosts the actual code + dev
  server. Spun up by `flowstarter-main`'s `/api/daytona/provision`.

## Convex commands

```bash
# Start a dev deployment (regenerates _generated/ on every change).
pnpm --dir apps/flowstarter-editor convex:dev

# Push schema + functions to the configured Convex deployment.
pnpm --dir apps/flowstarter-editor convex:deploy
```

## HTTP actions

Defined in `convex/http.ts`, all behind the `HANDOFF_SECRET` header.

| Method | Path                  | Caller                                |
| ------ | --------------------- | ------------------------------------- |
| POST   | `/handoff/initialize` | `flowstarter-main` `/api/editor/handoff` |
| POST   | `/magicLinks/create`  | `flowstarter-main` `/api/projects/:id/send-to-client` |
| POST   | `/costs/log`          | T3 server / editor on LLM calls       |
| GET    | `/costs/totals`       | `flowstarter-main` dashboard          |
