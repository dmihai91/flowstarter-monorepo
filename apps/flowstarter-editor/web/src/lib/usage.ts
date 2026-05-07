/**
 * Web companion to `apps/flowstarter-editor/server/src/usage/usageHttp.ts`.
 * Fetches `/api/clerk/usage`; the editor's `<UsageChip>` reads the result
 * via the `useUsage()` query hook.
 */

import type { EditorTier, ClerkWorkspaceContext } from "./clerkSession";

export interface UsageSnapshot {
  readonly status: "ok";
  readonly workspace: ClerkWorkspaceContext;
  readonly usage: {
    readonly tier: EditorTier;
    readonly used: number;
    /** Per-month cap for this tier (`null` for custom = unlimited). */
    readonly limit: number | null;
    readonly rollover: number;
    /** `limit + rollover` (`null` for unlimited). */
    readonly total: number | null;
    readonly remaining: number | null;
    readonly percentUsed: number | null;
    readonly exhausted: boolean;
  };
  readonly tokens: {
    readonly inThisMonth: number;
    readonly outThisMonth: number;
  };
}

export type UsageResolution =
  | UsageSnapshot
  | { readonly status: "no-workspace"; readonly reason: string }
  | { readonly status: "unauthenticated"; readonly reason: string }
  | { readonly status: "forbidden"; readonly reason: string }
  | { readonly status: "config-error"; readonly reason: string }
  | { readonly status: "error"; readonly reason: string };

const CLERK_USAGE_PATH = "/api/clerk/usage";

export async function fetchUsage(signal?: AbortSignal): Promise<UsageResolution> {
  let response: Response;
  try {
    response = await fetch(CLERK_USAGE_PATH, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error ? error.message : "Network error",
    };
  }
  let body: unknown;
  try {
    const text = await response.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object") {
    return {
      status: "error",
      reason: `Editor returned a non-JSON response (HTTP ${response.status})`,
    };
  }
  // The server's response already carries a discriminated `status` field
  // matching our union — we just trust + narrow it.
  const status = (body as { status?: string }).status;
  if (status === "ok") return body as UsageSnapshot;
  if (
    status === "no-workspace" ||
    status === "unauthenticated" ||
    status === "forbidden" ||
    status === "config-error" ||
    status === "error"
  ) {
    return body as UsageResolution;
  }
  return {
    status: "error",
    reason: `Unexpected response from /api/clerk/usage (HTTP ${response.status})`,
  };
}
