import { useQuery, type UseQueryResult } from "@tanstack/react-query";

/**
 * Live workspace usage for the owner's home page, fetched from the editor's
 * `/api/clerk/usage` (same origin — Caddy proxies `/api/*` to the editor
 * container). Clerk-cookie gated: anonymous visitors resolve to a non-"ok"
 * status, which the UI renders as a neutral placeholder (never a fabricated
 * count). Mirrors the editor web's own `useUsage()` so the two stay aligned.
 */

export type PlanKey = "starter" | "pro" | "max" | "ecommerce" | "admin";

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

async function fetchUsage(signal?: AbortSignal): Promise<UsageResolution> {
  const response = await fetch("/api/clerk/usage", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as UsageResolution) : { status: "error" };
  return body && typeof body === "object" ? body : { status: "error" };
}

export function useUsage(): UseQueryResult<UsageResolution> {
  return useQuery<UsageResolution>({
    queryKey: ["clerk-usage"],
    queryFn: ({ signal }) => fetchUsage(signal),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: false,
  });
}

export function isUsageOk(r: UsageResolution | undefined): r is UsageOk {
  return !!r && r.status === "ok" && "usage" in r;
}
