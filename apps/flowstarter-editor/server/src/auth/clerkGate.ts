/**
 * Clerk-aware gate for the editor server.
 *
 * Authentication contract:
 *   - flowstarter-main owns the Clerk integration. When a user signs in there,
 *     Clerk drops a session cookie scoped to the parent domain (e.g.
 *     `.flowstarter.dev`), which is automatically sent to subdomains
 *     including `editor.flowstarter.app`.
 *   - We verify that cookie via @clerk/backend. No editor-side sign-in UI.
 *
 * Authorization contract:
 *   - Admins (Clerk publicMetadata.role === 'team' | 'admin') get full access
 *     to every workspace. Their tier is hard-coded to 'custom' (full UI).
 *   - Clients (any other Clerk user) must have a row in
 *     `workspace_memberships` for the workspace they're trying to edit. Their
 *     tier is the workspace's `tier_name` (defaults to 'essential' if unset).
 *
 * We deliberately keep this module non-Effect so it can be unit-tested in
 * isolation and so the Clerk + Supabase SDKs stay outside T3's runtime
 * Layer system.
 */

import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type EditorTier = "essential" | "pro" | "commerce" | "custom";
export type EditorRole = "admin" | "client";

export interface ResolvedIdentity {
  /** Clerk user id (e.g. `user_2abc...`). */
  readonly userId: string;
  /** Whether the user is a flowstarter team member or a paying client. */
  readonly role: EditorRole;
  /**
   * UI gate level. Admins always get 'custom'. Clients get whatever
   * `workspaces.tier_name` was set to during onboarding.
   */
  readonly tier: EditorTier;
  /** Workspace UUIDs this user can open. Admins get every workspace id. */
  readonly allowedWorkspaceIds: ReadonlyArray<string>;
}

export class ClerkGateUnauthenticated extends Error {
  readonly code = "unauthenticated";
  constructor(message = "No valid Clerk session on this request") {
    super(message);
    this.name = "ClerkGateUnauthenticated";
  }
}

export class ClerkGateForbidden extends Error {
  readonly code = "forbidden";
  constructor(message: string) {
    super(message);
    this.name = "ClerkGateForbidden";
  }
}

export class ClerkGateConfigError extends Error {
  readonly code = "config";
  constructor(message: string) {
    super(message);
    this.name = "ClerkGateConfigError";
  }
}

let cachedClerk: ClerkClient | null = null;
let cachedSupabase: SupabaseClient | null = null;

function getClerkClient(): ClerkClient {
  if (cachedClerk) return cachedClerk;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new ClerkGateConfigError(
      "CLERK_SECRET_KEY is not set; the editor cannot validate Clerk sessions",
    );
  }
  const opts: Parameters<typeof createClerkClient>[0] = { secretKey };
  if (process.env.CLERK_PUBLISHABLE_KEY) {
    opts.publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  }
  cachedClerk = createClerkClient(opts);
  return cachedClerk;
}

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ClerkGateConfigError(
      "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are required for workspace lookup",
    );
  }
  cachedSupabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedSupabase;
}

/** Reset module-level singletons. Test-only — production paths go through the cache. */
export function resetClerkGateForTesting(): void {
  cachedClerk = null;
  cachedSupabase = null;
}

/** @internal — exposed so tests can inject fakes. */
export function setClerkGateForTesting(opts: {
  clerk?: ClerkClient;
  supabase?: SupabaseClient;
}): void {
  cachedClerk = opts.clerk ?? cachedClerk;
  cachedSupabase = opts.supabase ?? cachedSupabase;
}

/**
 * Verify the Clerk session cookie on the incoming request and return the
 * `userId`. Throws `ClerkGateUnauthenticated` if the cookie is missing or
 * the JWT fails verification.
 *
 * Accepts either a standard Web `Request` (Bun / Deno / Cloudflare) or an
 * Effect HttpServerRequest — anything that exposes `headers.cookie`.
 */
export async function verifyClerkRequest(request: {
  readonly headers: Record<string, string | undefined> | { get(name: string): string | null };
  readonly url: string;
  readonly method?: string;
}): Promise<{ userId: string; sessionId: string }> {
  const clerk = getClerkClient();

  // Build a minimal Request the SDK can read. authenticateRequest only needs
  // headers (Cookie + Authorization), URL, and method.
  const headerEntries: Record<string, string> = {};
  const headers = request.headers as
    | Record<string, string | undefined>
    | { get(name: string): string | null };

  if (typeof (headers as { get?: unknown }).get === "function") {
    const get = (headers as { get(name: string): string | null }).get.bind(headers);
    for (const name of [
      "cookie",
      "authorization",
      "x-forwarded-host",
      "x-forwarded-proto",
      "host",
      "user-agent",
    ]) {
      const value = get(name);
      if (value) headerEntries[name] = value;
    }
  } else {
    const record = headers as Record<string, string | undefined>;
    for (const [name, value] of Object.entries(record)) {
      if (typeof value === "string") {
        headerEntries[name.toLowerCase()] = value;
      }
    }
  }

  const fakeRequest = new Request(request.url, {
    method: request.method ?? "GET",
    headers: headerEntries,
  });

  const authOptions: Parameters<typeof clerk.authenticateRequest>[1] = {
    acceptsToken: "session_token",
  };
  if (process.env.CLERK_SECRET_KEY) {
    authOptions.secretKey = process.env.CLERK_SECRET_KEY;
  }
  if (process.env.CLERK_PUBLISHABLE_KEY) {
    authOptions.publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  }
  const authorizedParties = parseAuthorizedParties();
  if (authorizedParties) {
    authOptions.authorizedParties = authorizedParties;
  }

  const result = await clerk.authenticateRequest(fakeRequest, authOptions);

  if (!result.isAuthenticated) {
    throw new ClerkGateUnauthenticated(
      result.reason ? `Clerk session invalid: ${result.reason}` : undefined,
    );
  }

  const auth = result.toAuth();
  // We requested `acceptsToken: 'session_token'` so `auth` is a session token,
  // which guarantees `userId` and `sessionId` are present. Narrow defensively.
  if (auth.tokenType !== "session_token" || !auth.userId) {
    throw new ClerkGateUnauthenticated(
      "Clerk session is not a user-bound session token",
    );
  }
  return { userId: auth.userId, sessionId: auth.sessionId ?? "" };
}

function parseAuthorizedParties(): string[] | undefined {
  const raw = process.env.CLERK_AUTHORIZED_PARTIES;
  if (!raw) return undefined;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * Resolve a user's editor role + tier + allowed workspaces.
 *
 * Adminship comes from Clerk publicMetadata.role. Membership comes from
 * Supabase. Tier defaults to 'custom' for admins and to the workspace's
 * `tier_name` (or 'essential' as a safe fallback) for clients.
 */
export async function resolveAuthorization(userId: string): Promise<ResolvedIdentity> {
  const clerk = getClerkClient();
  const supabase = getSupabaseClient();

  let user;
  try {
    user = await clerk.users.getUser(userId);
  } catch (error) {
    throw new ClerkGateForbidden(
      `Clerk user lookup failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const rawRole = (user.publicMetadata as { role?: unknown } | null)?.role;
  const normalisedRole = typeof rawRole === "string" ? rawRole.toLowerCase() : null;
  const isAdmin = normalisedRole === "team" || normalisedRole === "admin";

  if (isAdmin) {
    const { data: workspaces, error } = await supabase
      .from("workspaces")
      .select("id");
    if (error) {
      throw new ClerkGateForbidden(`Workspace fetch failed: ${error.message}`);
    }
    return {
      userId,
      role: "admin",
      tier: "custom",
      allowedWorkspaceIds: (workspaces ?? []).map((row) => row.id as string),
    };
  }

  // Client path: read membership rows + each workspace's tier.
  const { data: memberships, error: mErr } = await supabase
    .from("workspace_memberships")
    .select("workspace_id, role")
    .eq("clerk_user_id", userId);
  if (mErr) {
    throw new ClerkGateForbidden(`Membership fetch failed: ${mErr.message}`);
  }

  const allowedIds = (memberships ?? []).map((row) => row.workspace_id as string);
  if (allowedIds.length === 0) {
    return {
      userId,
      role: "client",
      // Default tier doesn't matter — they have no workspaces, so the editor
      // will refuse to open anything anyway.
      tier: "essential",
      allowedWorkspaceIds: [],
    };
  }

  const { data: workspaces, error: wErr } = await supabase
    .from("workspaces")
    .select("id, tier_name")
    .in("id", allowedIds);
  if (wErr) {
    throw new ClerkGateForbidden(`Workspace tier fetch failed: ${wErr.message}`);
  }

  const tierFromHighestPaying = pickHighestTier(
    (workspaces ?? []).map((row) => row.tier_name as string | null),
  );

  return {
    userId,
    role: "client",
    tier: tierFromHighestPaying,
    allowedWorkspaceIds: allowedIds,
  };
}

const TIER_RANK: Record<EditorTier, number> = {
  essential: 0,
  pro: 1,
  commerce: 2,
  custom: 3,
};

function pickHighestTier(values: ReadonlyArray<string | null>): EditorTier {
  let best: EditorTier = "essential";
  for (const value of values) {
    if (!value) continue;
    if (!isEditorTier(value)) continue;
    if (TIER_RANK[value] > TIER_RANK[best]) {
      best = value;
    }
  }
  return best;
}

function isEditorTier(value: string): value is EditorTier {
  return value === "essential" || value === "pro" || value === "commerce" || value === "custom";
}
