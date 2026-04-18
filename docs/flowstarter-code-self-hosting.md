# Flowstarter Code Self-Hosting

This repo currently ships `apps/flowstarter-code` as a branded shell around an embedded coding UI. To move control in-house, run a local fork or checkout of upstream T3 Code on the Mac mini and point the shell at that host.

The shell app now uses Clerk and only grants access to internal Flowstarter team members.

## Local dev host

Bootstrap the upstream checkout once:

```bash
pnpm setup:flowstarter-code:host
```

Start the upstream app in development mode:

```bash
pnpm dev:flowstarter-code:host
```

That starts:

- web client on `http://127.0.0.1:5733`
- websocket server on `ws://127.0.0.1:3774`

Point the Flowstarter shell at that local web client:

```bash
FLOWSTARTER_CODE_URL=http://localhost:5733
```

Use `apps/flowstarter-code/.env.local` for the shell app.

## Stable Mac mini host

For a reverse-proxied single-port deployment on the Mac mini:

```bash
pnpm start:flowstarter-code:host
```

That builds the upstream app and serves it directly from the T3 server on:

- `http://127.0.0.1:3774`

Set the shell app to the externally exposed hostname instead of the local port:

```bash
FLOWSTARTER_CODE_URL=https://code.flowstarter.dev
```

## Reverse proxy

An example Caddy config lives at:

- `infra/flowstarter-code/Caddyfile.example`

Use the stable single-port host mode behind Caddy or Nginx. The dev mode split-port setup is intended for local iteration only.

For production, protect the upstream host itself with the shell app's forward-auth endpoint:

- `GET /api/internal/t3-host-auth`

That endpoint returns:

- `200` for authenticated internal team members
- `401` for unauthenticated requests
- `403` for authenticated non-internal users

Recommended deployment shape:

- `code.flowstarter.dev` -> `apps/flowstarter-code` (Next.js shell)
- `code-host.flowstarter.dev` -> upstream T3 Code host on the Mac mini
- `code-host.flowstarter.dev` protected by Caddy `forward_auth` against `code.flowstarter.dev/api/internal/t3-host-auth`

Set these on the shell app for live use:

```bash
FLOWSTARTER_CODE_URL=https://code-host.flowstarter.dev
FLOWSTARTER_CODE_WS_TOKEN=replace_me
```

## Environment knobs

These scripts support optional overrides:

- `FLOWSTARTER_CODE_UPSTREAM_DIR`
- `FLOWSTARTER_CODE_UPSTREAM_REPO`
- `FLOWSTARTER_CODE_HOME`
- `FLOWSTARTER_CODE_HOST`
- `FLOWSTARTER_CODE_PORT`
- `FLOWSTARTER_CODE_WEB_PORT`
- `FLOWSTARTER_CODE_AUTH_TOKEN`

## Current architecture

This is still a transitional setup:

- `apps/flowstarter-code` remains the Flowstarter-branded shell
- upstream T3 Code runs as a separately managed local service
