/**
 * Template Recommendations Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import { queryKeys } from './keys';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RecommendationsParams {
  businessInfo: BusinessInfo;
  projectName: string;
  projectDescription: string;
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function fetchRecommendations(params: RecommendationsParams): Promise<TemplateRecommendation[]> {
  const response = await fetch('/api/recommend-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectDescription: params.projectDescription,
      projectName: params.projectName || 'My Project',
      businessInfo: params.businessInfo,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.status}`);
  }

  const data = await response.json() as { recommendations: TemplateRecommendation[] };
  return data.recommendations || [];
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Hook to fetch template recommendations based on business info
 * Uses React Query for caching - same business info = cached result
 */
export function useRecommendations(
  params: RecommendationsParams | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.recommendations(params?.businessInfo ?? null),
    queryFn: () => fetchRecommendations(params!),
    enabled: !!params?.businessInfo && !!params?.projectDescription && (options?.enabled !== false),
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });
}
