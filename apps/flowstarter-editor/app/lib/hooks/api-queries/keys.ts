/**
 * Query Keys and Stale Times for React Query
 */

import type { BusinessInfo } from '~/components/editor/editor-chat/types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const queryKeys = {
  templates: ['templates'] as const,
  recommendations: (businessInfo: BusinessInfo | null) => ['recommendations', businessInfo] as const,
  projectName: (description: string) => ['projectName', description] as const,
  templateTheme: (slug: string) => ['templateTheme', slug] as const,
  businessInfo: (description: string) => ['businessInfo', description] as const,
};

// ─── Stale Times ────────────────────────────────────────────────────────────
export const STALE_TIME = {
  templates: 5 * 60 * 1000,      // 5 minutes
  recommendations: 0,             // Always fresh - each business context is unique
  templateTheme: 30 * 60 * 1000,  // 30 minutes (rarely changes)
};
