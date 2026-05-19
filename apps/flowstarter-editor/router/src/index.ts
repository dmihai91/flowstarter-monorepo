/**
 * Editor container entrypoint: the per-workspace router/supervisor.
 * Listens on ROUTER_PORT (3773; Caddy's editor upstream), spawns one
 * editor process per workspace on demand, idle-stops them.
 */

import { loadConfig } from "./config.ts";
import { createRouterServer } from "./server.ts";

const cfg = loadConfig();
const { server, stop } = createRouterServer(cfg);

console.log(
  `[router] listening on ${server.hostname}:${server.port} ` +
    `(domain=${cfg.publicDomain ?? "flowstarter.net"}, ` +
    `child=${JSON.stringify(cfg.childCmd)}, ` +
    `idleTtlMs=${cfg.idleTtlMs})`,
);

let stopping = false;
async function graceful(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`[router] ${signal} — draining children…`);
  await stop();
  process.exit(0);
}
process.on("SIGTERM", () => void graceful("SIGTERM"));
process.on("SIGINT", () => void graceful("SIGINT"));
