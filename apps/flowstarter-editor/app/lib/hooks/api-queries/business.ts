/**
 * Business Info Query Hooks
 */

import { useMutation } from '@tanstack/react-query';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractBusinessInfoParams {
  description: string;
  url?: string;
}

export interface GenerateBusinessInfoParams {
  field: string;
  context: {
    description?: string;
    name?: string;
    existingInfo?: Partial<BusinessInfo>;
  };
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function extractBusinessInfo(params: ExtractBusinessInfoParams): Promise<BusinessInfo> {
  const response = await fetch('/api/extract-business-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to extract business info: ${response.status}`);
  }

  const data = await response.json() as { businessInfo?: unknown; value?: unknown; data?: { theme?: unknown } };
  return data.businessInfo as BusinessInfo;
}

async function generateBusinessInfo(params: GenerateBusinessInfoParams): Promise<string> {
  const response = await fetch('/api/generate-business-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate business info: ${response.status}`);
  }

  const data = await response.json() as { businessInfo?: unknown; value?: unknown; data?: { theme?: unknown } };
  return data.value as string;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for extracting business info from description/URL
 */
export function useExtractBusinessInfo() {
  return useMutation({
    mutationFn: extractBusinessInfo,
    retry: 2,
  });
}

/**
 * Mutation hook for generating individual business info fields
 */
export function useGenerateBusinessInfo() {
  return useMutation({
    mutationFn: generateBusinessInfo,
    retry: 2,
  });
}
