import { useQuery, type UseQueryResult } from "@tanstack/react-query";

/**
 * Live workspace usage for the owner's home page, fetched from the editor's
 * `/api/clerk/usage` (same origin — Caddy proxies `/api/*` to the editor
 * container). Authenticated with a Clerk session token (Bearer) so it works on
 * a dev Clerk instance, where a cookie-only request fails the dev-browser
 * handshake. Anonymous visitors (no token) resolve to a non-"ok" status, which
 * the UI renders as a neutral placeholder (never a fabricated count).
 */

export type PlanKey = "starter" | "pro" | "max" | "ecommerce" | "admin";
export type GetToken = () => Promise<string | null>;

export interface UsageOk {
  readonly status: "ok";
  readonly usage: {
    readonly tier: PlanKey;
    readonly used: number;
    readonly limit: number | null;
    readonly total: number | null;
    readonly remaining: number | null;
  };
}

export type UsageResolution = UsageOk | { readonly status: string };

async function fetchUsage(
  getToken: GetToken | undefined,
  signal?: AbortSignal,
): Promise<UsageResolution> {
  const headers: Record<string, string> = {};
  if (getToken) {
    try {
      const token = await getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // No token (signed out / Clerk not ready) — fall through to a cookie-only
      // request; a 401 just renders the neutral placeholder.
    }
  }
  const response = await fetch("/api/clerk/usage", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
    ...(signal ? { signal } : {}),
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as UsageResolution) : { status: "error" };
  return body && typeof body === "object" ? body : { status: "error" };
}

export function useUsage(opts?: {
  readonly getToken?: GetToken;
  readonly enabled?: boolean;
  readonly signedIn?: boolean;
}): UseQueryResult<UsageResolution> {
  return useQuery<UsageResolution>({
    // signedIn in the key so the query re-runs once auth resolves.
    queryKey: ["clerk-usage", opts?.signedIn ?? false],
    queryFn: ({ signal }) => fetchUsage(opts?.getToken, signal),
    enabled: opts?.enabled ?? true,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: false,
  });
}

export function isUsageOk(r: UsageResolution | undefined): r is UsageOk {
  return !!r && r.status === "ok" && "usage" in r;
}
