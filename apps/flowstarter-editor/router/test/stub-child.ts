/**
 * Stand-in for the real editor server, used by the pipeline test. It
 * behaves like the editor in the ways the router cares about:
 *   - takes the workspace cwd as a positional arg (like
 *     `node dist/bin.mjs <cwd>`)
 *   - binds T3CODE_HOST:T3CODE_PORT
 *   - delays start a bit so the readiness wait is actually exercised
 *   - echoes its cwd / env / the request Host on /whoami
 *   - echoes websocket frames (prefixed) to verify WS proxying
 *
 * This lets the full pipeline (slug parse → spawn-per-slug with the
 * right cwd/env → readiness → HTTP+WS proxy → idle-stop) be tested
 * deterministically without Clerk/Supabase or a built editor bundle.
 */

export {}; // top-level await needs this file to be a module

const cwdArg = process.argv[2] ?? "";
const port = Number(process.env.T3CODE_PORT);
const host = process.env.T3CODE_HOST ?? "127.0.0.1";
const home = process.env.T3CODE_HOME ?? "";
const bootstrap = process.env.T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD ?? "";

const STARTUP_DELAY_MS = Number(process.env.STUB_STARTUP_DELAY_MS ?? "150");

await new Promise((r) => setTimeout(r, STARTUP_DELAY_MS));

Bun.serve({
  port,
  hostname: host,
  fetch(req, srv) {
    const url = new URL(req.url);
    if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      if (srv.upgrade(req)) return undefined;
      return new Response("upgrade failed", { status: 426 });
    }
    if (url.pathname === "/whoami") {
      return Response.json({
        cwd: cwdArg,
        port,
        home,
        bootstrap,
        pid: process.pid,
        reqHost: req.headers.get("host"),
        xfHost: req.headers.get("x-forwarded-host"),
        cookie: req.headers.get("cookie"),
      });
    }
    return new Response(`stub:${cwdArg}:${url.pathname}`);
  },
  websocket: {
    message(ws, msg) {
      ws.send(typeof msg === "string" ? `echo:${msg}` : msg);
    },
  },
});

console.log(`[stub-child] up cwd=${cwdArg} port=${port} pid=${process.pid}`);
