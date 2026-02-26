/**
 * Logo Generation Query Hooks
 */

import { useMutation } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateLogoParams {
  businessName: string;
  industry?: string;
  style?: string;
  colors?: string[];
}

export interface GenerateLogoResult {
  url: string;
  variants?: string[];
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function generateLogo(params: GenerateLogoParams): Promise<GenerateLogoResult> {
  const response = await fetch('/api/generate-logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate logo: ${response.status}`);
  }

  return response.json();
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for logo generation
 */
export function useGenerateLogo() {
  return useMutation({
    mutationFn: generateLogo,
    retry: 1,
  });
}
