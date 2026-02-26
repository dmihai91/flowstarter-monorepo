/**
 * Daytona Workspace Query Hooks
 */

import { useMutation } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StartPreviewParams {
  projectId: string;
  files: Record<string, string>;
  signal?: AbortSignal;
}

export interface StartPreviewResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;
}

export interface SyncToDaytonaParams {
  workspaceId: string;
  files: Record<string, string>;
  signal?: AbortSignal;
}

export interface SyncToDaytonaResult {
  fileCount: number;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function startDaytonaPreview(params: StartPreviewParams): Promise<StartPreviewResult> {
  const response = await fetch('/api/daytona/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      projectId: params.projectId, 
      files: params.files 
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `Failed to start preview: ${response.status}`);
  }

  return response.json();
}

async function syncToDaytonaWorkspace(params: SyncToDaytonaParams): Promise<SyncToDaytonaResult> {
  const response = await fetch(`/api/daytona/workspace/${params.workspaceId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: params.files }),
    signal: params.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sync files to Daytona: ${error}`);
  }

  const data = (await response.json()) as { fileCount?: number };
  return {
    fileCount: data.fileCount || Object.keys(params.files).length,
  };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for starting Daytona preview
 */
export function useStartDaytonaPreview() {
  return useMutation({
    mutationFn: startDaytonaPreview,
    retry: 1, // Preview can be expensive, limit retries
    retryDelay: 2000,
  });
}

/**
 * Mutation hook for syncing files to Daytona workspace
 */
export function useSyncToDaytona() {
  return useMutation({
    mutationFn: syncToDaytonaWorkspace,
    retry: 2,
    retryDelay: 1000,
  });
}
