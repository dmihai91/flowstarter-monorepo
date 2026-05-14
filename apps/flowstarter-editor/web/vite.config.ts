import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig, loadEnv } from "vite";
import pkg from "./package.json" with { type: "json" };

const ENV_VAR_LINE = /^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/;

function unquoteEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Read selected keys from a dotenv file (no `process` mutation).
 * When merging two files, spread `.env.local` last so it overrides `.env`
 * (same net effect as `server/src/envBootstrap.ts` for the main app).
 */
function readEnvFileKeys(filePath: string, keys: ReadonlySet<string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(ENV_VAR_LINE);
    if (!match) continue;
    const [, key, valueRaw] = match;
    if (!key || valueRaw === undefined || !keys.has(key)) continue;
    if (out[key] !== undefined) continue;
    out[key] = unquoteEnvValue(valueRaw);
  }
  return out;
}

/**
 * Same sources as the editor server's `envBootstrap.ts` for `NEXT_PUBLIC_*`
 * so `pnpm --filter @flowstarter/editor-web dev` sees the main app's URL
 * even though this Vite process never imports `envBootstrap`.
 */
function peekMainAppPublicUrls(editorWebDir: string): Record<string, string> {
  const keys = new Set([
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
    "VITE_MAIN_APP_ORIGIN",
  ]);
  const mainRoot = path.resolve(editorWebDir, "../../flowstarter-main");
  if (!existsSync(mainRoot)) return {};
  const fromLocal = readEnvFileKeys(path.resolve(mainRoot, ".env.local"), keys);
  const fromEnv = readEnvFileKeys(path.resolve(mainRoot, ".env"), keys);
  return { ...fromEnv, ...fromLocal };
}

function firstHttpBase(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const t = c?.trim();
    if (t && t.startsWith("http")) return t;
  }
  return "";
}

const port = Number(process.env.PORT ?? 5733);
/** Bind all interfaces so phones/tablets on the LAN can load the dev server (`HOST=localhost` to restrict). */
const host = process.env.HOST?.trim() || "0.0.0.0";
const configuredHttpUrl = process.env.VITE_HTTP_URL?.trim();
const configuredWsUrl = process.env.VITE_WS_URL?.trim();
const sourcemapEnv = process.env.T3CODE_WEB_SOURCEMAP?.trim().toLowerCase();

const buildSourcemap =
  sourcemapEnv === "0" || sourcemapEnv === "false"
    ? false
    : sourcemapEnv === "hidden"
      ? "hidden"
      : true;

function resolveDevProxyTarget(wsUrl: string | undefined): string | undefined {
  if (!wsUrl) {
    return undefined;
  }

  try {
    const url = new URL(wsUrl);
    if (url.protocol === "ws:") {
      url.protocol = "http:";
    } else if (url.protocol === "wss:") {
      url.protocol = "https:";
    }
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * HMR mode (`pnpm dev:editor:hmr`) needs the dev server to forward
 * `/api/*`, `/attachments/*`, `/.well-known/*`, and `/ws` to the local
 * editor server so the SPA loaded from Vite's port at `:5733` can still
 * authenticate + open the RPC WebSocket against the running editor on
 * `T3CODE_PORT` (default `5773`). When `VITE_WS_URL` is set the operator
 * is talking to a remote editor and we honour that target instead.
 */
const devProxyTarget =
  resolveDevProxyTarget(configuredWsUrl) ??
  `http://localhost:${process.env.T3CODE_PORT?.trim() || "5773"}`;

export default defineConfig(({ mode }) => {
  const webRoot = import.meta.dirname;
  const fileEnv = loadEnv(mode, webRoot, "");
  const mainPeek = peekMainAppPublicUrls(webRoot);
  const mainAppBase = firstHttpBase(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VITE_MAIN_APP_ORIGIN,
    fileEnv.NEXT_PUBLIC_SITE_URL,
    fileEnv.NEXT_PUBLIC_APP_URL,
    fileEnv.VITE_MAIN_APP_ORIGIN,
    mainPeek.NEXT_PUBLIC_SITE_URL,
    mainPeek.NEXT_PUBLIC_APP_URL,
    mainPeek.VITE_MAIN_APP_ORIGIN,
  );
  const mainAppLoginUrl =
    mainAppBase.length > 0 ? `${mainAppBase.replace(/\/+$/, "")}/login` : "";

  return {
    plugins: [
      tanstackRouter(),
      react(),
      babel({
        // We need to be explicit about the parser options after moving to @vitejs/plugin-react v6.0.0
        // This is because the babel plugin only automatically parses typescript and jsx based on relative paths (e.g. "**/*.ts")
        // whereas the previous version of the plugin parsed all files with a .ts extension.
        // This is causing our packages/ directory to fail to parse, as they are not relative to the CWD.
        parserOpts: { plugins: ["typescript", "jsx"] },
        presets: [reactCompilerPreset()],
      }),
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        "@pierre/diffs",
        "@pierre/diffs/react",
        "@pierre/diffs/worker/worker.js",
        // Keep a single React instance during dev prebundling so react/compiler-runtime
        // reads the same __CLIENT_INTERNALS as react-dom (avoids null dispatcher / useMemoCache).
        "react",
        "react-dom",
        "react/compiler-runtime",
        "react/jsx-runtime",
      ],
    },
    define: {
      "import.meta.env.VITE_HTTP_URL": JSON.stringify(configuredHttpUrl ?? ""),
      // In dev mode, tell the web app where the WebSocket server lives
      "import.meta.env.VITE_WS_URL": JSON.stringify(configuredWsUrl ?? ""),
      "import.meta.env.APP_VERSION": JSON.stringify(pkg.version),
      /** Main Next app `/login` for Clerk when `VITE_CLERK_SIGN_IN_URL` is unset (LAN dev). */
      "import.meta.env.VITE_MAIN_APP_LOGIN_URL": JSON.stringify(mainAppLoginUrl),
    },
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom"],
    },
    server: {
      host,
      port,
      strictPort: true,
      ...(devProxyTarget
        ? {
            proxy: {
              "/.well-known": {
                target: devProxyTarget,
                changeOrigin: true,
              },
              "/api": {
                target: devProxyTarget,
                changeOrigin: true,
              },
              "/attachments": {
                target: devProxyTarget,
                changeOrigin: true,
              },
              // `/ws` is the editor server's RPC channel — proxied as a
              // WebSocket upgrade so HMR mode (loaded from `:5733`) can
              // still open a live connection to the editor on `:5773`
              // without CORS / cookie-origin headaches.
              "/ws": {
                target: devProxyTarget.replace(/^http/, "ws"),
                ws: true,
                changeOrigin: true,
              },
            },
          }
        : {}),
      hmr:
        host === "0.0.0.0"
          ? { protocol: "ws" as const }
          : {
              protocol: "ws",
              host,
            },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: buildSourcemap,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/monaco-editor")) return "monaco-editor";
            if (id.includes("node_modules/@monaco-editor/react")) return "monaco-react";
            return undefined;
          },
        },
      },
    },
    test: {
      // Vite 8's resolve.tsconfigPaths does not apply in vitest's SSR
      // environment. Mirror the tsconfig "~/" → "./src/" path alias here
      // so tests can resolve the same imports as the build.
      alias: {
        "~/": path.resolve(import.meta.dirname, "src") + "/",
      },
    },
  };
});
