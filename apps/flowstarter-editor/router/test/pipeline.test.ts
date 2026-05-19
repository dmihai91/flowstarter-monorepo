/**
 * End-to-end pipeline test: slug parse → spawn one process per
 * workspace with the right cwd/env → readiness wait → HTTP + WS
 * reverse-proxy → idle-stop → respawn. Uses the stub child so it runs
 * without Clerk/Supabase or a built editor bundle.
 */

import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config.ts";
import { createRouterServer } from "../src/server.ts";

const STUB = join(import.meta.dir, "stub-child.ts");

let workspacesRoot: string;
let stateRoot: string;
let handle: ReturnType<typeof createRouterServer>;
let base: string;
let wsBase: string;

beforeAll(async () => {
  workspacesRoot = await mkdtemp(join(tmpdir(), "fse-ws-"));
  stateRoot = await mkdtemp(join(tmpdir(), "fse-st-"));

  process.env.ROUTER_PORT = "0";
  process.env.EDITOR_PUBLIC_DOMAIN = "flowstarter.net";
  process.env.EDITOR_CHILD_CMD = JSON.stringify(["bun", STUB]);
  process.env.EDITOR_WORKSPACES_ROOT = workspacesRoot;
  process.env.EDITOR_STATE_ROOT = stateRoot;
  process.env.EDITOR_CHILD_PORT_START = "47010";
  process.env.EDITOR_CHILD_PORT_END = "47090";
  process.env.EDITOR_IDLE_TTL_MS = "800";
  process.env.EDITOR_REAP_INTERVAL_MS = "200";
  process.env.EDITOR_READINESS_TIMEOUT_MS = "8000";

  handle = createRouterServer(loadConfig());
  base = `http://127.0.0.1:${handle.server.port}`;
  wsBase = `ws://127.0.0.1:${handle.server.port}`;
});

afterAll(async () => {
  await handle.stop();
  await rm(workspacesRoot, { recursive: true, force: true });
  await rm(stateRoot, { recursive: true, force: true });
});

async function whoami(slug: string) {
  const res = await fetch(`${base}/whoami`, {
    headers: { Host: `${slug}.flowstarter.net`, Cookie: "__session=tok" },
  });
  expect(res.status).toBe(200);
  return res.json() as Promise<{
    cwd: string;
    port: number;
    home: string;
    bootstrap: string;
    pid: number;
    reqHost: string;
    xfHost: string;
    cookie: string;
  }>;
}

test("one isolated process per workspace, correct cwd/env, Host preserved", async () => {
  const a = await whoami("acme");
  expect(a.cwd).toBe(join(workspacesRoot, "acme"));
  expect(a.home).toBe(join(stateRoot, "acme"));
  expect(a.bootstrap).toBe("true");
  expect(a.reqHost).toBe("acme.flowstarter.net");
  expect(a.xfHost).toBe("acme.flowstarter.net");
  expect(a.cookie).toBe("__session=tok");

  const b = await whoami("globex");
  expect(b.cwd).toBe(join(workspacesRoot, "globex"));
  expect(b.pid).not.toBe(a.pid);
  expect(b.port).not.toBe(a.port);

  // Same workspace reuses the same process (no respawn).
  const a2 = await whoami("acme");
  expect(a2.pid).toBe(a.pid);

  expect(handle.supervisor.liveSlugs().sort()).toEqual(["acme", "globex"]);
});

test("non-workspace host → 404, no process", async () => {
  const res = await fetch(`${base}/whoami`, { headers: { Host: "localhost" } });
  expect(res.status).toBe(404);
});

test("websocket frames proxy through to the right workspace", async () => {
  const ws = new WebSocket(`${wsBase}/sock`, {
    headers: { Host: "acme.flowstarter.net" },
  } as unknown as string[]);
  const echoed = await new Promise<string>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ws timeout")), 8000);
    ws.addEventListener("open", () => ws.send("ping"));
    ws.addEventListener("message", (ev: MessageEvent) => {
      clearTimeout(t);
      resolve(String(ev.data));
    });
    ws.addEventListener("error", () => {
      clearTimeout(t);
      reject(new Error("ws error"));
    });
  });
  ws.close();
  expect(echoed).toBe("echo:ping");
});

test("idle children are reaped, then respawn on next hit", async () => {
  const before = await whoami("acme");
  // Quiet longer than idleTtl + a reap cycle.
  await new Promise((r) => setTimeout(r, 1600));
  expect(handle.supervisor.liveSlugs()).not.toContain("acme");

  const after = await whoami("acme");
  expect(after.pid).not.toBe(before.pid); // fresh process
  expect(after.cwd).toBe(join(workspacesRoot, "acme"));
}, 20000);
