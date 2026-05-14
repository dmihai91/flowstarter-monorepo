/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_VERSION: string;
  readonly VITE_MAIN_APP_LOGIN_URL: string;
  /** When `true` in dev, derive main-app `/login` from the editor hostname (same machine, port 3000). Opt-in — see server `.env.example`. */
  readonly VITE_ASSUME_MAIN_ON_SAME_HOST?: string;
  /** Workspace slug used by the editor when `currentWorkspace` isn't set
   *  (local dev on `localhost:5773`). Drives the Publish target URL. */
  readonly VITE_WORKSPACE_SLUG?: string;
  /** Public domain suffix for published sites. Defaults to `flowstarter.net`. */
  readonly VITE_PUBLISH_DOMAIN?: string;
  /** Workspace dev-server URL — used by both Preview and the local
   *  Publish simulation. Defaults to `http://localhost:4322` (Astro). */
  readonly VITE_PREVIEW_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
