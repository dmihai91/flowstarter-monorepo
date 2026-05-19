# Flowstarter Assistant — Editor Deployment & Per-Client Loading

Runbook for hosting the editor (forked T3 Code, branded **Flowstarter
Assistant**) and the client sites on Hetzner, fronted by Cloudflare.

This is the **implementation runbook**. The firm architectural
decisions live in
[`FLOWSTARTER_MASTER_DECISIONS.md` → Editor Architecture](./FLOWSTARTER_MASTER_DECISIONS.md).
Where this document is more specific, it is *implementing* that
section, not overriding it.

## Alignment with the Master Decisions doc

The canonical doc specifies: a single deployment, **subdomain routing**
(`client1.flowstarter.app → workspace → project`), each client sees
only their workspace, **theme = a local folder on the VPS synced via
git (Astro) or Shopify CLI (Liquid)**, publish + one-click rollback,
per-client rate limiting.

This runbook satisfies all of that. **One implementation nuance worth
stating explicitly:** the canonical text reads as a *single editor
process* that route-switches on `req.headers.host`. The editor as built
today is single-project-per-process (one `cwd` per server instance —
`serverRuntimeStartup.ts`). So the simplest faithful implementation is
**one editor process per workspace behind nginx subdomain routing** —
identical external behaviour (subdomain → workspace, total isolation,
local folder + git) with **zero editor code changes**, just N processes
instead of one multi-tenant process. This is an implementation detail
under the same decision, and it upgrades cleanly (see *Upgrade path*).

## Why this is safe (the load-bearing fact)

`apps/flowstarter-editor/server/src/auth/clerkGate.ts:420-426` already
refuses any client who is not a member of the workspace addressed by
the subdomain:

```ts
// If the request scoped to a specific workspace, the client MUST be a
// member of it. Refuse otherwise — even if they have other workspaces.
if (currentWorkspace && !allowedIds.includes(currentWorkspace.id)) {
  throw new ClerkGateForbidden(`User is not a member of workspace ${currentWorkspace.slug}`);
}
```

`currentWorkspace` is derived from the Host header subdomain. So the
auth boundary already exists. The per-client OS process + its directory
are the isolation boundary; nothing multi-tenant runs in-process.

## Architecture

```
                Cloudflare  (DNS · proxy · edge TLS · WAF · cache)
                │
  <slug>.app.<domain>            → cache BYPASS  (the editor: app/api/ws)
  <slug>.<domain> / custom domain → cache EVERYTHING + purge-on-publish
                │  (Origin cert, SSL = Full (strict))
        ┌───────▼──────────  Hetzner Cloud VPS (Ubuntu 24.04) ─────────┐
        │  nginx                                                       │
        │   ├─ <slug>.app.<domain> → 127.0.0.1:<port>  (per workspace) │
        │   │      systemd: flowstarter-editor@<slug>                  │
        │   │        cwd  = /srv/clients/<slug>/site   (git checkout)  │
        │   │        state= /srv/clients/<slug>/.state                 │
        │   │        spawns: claude CLI, git, node-pty terminals       │
        │   └─ client live site → git push / shopify theme push        │
        └───────────────────────────────────────────────────────────────┘
```

**Box:** start on Hetzner CPX31 (4 vCPU / 8 GB); move to CPX41 when
agent jobs run hot. **Daytona is NOT used for v1** — the project is a
plain git checkout on the box (matches "local folder on VPS"). Daytona
sandboxing is the documented *upgrade path*, not v1.

## Repository layout of the deploy artifacts

| File | Role |
|---|---|
| `deploy/editor/flowstarter-editor@.service` | systemd template, one instance per workspace slug |
| `deploy/editor/nginx-shared.conf` | HTTP-context: WS upgrade map + Cloudflare real-IP (install once) |
| `deploy/editor/nginx-site.conf.tmpl` | per-slug vhost template (rendered by the onboarding script) |
| `deploy/editor/onboard-client.sh` | idempotent: clone → env → nginx → systemd → print DNS |

## Phase 0 — Base provisioning (one-time, per VPS)

1. Ubuntu 24.04. `ufw` allow 22/80/443; `fail2ban`; unattended-upgrades.
2. System user: `useradd --system --create-home --shell /usr/sbin/nologin flowstarter`.
3. Toolchain: Node 22, **Bun**, pnpm, git, nginx, the `claude` CLI.
4. App code: deploy the monorepo to `FLOWSTARTER_APP_ROOT` (e.g.
   `/opt/flowstarter/app`), `pnpm install --frozen-lockfile`, then
   build the editor:
   - web: `pnpm --filter @flowstarter/editor-web build`
   - server: `pnpm --filter @flowstarter/editor-server build` →
     produces `apps/flowstarter-editor/server/dist/bin.mjs`
5. Launcher `/opt/flowstarter/bin/run-editor.sh` (chmod 0755):

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   # FLOWSTARTER_APP_ROOT + T3CODE_PROJECT_DIR come from the
   # EnvironmentFiles in flowstarter-editor@.service.
   exec node "${FLOWSTARTER_APP_ROOT}/apps/flowstarter-editor/server/dist/bin.mjs" \
     "${T3CODE_PROJECT_DIR}"
   ```

   > The editor server takes `cwd` as a positional arg (defaults to
   > `process.cwd()` — `cli.ts:258,725`); passing `$T3CODE_PROJECT_DIR`
   > explicitly is unambiguous. Confirm `dist/bin.mjs` is the built
   > entrypoint for your build (server `package.json` `start` =
   > `node dist/bin.mjs`).
6. Shared secrets `/etc/flowstarter/editor.env` (root:flowstarter,
   chmod 0600) — **never committed**:

   ```
   FLOWSTARTER_APP_ROOT=/opt/flowstarter/app
   CLERK_SECRET_KEY=...
   VITE_CLERK_PUBLISHABLE_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ANTHROPIC_API_KEY=...
   ```
7. Install the systemd template + shared nginx:
   ```bash
   cp deploy/editor/flowstarter-editor@.service /etc/systemd/system/
   systemctl daemon-reload
   cp deploy/editor/nginx-shared.conf /etc/nginx/conf.d/flowstarter-shared.conf
   ```
8. TLS: install the Cloudflare **Origin Certificate** (wildcard
   `*.app.<domain>`) at `/etc/ssl/flowstarter/origin.{pem,key}`;
   Cloudflare SSL mode = **Full (strict)**.

## Phase 1 — Onboard a client (per workspace, repeatable)

The workspace must already exist in Supabase with its `slug` and the
client added to `workspace_memberships` (done by the main app /
admin flow — the editor only reads it).

```bash
sudo deploy/editor/onboard-client.sh <slug> <git-repo-url> <base-domain>
# e.g.
sudo deploy/editor/onboard-client.sh acme git@github.com:flowstarter/acme-site.git flowstarter.app
```

The script (idempotent, non-destructive):
1. `/srv/clients/<slug>/{site,.state}` — `git clone` **first run only**
   (re-runs never discard a checkout that may hold unpushed edits).
2. `/etc/flowstarter/clients/<slug>.env` — reuses an already-assigned
   port; otherwise allocates the next free one in 5800–5999.
3. Renders the nginx vhost, `nginx -t`, reload.
4. `systemctl enable --now flowstarter-editor@<slug>`.
5. Prints the exact Cloudflare DNS record + cache rule to add. **It
   does not mutate DNS** — that's an external account; do it in the
   Cloudflare UI/API deliberately.

## Phase 2 — Publish & rollback (per site kind)

Per the master doc. v1 keeps it minimal; wire fully as the publish
route lands (`/api/site/publish` does not exist yet — tracked
separately).

- **Astro:** edit in the checkout → preview via the workspace's dev
  server (separate subdomain) → Publish = `git push` → deploy to the
  client live target (Cloudflare Pages or a `/srv/sites/<slug>` static
  vhost on this box) → Cloudflare cache purge for that hostname.
- **Shopify Liquid:** edit the theme checkout → preview via Shopify dev
  store (Shopify CLI) → Publish = `shopify theme push` to the live
  store.
- **Rollback:** snapshot (git tag / release dir) immediately before
  every publish; one-click revert restores it.

## Phase 3 — Operations (canonical requirements; staged)

The master doc requires per-request logging, pre-publish snapshots,
one-click rollback, **per-client rate limiting (sessions/month)**, soft
blocks at limit. v1 ships process isolation + journald logs + the
upgrade-prompt path that already exists in the editor (`useTier` /
constraints). Snapshots, automated rollback and quota enforcement are a
follow-up hardening pass — **not claimed as done by v1**; track them
before onboarding paying clients at volume.

Cost lever (not needed for correctness): when N idle processes get
heavy, add on-demand start / idle-stop (systemd socket activation or a
start-on-first-request proxy). **No editor changes required.**

## Upgrade path (when scale or security demands it)

Everything above stays; only the project source swaps:

- **cwd = local git checkout → cwd = a per-workspace Daytona sandbox
  FS.** `daytona-utils` already does get-or-create-by-label
  (`labels.project`). Add `workspaces.repo_url`/`repo_branch` in
  Supabase as the canonical code-location, resolve workspace → sandbox
  on gate resolution. Routing, auth and nginx are unchanged.
- Optionally add OS-container-per-workspace on top of the sandbox for
  defense-in-depth if a security review requires it.

## Open items to confirm before first run

- **`base-domain`** for the editor (`<slug>.app.<domain>`) and the
  client-site domain pattern — read from env / `@flowstarter/platform-config`,
  never hardcoded.
- **Prod server entrypoint**: confirm `apps/flowstarter-editor/server/
  dist/bin.mjs` after `pnpm --filter @flowstarter/editor-server build`.
- **Client-site live target**: Cloudflare Pages vs a static
  `/srv/sites/<slug>` vhost on this box (the master doc allows either).
