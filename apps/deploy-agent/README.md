# `@flowstarter/deploy-agent`

Tiny Bun HTTP service that runs on each Hetzner Caddy host. Receives deploys from `flowstarter-main` (or, eventually, the Hetzner operator service), extracts the artifact into `/var/www/sites/{slug}/`, writes the per-site Caddyfile snippet, and reloads Caddy.

Bootstrap is handled by the cloud-init script in `apps/flowstarter-main/src/lib/hosting/cloud-init.ts` — when `deployAgentArtifactUrl` is provided to that generator, Hetzner downloads this binary on first boot and starts the systemd unit.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness; no auth |
| `POST` | `/sites/:slug/deploy` | Fetch artifact, extract, write snippet, reload Caddy |
| `DELETE` | `/sites/:slug` | Remove site dir + snippet, reload Caddy |

All non-health endpoints require `Authorization: Bearer <DEPLOY_AGENT_SHARED_SECRET>`.

### `POST /sites/:slug/deploy` body

```json
{
  "artifact_url": "https://artifacts.flowstarter.app/builds/abc.tar.gz",
  "artifact_sha256": "...optional sha256 hex...",
  "primary_domain": "acme.com",
  "additional_domains": ["www.acme.com"]
}
```

The agent fetches the URL, verifies the sha256 if provided, extracts into a staging dir, then atomically renames into `/var/www/sites/{slug}/`. The previous version is moved to a `.backup-<ts>` dir and removed best-effort. Caddy snippet is written to `/etc/caddy/sites/{slug}.caddy` and Caddy is reloaded via `systemctl reload caddy`.

## Environment

Required:
- `DEPLOY_AGENT_SHARED_SECRET` — Bearer token expected on every request.

Optional:
- `DEPLOY_AGENT_PORT` (default `8443`)
- `DEPLOY_AGENT_SITES_ROOT` (default `/var/www/sites`)
- `DEPLOY_AGENT_CADDY_SITES_DIR` (default `/etc/caddy/sites`)
- `DEPLOY_AGENT_CADDY_RELOAD_CMD` (default `systemctl reload caddy`)
- `DEPLOY_AGENT_TEMP_ROOT` (default `/tmp/flowstarter-deploys`)
- `DEPLOY_AGENT_PREVIEW_DOMAIN_TEMPLATE` — e.g. `{slug}.preview.flowstarter.app` to auto-add the preview host to the snippet.

## Local dev

```bash
bun install
DEPLOY_AGENT_SHARED_SECRET=dev-secret \
DEPLOY_AGENT_SITES_ROOT=/tmp/sites \
DEPLOY_AGENT_CADDY_SITES_DIR=/tmp/caddy-sites \
DEPLOY_AGENT_CADDY_RELOAD_CMD='echo reloaded' \
bun run dev
```

Then from another shell:
```bash
curl -H 'Authorization: Bearer dev-secret' \
  -H 'Content-Type: application/json' \
  -X POST http://localhost:8443/sites/acme/deploy \
  -d '{"artifact_url":"https://example.com/site.tar.gz"}'
```
