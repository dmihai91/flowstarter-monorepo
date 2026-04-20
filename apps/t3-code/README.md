# Flowstarter T3 Code Fork

Forked from [T3 Code](https://github.com/pingdotgg/t3code) — the Claude Code web UI.

## What's included

- `server/` — HTTP/WebSocket server (Effect, SQLite, Claude Agent SDK)
- `web/` — Web client SPA (Vite + React)
- `packages/` — Shared code (contracts, client-runtime, shared)

## What's removed

- Electron desktop app (`apps/desktop`)
- Marketing site (`apps/marketing`)

## Three UI modes

The web client supports three layout modes via `?mode=` query param:

- **`platform`** — Chat + full IDE (monorepo editing on code.flowstarter.dev)
- **`editor`** — Chat + code + live preview (team project editing)
- **`client`** — Chat + preview only (non-technical client editing)

## License

See [LICENSE](./LICENSE) — same as upstream T3 Code.
