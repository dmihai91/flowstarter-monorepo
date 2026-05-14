/**
 * Editor server env bootstrap.
 *
 * Runs before any code that reads `process.env`. Backfills missing env
 * from a small set of well-known files (the editor's own `.env`, plus
 * the main app's `.env.local` and `.env` so that `pnpm dev:editor`
 * works without duplicating Clerk/Supabase secrets across both apps).
 * Earlier sources win — the editor's own `.env` overrides the main app's,
 * and existing `process.env` always wins over both.
 *
 * Keep this file boring + dependency-free; it runs at import time.
 *
 * Provider model:
 *   - Editor agent → Anthropic direct (ANTHROPIC_API_KEY in editor `.env`).
 *   - Admin AI helpers in flowstarter-main → OpenRouter
 *     (OPENROUTER_API_KEY in main `.env.local`).
 *   The two are separate by design; we don't auto-bridge them.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_VAR_LINE = /^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/;

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFileIfPresent(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(ENV_VAR_LINE);
    if (!match) continue;
    const [, key, valueRaw] = match;
    if (!key || valueRaw === undefined) continue;
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquote(valueRaw);
  }
}

function loadKnownEnvFiles(): void {
  const cwd = process.cwd();
  // The editor server's own `.env` wins inside its workspace.
  loadEnvFileIfPresent(resolve(cwd, ".env"));

  // Walk up to the monorepo root and pick up the main app's env so a single
  // OPENROUTER_API_KEY / CLERK_SECRET_KEY / Supabase pair powers both apps
  // in dev. We deliberately don't read shell rc files — only project-local
  // files that already live in this repo.
  const candidateRoots = [
    resolve(cwd, "../..", "apps/flowstarter-main"),
    resolve(cwd, "../../..", "apps/flowstarter-main"),
  ];
  for (const root of candidateRoots) {
    if (!existsSync(root)) continue;
    loadEnvFileIfPresent(resolve(root, ".env.local"));
    loadEnvFileIfPresent(resolve(root, ".env"));
    break;
  }
}

/**
 * Map Next.js-style env names (NEXT_PUBLIC_*) onto the unprefixed names
 * the editor server's @clerk/backend integration expects. We never set
 * an alias if the canonical name is already present — explicit always
 * wins.
 */
function applyEnvAliases(): void {
  if (
    !process.env.CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

/**
 * Default CLERK_SIGN_IN_URL based on whether we're running on localhost
 * (point clients at the main app's `/login` on the same host) or in
 * production (Clerk-hosted satellite sign-in on flowstarter.net).
 *
 * Caller can always override by setting CLERK_SIGN_IN_URL explicitly.
 */
function applyClerkSignInDefault(): void {
  if (process.env.CLERK_SIGN_IN_URL) return;
  const siteUrl = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL].find(
    (u) => typeof u === "string" && u.trim().startsWith("http"),
  )?.trim();
  if (siteUrl) {
    process.env.CLERK_SIGN_IN_URL = `${siteUrl.replace(/\/+$/, "")}/login`;
  } else {
    process.env.CLERK_SIGN_IN_URL = "http://localhost:3000/login";
  }
}

let bootstrapped = false;

export function bootstrapEditorEnv(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  loadKnownEnvFiles();
  applyEnvAliases();
  applyClerkSignInDefault();
}

// Run on import so simply `import "./envBootstrap"` is enough.
bootstrapEditorEnv();
