/**
 * Clerk-aware gate for the editor server.
 *
 * URL contract: the editor lives at `https://{slug}.flowstarter.net/editor/*`.
 * Caddy on the Hetzner host strips the `/editor` prefix and reverse-proxies
 * to this server, preserving the original `Host` header. The workspace slug
 * is therefore the leftmost label of `Host` (or the `X-Forwarded-Host` if
 * Caddy adds one). `verifyClerkRequest()` returns it alongside the userId.
 *
 * Authentication contract:
 *   - The Clerk session cookie is scoped to `.flowstarter.net` (configure
 *     `flowstarter.net` as a satellite of `flowstarter.dev` in the Clerk
 *     dashboard). We verify that cookie via @clerk/backend. No editor-side
 *     sign-in UI; unauthenticated users redirect to CLERK_SIGN_IN_URL.
 *
 * Authorization contract:
 *   - Admins (Clerk publicMetadata.role === 'team' | 'admin') get full
 *     access to every workspace. Their plan is hard-coded to 'admin'.
 *   - Clients (any other Clerk user) must have a row in
 *     `workspace_memberships` for the workspace whose slug matches the
 *     request's `Host`. Their plan is that workspace's `tier_name`
 *     normalised via `normalisePlanKey` (defaults to 'starter').
 *
 * We deliberately keep this module non-Effect so it can be unit-tested in
 * isolation and so the Clerk + Supabase SDKs stay outside T3's runtime
 * Layer system.
 */

import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  type PlanKey,
  normalisePlanKey,
  pickHighestPlan,
} from "../usage/planEntitlements.ts";

export type { PlanKey } from "../usage/planEntitlements.ts";
export type EditorRole = "admin" | "client";

export interface ResolvedIdentity {
  /** Clerk user id (e.g. `user_2abc...`). */
  readonly userId: string;
  /** Whether the user is a flowstarter team member or a paying client. */
  readonly role: EditorRole;
  /**
   * UI gate level. Admins always get the 'admin' plan. Clients get the
   * plan their `workspaces.tier_name` normalises to (see normalisePlanKey).
   */
  readonly tier: PlanKey;
  /** Workspace UUIDs this user can open. Admins get every workspace id. */
  readonly allowedWorkspaceIds: ReadonlyArray<string>;
  /**
   * Workspace this specific request is scoped to (derived from the `Host`
   * header). `null` when the request didn't carry a recognisable workspace
   * subdomain — e.g. local dev on `localhost:5733`. The auto-pair handler
   * uses this to scope T3 sessions to the right workspace.
   */
  readonly currentWorkspace: ResolvedWorkspace | null;
}

export interface ResolvedWorkspace {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly tier: PlanKey;
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

/**
 * Short-lived in-memory identity cache.
 * The editor's usage endpoint polls every 60 s, and each call was triggering
 * `clerk.users.getUser()` + Supabase workspace queries. Caching the resolved
 * identity for 2 minutes eliminates ~29/30 of those roundtrips.
 */
const _identityCache = new Map<
  string,
  { identity: ResolvedIdentity; exp: number }
>();
const IDENTITY_CACHE_TTL_MS = 120_000;
const IDENTITY_CACHE_MAX = 200;

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
  _identityCache.clear();
}

/** @internal — exposed so tests can inject fakes. */
export function setClerkGateForTesting(opts: {
  clerk?: ClerkClient | undefined;
  supabase?: SupabaseClient | undefined;
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
 * Strip the public editor domain off a request `Host` and return the
 * workspace slug. Returns `null` for local dev (`localhost:*`), bare
 * apex / `www`, or unfamiliar domains so the gate can still produce a
 * sensible identity for non-workspace requests.
 *
 * Configurable via `EDITOR_PUBLIC_DOMAIN` (default `flowstarter.net`)
 * so this works for staging hosts too.
 */
export function parseWorkspaceSlugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const cleaned = host.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "");
  if (!cleaned) return null;
  if (cleaned === "localhost" || cleaned.endsWith(".local")) return null;

  const publicDomain = (process.env.EDITOR_PUBLIC_DOMAIN ?? "flowstarter.net").toLowerCase();
  if (!cleaned.endsWith(`.${publicDomain}`)) return null;

  const head = cleaned.slice(0, -(`.${publicDomain}`).length);
  if (!head || head === "www" || head.includes(".")) return null;
  // Slugs are alphanumeric + dashes only.
  if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(head)) return null;
  return head;
}

/**
 * Auto-promote a Clerk user to admin if their primary email is on a
 * Flowstarter-owned domain or in the explicit owner-email allowlist.
 *
 * Mirrors the role-resolution rule in `flowstarter-main`'s middleware
 * (publicMetadata.role wins, but verified emails on @flowstarter.{net,
 * dev,com,app} count as admin too) so a freshly-signed-in team member
 * isn't blocked behind a manual Clerk dashboard click. The owner-email
 * env var (`EDITOR_ADMIN_EMAILS`, comma-separated) extends the
 * allowlist for individuals on personal domains.
 */
function isAdminByEmailFallback(user: {
  primaryEmailAddressId?: string | null;
  emailAddresses?: ReadonlyArray<{
    id?: string;
    emailAddress?: string;
    verification?: { status?: string | null } | null;
  }>;
}): boolean {
  const emails = user.emailAddresses ?? [];
  if (emails.length === 0) return false;
  const candidates = new Set<string>();
  for (const entry of emails) {
    const value = entry.emailAddress?.trim().toLowerCase();
    if (!value) continue;
    if (entry.verification?.status && entry.verification.status !== "verified") {
      continue;
    }
    candidates.add(value);
  }
  if (candidates.size === 0) return false;

  const domainSuffixes = ["@flowstarter.net", "@flowstarter.dev", "@flowstarter.com", "@flowstarter.app"];
  for (const email of candidates) {
    if (domainSuffixes.some((suffix) => email.endsWith(suffix))) return true;
  }

  const overrideRaw = process.env.EDITOR_ADMIN_EMAILS;
  if (overrideRaw) {
    const allowlist = overrideRaw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0);
    for (const email of candidates) {
      if (allowlist.includes(email)) return true;
    }
  }

  return false;
}

/**
 * Resolve a user's editor role + tier + allowed workspaces.
 *
 * Adminship comes from Clerk publicMetadata.role OR a verified email on
 * a Flowstarter-owned domain (or `EDITOR_ADMIN_EMAILS`). Membership
 * comes from Supabase. Plan is 'admin' for admins. For clients the plan
 * is `currentWorkspace.tier_name` (normalised) if a slug was supplied;
 * otherwise the highest-ranked plan across their memberships.
 *
 * If `currentSlug` is provided, this function ALSO verifies that the
 * user is allowed to open that specific workspace — admins always pass,
 * clients must be a member. Throws `ClerkGateForbidden` on mismatch.
 */
export async function resolveAuthorization(
  userId: string,
  options: { currentSlug?: string | null } = {},
): Promise<ResolvedIdentity> {
  // Check in-memory cache first to avoid Clerk + Supabase roundtrips
  // on every polled request (usage endpoint hits this every 60 s).
  const cacheKey = `${userId}:${options.currentSlug ?? ""}`;
  const cached = _identityCache.get(cacheKey);
  if (cached && Date.now() < cached.exp) return cached.identity;

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
  const explicitlyAdmin = normalisedRole === "team" || normalisedRole === "admin";
  const isAdmin = explicitlyAdmin || isAdminByEmailFallback(user);
  const currentSlug = options.currentSlug ?? null;

  // Always resolve the workspace addressed by the current Host (if any),
  // regardless of role. Admin or member, we want to surface the same
  // `currentWorkspace` block to the client so it can render the right
  // workspace context.
  let currentWorkspace: ResolvedWorkspace | null = null;
  if (currentSlug) {
    const { data: ws, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, slug, name, tier_name")
      .eq("slug", currentSlug)
      .maybeSingle();
    if (wsErr) {
      throw new ClerkGateForbidden(
        `Workspace lookup for ${currentSlug} failed: ${wsErr.message}`,
      );
    }
    if (!ws) {
      throw new ClerkGateForbidden(
        `Workspace ${currentSlug} not found`,
      );
    }
    currentWorkspace = {
      id: ws.id as string,
      slug: ws.slug as string,
      name: ws.name as string,
      tier: normalisePlanKey(ws.tier_name as string | null),
    };
  }

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
      tier: "admin",
      allowedWorkspaceIds: (workspaces ?? []).map((row) => row.id as string),
      currentWorkspace,
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

  // If the request scoped to a specific workspace, the client MUST be a
  // member of it. Refuse otherwise — even if they have other workspaces.
  if (currentWorkspace && !allowedIds.includes(currentWorkspace.id)) {
    throw new ClerkGateForbidden(
      `User is not a member of workspace ${currentWorkspace.slug}`,
    );
  }

  if (allowedIds.length === 0) {
    return {
      userId,
      role: "client",
      // Default plan doesn't matter — they have no workspaces, so the editor
      // will refuse to open anything anyway.
      tier: "starter",
      allowedWorkspaceIds: [],
      currentWorkspace,
    };
  }

  const { data: workspaces, error: wErr } = await supabase
    .from("workspaces")
    .select("id, tier_name")
    .in("id", allowedIds);
  if (wErr) {
    throw new ClerkGateForbidden(`Workspace tier fetch failed: ${wErr.message}`);
  }

  // When the request is scoped to a specific workspace, that tier is
  // authoritative — clients see the UI level for the workspace they're
  // editing, not the highest tier across all of theirs. Otherwise fall
  // back to the highest available so generic queries still work.
  const tier = currentWorkspace
    ? currentWorkspace.tier
    : pickHighestPlan(
        (workspaces ?? []).map((row) => row.tier_name as string | null),
      );

  const resolvedClient: ResolvedIdentity = {
    userId,
    role: "client",
    tier,
    allowedWorkspaceIds: allowedIds,
    currentWorkspace,
  };

  // Populate cache for this user + slug.
  if (_identityCache.size >= IDENTITY_CACHE_MAX) {
    const oldest = _identityCache.keys().next().value;
    if (oldest !== undefined) _identityCache.delete(oldest);
  }
  _identityCache.set(cacheKey, { identity: resolvedClient, exp: Date.now() + IDENTITY_CACHE_TTL_MS });
  return resolvedClient;
}

