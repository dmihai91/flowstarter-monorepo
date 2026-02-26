/**
 * Project-related Query Hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';
import { queryKeys } from './keys';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateNameParams {
  description: string;
  businessInfo?: BusinessInfo;
  style?: 'creative' | 'professional' | 'playful';
}

export interface GenerateNameResult {
  name: string;
  alternatives?: string[];
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function generateProjectName(params: GenerateNameParams): Promise<GenerateNameResult> {
  const response = await fetch('/api/generate-project-name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate name: ${response.status}`);
  }

  return response.json();
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for generating project names
 * Use mutation because we want fresh names on each click
 */
export function useGenerateProjectName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateProjectName,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (data, variables) => {
      // Optionally cache the result
      queryClient.setQueryData(queryKeys.projectName(variables.description), data);
    },
  });
}
