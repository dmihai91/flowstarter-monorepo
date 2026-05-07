import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createHashHistory, createBrowserHistory } from "@tanstack/react-router";

import "@xterm/xterm/css/xterm.css";
import "./index.css";

import { isElectron } from "./env";
import { getRouter } from "./router";
import { APP_DISPLAY_NAME } from "./branding";
import { ClerkSessionGate } from "./components/auth/ClerkSessionGate";

// Electron loads the app from a file-backed shell, so hash history avoids path resolution issues.
const history = isElectron ? createHashHistory() : createBrowserHistory();

const router = getRouter(history);

document.title = APP_DISPLAY_NAME;

/**
 * Bypass the Clerk gate when:
 *   - the URL carries `?clerk-skip=true` (one-shot dev override), or
 *   - the build was started with VITE_DISABLE_CLERK_GATE=true (long-running
 *     local dev without a Clerk key set up).
 *
 * In production neither flag should fire, so the editor refuses to render
 * without a Clerk session.
 */
function shouldBypassClerkGate(): boolean {
  if (typeof window !== "undefined") {
    try {
      const flag = new URL(window.location.href).searchParams.get("clerk-skip");
      if (flag === "true" || flag === "1") return true;
    } catch {
      // Ignore unparseable hrefs.
    }
  }
  if (import.meta.env.VITE_DISABLE_CLERK_GATE === "true") return true;
  return false;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ClerkSessionGate bypass={shouldBypassClerkGate()}>
      <RouterProvider router={router} />
    </ClerkSessionGate>
  </React.StrictMode>,
);
