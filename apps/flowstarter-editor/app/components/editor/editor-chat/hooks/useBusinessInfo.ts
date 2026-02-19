/**
 * useBusinessInfo Hook
 *
 * Manages business information generation and state.
 * Uses React Query mutations for API calls with automatic retries.
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { BusinessInfo } from '../types';
import type { UseBusinessInfoOptions, UseBusinessInfoReturn } from '../types/sharedState';

// ─── Generate Business Info API ─────────────────────────────────────────────

interface GenerateBusinessInfoParams {
  description: string;
  projectName?: string;
}

async function generateBusinessInfoApi(params: GenerateBusinessInfoParams): Promise<BusinessInfo | null> {
  const response = await fetch('/api/generate-business-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectDescription: params.description,
      projectName: params.projectName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate business info: ${response.status}`);
  }

  const data = (await response.json()) as { success: boolean; info?: BusinessInfo; businessInfo?: BusinessInfo };

  // Handle both API response formats (new: { success, info }, old: { businessInfo })
  return data.info || data.businessInfo || null;
}

export function useBusinessInfo(options: UseBusinessInfoOptions = {}): UseBusinessInfoReturn {
  const { onBusinessInfoConfirm } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);

  // ─── React Query Mutation ─────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: generateBusinessInfoApi,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (data) => {
      if (data) {
        setBusinessInfo(data);
      }
    },
    onError: (error) => {
      console.error('[generateBusinessInfo] Error:', error);
    },
  });

  // ─── Callbacks ────────────────────────────────────────────────────────────

  /**
   * Generate business information using LLM based on project description
   */
  const generateBusinessInfo = useCallback(
    async (description: string, projectName?: string): Promise<BusinessInfo | null> => {
      try {
        const result = await generateMutation.mutateAsync({ description, projectName });
        return result;
      } catch (error) {
        // Error already logged by mutation
        return null;
      }
    },
    [generateMutation],
  );

  /**
   * Handle user confirmation or rejection of business info
   */
  const handleBusinessInfoConfirm = useCallback(
    (confirmed: boolean) => {
      if (confirmed && businessInfo) {
        onBusinessInfoConfirm?.(businessInfo);
      }
    },
    [businessInfo, onBusinessInfoConfirm],
  );

  return {
    // State
    businessInfo,

    // Actions
    setBusinessInfo,
    generateBusinessInfo,
    handleBusinessInfoConfirm,
  };
}

export type { UseBusinessInfoOptions, UseBusinessInfoReturn };

