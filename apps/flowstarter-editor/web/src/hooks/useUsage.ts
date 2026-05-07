/**
 * `useUsage()` — React Query hook that fetches the current workspace's
 * editor-session usage. Refreshes every 60 s so the <UsageChip> stays
 * roughly in sync after agent runs without hammering the server.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchUsage, type UsageResolution } from "../lib/usage";

const USAGE_QUERY_KEY = ["clerk-usage"] as const;
const REFRESH_INTERVAL_MS = 60_000;

export function useUsage(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<UsageResolution> {
  return useQuery<UsageResolution>({
    queryKey: USAGE_QUERY_KEY,
    queryFn: ({ signal }) => fetchUsage(signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export const usageQueryKey = USAGE_QUERY_KEY;
