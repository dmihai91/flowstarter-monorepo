# @flowstarter/build-worker

The private Pi build worker from `docs/FLOWSTARTER_AGENT_ARCHITECTURE.md`. It
closes the `DEPOSIT_PAID -> AGENTS_WORKING -> HUMAN_QA` leg of the lifecycle.

Before this service existed, `enqueueFullBuildFromDeposit` wrote a
`FULL_SITE_BUILD` row to the ledger and POSTed to
`FLOWSTARTER_BUILD_WORKER_URL/jobs/full-site` — and nothing was listening. This
is the listener.

## What it does

```
POST /jobs/full-site  { "jobId": "<uuid>" }
  -> claim the ledger row (queued|failed -> running, atomic compare-and-set)
  -> refuse unless the workspace is DEPOSIT_PAID
  -> git worktree  client/flowstarter-<uuid>  off the sites repo
  -> materialize the approved preview files into generated-sites/<uuid>/
  -> Pi full-site coding session, bounded to that directory
  -> trusted validation (install + build + dist/ must exist) — runs outside Pi
  -> atomic commit
  -> push branch, open a draft PR, record the staging URL
  -> ledger succeeded, workspace -> HUMAN_QA
```

Any failure records `FULL_SITE_BUILD_FAILED` on the ledger and rolls the
workspace back to `DEPOSIT_PAID` so the job can be re-dispatched (up to
`FLOWSTARTER_BUILD_MAX_ATTEMPTS`).

## Endpoints

| Method | Path              | Auth   | Response |
|--------|-------------------|--------|----------|
| `POST` | `/jobs/full-site` | Bearer | `202` accepted (build runs detached), `400` bad job id, `503` queue full |
| `GET`  | `/health`         | none   | `200 { ok, version, active, waiting }` |

The caller times out after 8s, so `/jobs/full-site` always answers immediately
and the build runs on the in-process queue behind it.

## Where it runs

The Hetzner compute host, never Netlify — builds take minutes and need a real
filesystem, git and a package manager. Run it under systemd next to the
deploy-agent, or via `pnpm --dir apps/build-worker start`.

## Configuration

Required:

| Variable | Purpose |
|----------|---------|
| `FLOWSTARTER_BUILD_WORKER_SECRET` | Shared bearer secret; must match flowstarter-main. Minimum 32 chars. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — the ledger and artifact tables have no other grant. |
| `PI_API_KEY` *(or `OPENROUTER_API_KEY`)* | Model credentials for the Pi session. |
| `FLOWSTARTER_REPOSITORY_ROOT` | Absolute path to the client-sites git checkout. |
| `FLOWSTARTER_WORKTREES_ROOT` | Absolute path where per-client worktrees are created. Must differ from the repo root. |
| `FLOWSTARTER_SITES_REPO` | `owner/repo` for the PR. |
| `FLOWSTARTER_SITES_GITHUB_TOKEN` | Token with `contents:write` + `pull_requests:write` on that repo. |

Optional:

| Variable | Default |
|----------|---------|
| `FLOWSTARTER_BUILD_WORKER_PORT` | `8787` |
| `FLOWSTARTER_BUILD_WORKER_HOST` | `0.0.0.0` |
| `PI_PROVIDER` / `PI_MODEL` | `openrouter` / `z-ai/glm-5.2` |
| `PI_THINKING_LEVEL` / `PI_TIMEOUT_MS` | `medium` / `1800000` |
| `FLOWSTARTER_SITES_BASE_REF` / `FLOWSTARTER_SITES_REMOTE` | `main` / `origin` |
| `FLOWSTARTER_STAGING_URL_TEMPLATE` | `https://{projectId}.staging.flowstarter.net` |
| `FLOWSTARTER_BUILD_VALIDATE_COMMANDS` | `[["pnpm","install","--ignore-scripts","--prefer-offline"],["pnpm","run","build"]]` |
| `FLOWSTARTER_BUILD_TIMEOUT_MS` | `900000` (per command) |
| `FLOWSTARTER_BUILD_MAX_ATTEMPTS` | `3` |
| `FLOWSTARTER_BUILD_CONCURRENCY` / `FLOWSTARTER_BUILD_QUEUE_LIMIT` | `1` / `32` |

The service refuses to start if any required value is missing or malformed.

## Boundaries

- The Pi session gets Flowstarter-owned `read_file`/`write_file`/`edit_file`
  rooted at `generated-sites/<uuid>/` — no shell, no general filesystem.
- Validation commands are operator-defined and run **outside** Pi. Their names
  must be bare executables, and they run through `execFile` (no shell).
- The GitHub token reaches git through `GIT_CONFIG_*` env vars, not `git -c` or
  a credential-bearing remote URL, so it never appears in process argv or the
  repo config. Git and GitHub error text is redacted before it is logged or
  stored on the ledger.
- Duplicate dispatch is safe twice over: the queue collapses an in-flight job
  id, and the ledger claim is an atomic compare-and-set on
  `(status, attempt_count)`.

## Tests

```bash
pnpm --dir apps/build-worker test
pnpm --dir apps/build-worker typecheck
```

Nothing in the suite touches the network, Supabase, GitHub or a real Pi model —
every one of those is an injected seam.
