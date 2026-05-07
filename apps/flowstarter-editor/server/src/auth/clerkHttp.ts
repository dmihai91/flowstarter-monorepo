/**
 * Clerk-aware HTTP routes for the editor server.
 *
 * Lives alongside the existing T3 auth routes (`/api/auth/*`). The Clerk
 * routes carry the `/api/clerk/*` prefix so they're easy to grep for and
 * don't accidentally collide with the upstream session/bootstrap routes
 * during the transition.
 */

import { Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";

import {
  ClerkGateConfigError,
  ClerkGateForbidden,
  ClerkGateUnauthenticated,
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
  const base = process.env.CLERK_SIGN_IN_URL ?? "https://flowstarter.dev/login";
  try {
    const target = new URL(base);
    target.searchParams.set("redirect_url", currentUrl);
    return target.toString();
  } catch {
    return base;
  }
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
): Promise<ClerkMeOutcome> {
  try {
    const { userId } = await verifyClerkRequest({ headers, url, method: "GET" });
    const identity = await resolveAuthorization(userId);
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

    const outcome = yield* Effect.promise(() => runClerkMe(url, headers));

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
