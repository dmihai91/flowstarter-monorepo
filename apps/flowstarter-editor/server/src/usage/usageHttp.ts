/**
 * Usage HTTP routes for the editor.
 *
 * `GET /api/clerk/usage` returns the current workspace's editor-session
 * usage so the web client can render the <UsageChip> + gate features.
 *
 * The endpoint requires a Clerk session (same as `/api/clerk/me`) and
 * scopes to the workspace addressed by the request `Host` header. Admins
 * see their CURRENT workspace's usage when one is selected; otherwise
 * they get a "no current workspace" outcome rather than aggregating —
 * keeping admin views deterministic.
 */

import { Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  ClerkGateConfigError,
  ClerkGateForbidden,
  ClerkGateUnauthenticated,
  parseWorkspaceSlugFromHost,
  resolveAuthorization,
  verifyClerkRequest,
  type EditorTier,
  type ResolvedWorkspace,
} from "../auth/clerkGate.ts";
import { computeUsage } from "./tierLimits.ts";

interface UsageOk {
  readonly status: "ok";
  readonly workspace: ResolvedWorkspace;
  readonly usage: {
    readonly tier: EditorTier;
    readonly used: number;
    readonly limit: number | null;
    readonly rollover: number;
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

type UsageOutcome =
  | UsageOk
  | { kind: "no-workspace"; reason: string }
  | { kind: "unauthenticated"; reason: string }
  | { kind: "forbidden"; reason: string }
  | { kind: "config"; reason: string }
  | { kind: "error"; reason: string };

let cachedSupabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ClerkGateConfigError(
      "Supabase URL + service role key required for /api/clerk/usage",
    );
  }
  cachedSupabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedSupabase;
}

function reconstructRequestUrl(
  request: HttpServerRequest.HttpServerRequest,
): string {
  const proto = request.headers["x-forwarded-proto"]?.toString() ?? "http";
  const host =
    request.headers["x-forwarded-host"]?.toString() ??
    request.headers["host"]?.toString() ??
    "localhost";
  return `${proto}://${host}${request.url}`;
}

function clerkHeadersToRecord(
  request: HttpServerRequest.HttpServerRequest,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") {
      out[key.toLowerCase()] = value;
    } else if (Array.isArray(value)) {
      out[key.toLowerCase()] = value[0];
    }
  }
  return out;
}

async function loadWorkspaceCounters(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<{
  readonly used: number;
  readonly rollover: number;
  readonly tokensIn: number;
  readonly tokensOut: number;
}> {
  const [{ data: workspace, error: wErr }, { data: monthAgg, error: aErr }] =
    await Promise.all([
      supabase
        .from("workspaces")
        .select("subscription_sessions_used_this_month, subscription_rollover_remaining")
        .eq("id", workspaceId)
        .maybeSingle(),
      // Sum tokens from editor_sessions started this calendar month for this
      // workspace. Bun + Node both have Date.toISOString — use the start of
      // the current UTC month as the lower bound.
      supabase
        .from("editor_sessions")
        .select("tokens_in, tokens_out")
        .eq("workspace_id", workspaceId)
        .gte(
          "started_at",
          new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              1,
            ),
          ).toISOString(),
        ),
    ]);
  if (wErr) {
    throw new ClerkGateForbidden(`Workspace counter fetch failed: ${wErr.message}`);
  }
  if (aErr) {
    throw new ClerkGateForbidden(`Editor session aggregate failed: ${aErr.message}`);
  }
  const used =
    typeof workspace?.subscription_sessions_used_this_month === "number"
      ? workspace.subscription_sessions_used_this_month
      : 0;
  const rollover =
    typeof workspace?.subscription_rollover_remaining === "number"
      ? workspace.subscription_rollover_remaining
      : 0;
  let tokensIn = 0;
  let tokensOut = 0;
  for (const row of monthAgg ?? []) {
    if (typeof row.tokens_in === "number") tokensIn += row.tokens_in;
    if (typeof row.tokens_out === "number") tokensOut += row.tokens_out;
  }
  return { used, rollover, tokensIn, tokensOut };
}

async function runUsage(
  url: string,
  headers: Record<string, string | undefined>,
  currentSlug: string | null,
): Promise<UsageOutcome> {
  if (!currentSlug) {
    return {
      kind: "no-workspace",
      reason:
        "Editor usage is per workspace; the request did not arrive at a workspace subdomain.",
    };
  }
  try {
    const { userId } = await verifyClerkRequest({ headers, url, method: "GET" });
    const identity = await resolveAuthorization(userId, { currentSlug });
    if (!identity.currentWorkspace) {
      return {
        kind: "no-workspace",
        reason: "Workspace not found for the current host.",
      };
    }
    const supabase = getSupabase();
    const counters = await loadWorkspaceCounters(
      supabase,
      identity.currentWorkspace.id,
    );
    const usage = computeUsage({
      tier: identity.tier,
      used: counters.used,
      rollover: counters.rollover,
    });
    return {
      status: "ok",
      workspace: identity.currentWorkspace,
      usage,
      tokens: {
        inThisMonth: counters.tokensIn,
        outThisMonth: counters.tokensOut,
      },
    };
  } catch (error) {
    if (error instanceof ClerkGateUnauthenticated) {
      return { kind: "unauthenticated", reason: error.message };
    }
    if (error instanceof ClerkGateForbidden) {
      return { kind: "forbidden", reason: error.message };
    }
    if (error instanceof ClerkGateConfigError) {
      return { kind: "config", reason: error.message };
    }
    return {
      kind: "error",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export const clerkUsageRouteLayer = HttpRouter.add(
  "GET",
  "/api/clerk/usage",
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const url = reconstructRequestUrl(request);
    const headers = clerkHeadersToRecord(request);
    const host =
      request.headers["x-forwarded-host"]?.toString() ??
      request.headers["host"]?.toString() ??
      null;
    const currentSlug = parseWorkspaceSlugFromHost(host);

    const outcome = yield* Effect.promise(() =>
      runUsage(url, headers, currentSlug),
    );

    if ("status" in outcome) {
      return HttpServerResponse.jsonUnsafe(outcome, { status: 200 });
    }
    if (outcome.kind === "no-workspace") {
      return HttpServerResponse.jsonUnsafe(
        { status: "no-workspace", reason: outcome.reason },
        { status: 200 },
      );
    }
    if (outcome.kind === "unauthenticated") {
      return HttpServerResponse.jsonUnsafe(
        { status: "unauthenticated", reason: outcome.reason },
        { status: 401 },
      );
    }
    if (outcome.kind === "forbidden") {
      return HttpServerResponse.jsonUnsafe(
        { status: "forbidden", reason: outcome.reason },
        { status: 403 },
      );
    }
    if (outcome.kind === "config") {
      return HttpServerResponse.jsonUnsafe(
        { status: "config-error", reason: outcome.reason },
        { status: 503 },
      );
    }
    return HttpServerResponse.jsonUnsafe(
      { status: "error", reason: outcome.reason },
      { status: 500 },
    );
  }),
);
