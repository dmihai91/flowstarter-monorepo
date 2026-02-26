/**
 * Template Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from './keys';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TemplateTheme {
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text?: string;
  };
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function fetchTemplateTheme(slug: string): Promise<TemplateTheme | null> {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'theme', slug }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch theme: ${response.status}`);
  }

  const data = await response.json() as { businessInfo?: unknown; value?: unknown; data?: { theme?: unknown } };
  return (data.data?.theme as TemplateTheme) || null;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Query hook for fetching template theme/colors
 */
export function useTemplateTheme(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.templateTheme(slug || ''),
    queryFn: () => fetchTemplateTheme(slug!),
    enabled: !!slug,
    staleTime: STALE_TIME.templateTheme,
  });
}
