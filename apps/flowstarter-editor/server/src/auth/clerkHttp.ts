/**
 * Clerk-aware HTTP routes for the editor server.
 *
 * Lives alongside the existing T3 auth routes (`/api/auth/*`). The Clerk
 * routes carry the `/api/clerk/*` prefix so they're easy to grep for and
 * don't accidentally collide with the upstream session/bootstrap routes
 * during the transition.
 */

import { DateTime, Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";

import { ServerAuth } from "./Services/ServerAuth.ts";
import { SessionCredentialService } from "./Services/SessionCredentialService.ts";
import { respondToAuthError } from "./http.ts";
import { deriveAuthClientMetadata } from "./utils.ts";

import {
  ClerkGateConfigError,
  ClerkGateForbidden,
  ClerkGateUnauthenticated,
  parseWorkspaceSlugFromHost,
  resolveAuthorization,
  verifyClerkRequest,
  type ResolvedIdentity,
} from "./clerkGate.ts";

interface ClerkMeOk {
  readonly authenticated: true;
  readonly identity: ResolvedIdentity;
}

interface ClerkMeUnauthenticated {
  readonly authenticated: false;
  readonly reason: string;
  /** Where the web client should redirect the browser to sign in. */
  readonly loginUrl: string;
}

type ClerkMeOutcome =
  | { kind: "ok"; identity: ResolvedIdentity }
  | { kind: "unauthenticated"; reason: string; loginUrl: string }
  | { kind: "forbidden"; reason: string }
  | { kind: "config"; reason: string }
  | { kind: "error"; reason: string };

function buildLoginUrl(currentUrl: string): string {
  // Default to the satellite-hosted Clerk sign-in on the same root domain
  // as the editor (`flowstarter.net`) so the cookie set by Clerk is
  // visible at every `{slug}.flowstarter.net` afterwards. Override via env
  // for staging or for the legacy `flowstarter.dev/login` flow.
  const base =
    process.env.CLERK_SIGN_IN_URL ?? "https://flowstarter.net/sign-in";
  try {
    const target = new URL(base);
    target.searchParams.set("redirect_url", currentUrl);
    return target.toString();
  } catch {
    return base;
  }
}

function resolveCurrentSlug(
  request: HttpServerRequest.HttpServerRequest,
): string | null {
  const host =
    request.headers["x-forwarded-host"]?.toString() ??
    request.headers["host"]?.toString() ??
    null;
  return parseWorkspaceSlugFromHost(host);
}

function reconstructRequestUrl(
  request: HttpServerRequest.HttpServerRequest,
): string {
  const proto =
    request.headers["x-forwarded-proto"]?.toString() ?? "http";
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

async function runClerkMe(
  url: string,
  headers: Record<string, string | undefined>,
  currentSlug: string | null,
): Promise<ClerkMeOutcome> {
  try {
    const { userId } = await verifyClerkRequest({ headers, url, method: "GET" });
    const identity = await resolveAuthorization(userId, { currentSlug });
    return { kind: "ok", identity };
  } catch (error) {
    if (error instanceof ClerkGateUnauthenticated) {
      return {
        kind: "unauthenticated",
        reason: error.message,
        loginUrl: buildLoginUrl(url),
      };
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
 * `GET /api/clerk/me`
 *
 * Returns the resolved identity (role, tier, allowed workspace ids) when
 * the request carries a valid Clerk session cookie. Returns 200 with
 * `{ authenticated: false, loginUrl }` when the session is absent or
 * invalid — the web client uses that as a redirect signal rather than
 * choking on a 401.
 */
export const clerkMeRouteLayer = HttpRouter.add(
  "GET",
  "/api/clerk/me",
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const url = reconstructRequestUrl(request);
    const headers = clerkHeadersToRecord(request);
    const currentSlug = resolveCurrentSlug(request);

    const outcome = yield* Effect.promise(() => runClerkMe(url, headers, currentSlug));

    if (outcome.kind === "ok") {
      const body: ClerkMeOk = {
        authenticated: true,
        identity: outcome.identity,
      };
      return HttpServerResponse.jsonUnsafe(body, { status: 200 });
    }

    if (outcome.kind === "unauthenticated") {
      const body: ClerkMeUnauthenticated = {
        authenticated: false,
        reason: outcome.reason,
        loginUrl: outcome.loginUrl,
      };
      return HttpServerResponse.jsonUnsafe(body, { status: 200 });
    }

    if (outcome.kind === "config") {
      return HttpServerResponse.jsonUnsafe(
        { authenticated: false, reason: outcome.reason, configError: true },
        { status: 503 },
      );
    }

    return HttpServerResponse.jsonUnsafe(
      { authenticated: false, reason: outcome.reason },
      { status: outcome.kind === "forbidden" ? 403 : 500 },
    );
  }),
);

interface AutoPairOk {
  readonly kind: "ok";
  readonly identity: ResolvedIdentity;
}

type AutoPairOutcome =
  | AutoPairOk
  | { kind: "unauthenticated"; reason: string; loginUrl: string }
  | { kind: "no-workspace"; reason: string }
  | { kind: "forbidden"; reason: string }
  | { kind: "config"; reason: string }
  | { kind: "error"; reason: string };

async function runAutoPairIdentity(
  url: string,
  headers: Record<string, string | undefined>,
  currentSlug: string | null,
): Promise<AutoPairOutcome> {
  try {
    const { userId } = await verifyClerkRequest({ headers, url, method: "POST" });
    const identity = await resolveAuthorization(userId, { currentSlug });
    if (identity.role !== "admin" && identity.allowedWorkspaceIds.length === 0) {
      return {
        kind: "no-workspace",
        reason:
          "This Clerk user has no workspace memberships yet. Ask the team to add you to a workspace.",
      };
    }
    return { kind: "ok", identity };
  } catch (error) {
    if (error instanceof ClerkGateUnauthenticated) {
      return {
        kind: "unauthenticated",
        reason: error.message,
        loginUrl: buildLoginUrl(url),
      };
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
 * `POST /api/clerk/auto-pair`
 *
 * The bridge between Clerk auth and T3's session model. When a Clerk-
 * authenticated user lands on the editor:
 *
 *   1. We verify the Clerk JWT cookie (same as `/api/clerk/me`).
 *   2. We resolve their role + allowed workspaces; clients with zero
 *      workspaces are refused with 403.
 *   3. We mint a single-use T3 pairing credential via ServerAuth, mapping
 *      Clerk admin → T3 'owner' and Clerk client → T3 'client'.
 *   4. We immediately exchange that credential for a session and set the
 *      `t3_session` cookie.
 *
 * The web client can then proceed with T3's existing bootstrap (HTTP
 * + WebSocket) without ever showing the manual pairing UI.
 *
 * Body is empty; everything we need comes from the Clerk cookie.
 */
export const clerkAutoPairRouteLayer = HttpRouter.add(
  "POST",
  "/api/clerk/auto-pair",
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const url = reconstructRequestUrl(request);
    const headers = clerkHeadersToRecord(request);
    const currentSlug = resolveCurrentSlug(request);

    const outcome = yield* Effect.promise(() =>
      runAutoPairIdentity(url, headers, currentSlug),
    );

    if (outcome.kind === "unauthenticated") {
      return HttpServerResponse.jsonUnsafe(
        { paired: false, reason: outcome.reason, loginUrl: outcome.loginUrl },
        { status: 401 },
      );
    }
    if (outcome.kind === "no-workspace") {
      return HttpServerResponse.jsonUnsafe(
        { paired: false, reason: outcome.reason, code: "no_workspace" },
        { status: 403 },
      );
    }
    if (outcome.kind === "forbidden") {
      return HttpServerResponse.jsonUnsafe(
        { paired: false, reason: outcome.reason },
        { status: 403 },
      );
    }
    if (outcome.kind === "config") {
      return HttpServerResponse.jsonUnsafe(
        { paired: false, reason: outcome.reason, configError: true },
        { status: 503 },
      );
    }
    if (outcome.kind === "error") {
      return HttpServerResponse.jsonUnsafe(
        { paired: false, reason: outcome.reason },
        { status: 500 },
      );
    }

    const { identity } = outcome;
    const sessionRole = identity.role === "admin" ? ("owner" as const) : ("client" as const);

    const serverAuth = yield* ServerAuth;
    const sessions = yield* SessionCredentialService;

    const credential = yield* serverAuth.issuePairingCredential({
      role: sessionRole,
      label: `clerk:${identity.userId}`,
    });

    const exchanged = yield* serverAuth.exchangeBootstrapCredential(
      credential.credential,
      deriveAuthClientMetadata({ request, label: `clerk:${identity.userId}` }),
    );

    const body = {
      paired: true as const,
      identity,
      session: exchanged.response,
    };
    return yield* HttpServerResponse.jsonUnsafe(body, { status: 200 }).pipe(
      HttpServerResponse.setCookie(sessions.cookieName, exchanged.sessionToken, {
        expires: DateTime.toDate(exchanged.response.expiresAt),
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  }).pipe(Effect.catchTag("AuthError", (error) => respondToAuthError(error))),
);
