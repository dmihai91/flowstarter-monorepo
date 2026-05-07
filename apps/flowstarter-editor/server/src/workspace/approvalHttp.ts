/**
 * Workspace approval routes — surfaces client-facing actions on the
 * concierge milestones (mockup approval today; "request changes" / sign-
 * off later).
 *
 * Mockup approval is the V1 gate between `client_review` and `launched`:
 * once a client clicks "Approve" inside the editor's review banner, we
 * stamp `workspaces.setup_mockup_approved_at` and bump
 * `concierge_stage`. The admin sees the stage change on the project's
 * Concierge tab and can move on to the final invoice + subscription
 * activation.
 *
 * All routes go through the same Clerk + workspace gate as the rest of
 * `/api/clerk/*`: verified session cookie + workspace slug from the
 * `Host` header + admin OR member of that workspace.
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
} from "../auth/clerkGate.ts";

let cachedSupabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ClerkGateConfigError(
      "Supabase URL + service role key required for workspace approval routes",
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

interface ApproveMockupOk {
  readonly status: "ok";
  readonly workspaceId: string;
  readonly approvedAt: string;
  readonly conciergeStage: string;
}

type ApproveMockupOutcome =
  | ApproveMockupOk
  | { readonly kind: "no-workspace"; readonly reason: string }
  | { readonly kind: "unauthenticated"; readonly reason: string }
  | { readonly kind: "forbidden"; readonly reason: string }
  | { readonly kind: "config"; readonly reason: string }
  | { readonly kind: "error"; readonly reason: string }
  | { readonly kind: "already-approved"; readonly approvedAt: string };

async function runApproveMockup(
  url: string,
  headers: Record<string, string | undefined>,
  currentSlug: string | null,
): Promise<ApproveMockupOutcome> {
  if (!currentSlug) {
    return {
      kind: "no-workspace",
      reason: "Approval is workspace-scoped; no workspace slug in Host.",
    };
  }
  try {
    const { userId } = await verifyClerkRequest({ headers, url, method: "POST" });
    const identity = await resolveAuthorization(userId, { currentSlug });
    if (!identity.currentWorkspace) {
      return {
        kind: "no-workspace",
        reason: "Workspace not found for the current host.",
      };
    }

    const supabase = getSupabase();
    const workspaceId = identity.currentWorkspace.id;

    // Refuse if already approved — keep the action idempotent so a
    // double-click doesn't churn the timestamp or fire duplicate
    // downstream notifications.
    const { data: existing, error: existingErr } = await supabase
      .from("workspaces")
      .select("setup_mockup_approved_at, concierge_stage")
      .eq("id", workspaceId)
      .maybeSingle();
    if (existingErr) {
      return { kind: "error", reason: existingErr.message };
    }
    if (existing?.setup_mockup_approved_at) {
      return {
        kind: "already-approved",
        approvedAt: existing.setup_mockup_approved_at as string,
      };
    }

    const approvedAt = new Date().toISOString();
    // Once the client signs off the mockup, the canonical V1 next step is
    // "launched" — the team sends the final invoice + activates the sub.
    // We DON'T touch deposit / final invoice fields here; that's the
    // admin's billing flow.
    const { data: updated, error: updateErr } = await supabase
      .from("workspaces")
      .update({
        setup_mockup_approved_at: approvedAt,
        concierge_stage: "launched",
        updated_at: approvedAt,
      })
      .eq("id", workspaceId)
      .select("id, setup_mockup_approved_at, concierge_stage")
      .single();
    if (updateErr || !updated) {
      return {
        kind: "error",
        reason: updateErr?.message ?? "Workspace update returned no row",
      };
    }

    return {
      status: "ok",
      workspaceId: updated.id as string,
      approvedAt: updated.setup_mockup_approved_at as string,
      conciergeStage: updated.concierge_stage as string,
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

/**
 * `POST /api/clerk/workspace/approve-mockup`
 *
 * Body: empty (everything we need is on the Clerk cookie + Host).
 * Response: `{ status: 'ok', workspaceId, approvedAt, conciergeStage }`
 * on success; standard discriminated error/refusal otherwise.
 */
export const clerkApproveMockupRouteLayer = HttpRouter.add(
  "POST",
  "/api/clerk/workspace/approve-mockup",
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
      runApproveMockup(url, headers, currentSlug),
    );

    if ("status" in outcome) {
      return HttpServerResponse.jsonUnsafe(outcome, { status: 200 });
    }
    if (outcome.kind === "already-approved") {
      return HttpServerResponse.jsonUnsafe(
        { status: "already-approved", approvedAt: outcome.approvedAt },
        { status: 200 },
      );
    }
    if (outcome.kind === "no-workspace") {
      return HttpServerResponse.jsonUnsafe(
        { status: "no-workspace", reason: outcome.reason },
        { status: 400 },
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
