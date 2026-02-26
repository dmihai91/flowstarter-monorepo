/**
 * File Operations Query Hooks
 */

import { useQuery, useMutation } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SyncFilesParams {
  workspaceId: string;
  files: Array<{ path: string; content: string }>;
}

export interface OrchestratorFilesParams {
  projectId: string;
}

export interface OrchestratorFilesResult {
  files: Array<{ path: string; content: string }>;
}

export interface FetchTemplateFilesParams {
  urlId: string;
  signal?: AbortSignal;
}

export interface TemplateFilesResult {
  files: Record<string, string>;
}

export interface SyncFilesToConvexParams {
  projectId: string;
  files: Array<{ path: string; content: string; type?: string; isBinary?: boolean }>;
  signal?: AbortSignal;
}

export interface SyncToWorkbenchParams {
  orchestrationId: string;
}

export interface SyncToWorkbenchResult {
  files: Record<string, string>;
  fileCount: number;
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function syncFiles(params: SyncFilesParams): Promise<{ success: boolean }> {
  const response = await fetch(`/api/daytona/workspace/${params.workspaceId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: params.files }),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync files: ${response.status}`);
  }

  return response.json();
}

async function fetchOrchestratorFiles(params: OrchestratorFilesParams): Promise<OrchestratorFilesResult> {
  const response = await fetch('/api/orchestrator?action=files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch files: ${response.status}`);
  }

  return response.json();
}

export async function fetchTemplateFiles(params: FetchTemplateFilesParams): Promise<TemplateFilesResult> {
  const response = await fetch('/api/orchestrator?action=files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urlId: params.urlId }),
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch template files: ${response.status}`);
  }

  const data = await response.json() as { files?: Record<string, { content?: string } | string> };
  
  // Normalize file content
  const files: Record<string, string> = {};
  for (const [path, fileData] of Object.entries(data.files || {})) {
    const content = typeof fileData === 'string' ? fileData : fileData?.content;
    if (content) {
      files[path] = content;
    }
  }

  return { files };
}

export async function syncFilesToConvex(params: SyncFilesToConvexParams): Promise<{ success: boolean }> {
  const response = await fetch('/api/orchestrator?action=sync-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      projectId: params.projectId, 
      files: params.files 
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to sync files: ${response.status}`);
  }

  return response.json();
}

async function fetchFilesForWorkbench(params: SyncToWorkbenchParams): Promise<SyncToWorkbenchResult> {
  const response = await fetch('/api/orchestrator?action=files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orchestrationId: params.orchestrationId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch files from orchestrator: ${response.status}`);
  }

  const data = (await response.json()) as { files?: Record<string, string> };
  const files = data.files || {};

  return {
    files,
    fileCount: Object.keys(files).length,
  };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for syncing files to workspace
 */
export function useSyncFiles() {
  return useMutation({
    mutationFn: syncFiles,
    retry: 2,
  });
}

/**
 * Query hook for fetching orchestrator files
 */
export function useOrchestratorFiles(projectId: string | null) {
  return useQuery({
    queryKey: ['orchestratorFiles', projectId],
    queryFn: () => fetchOrchestratorFiles({ projectId: projectId! }),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Mutation hook for fetching template files from orchestrator
 * Uses mutation because it's typically called once during build
 */
export function useFetchTemplateFiles() {
  return useMutation({
    mutationFn: fetchTemplateFiles,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Mutation hook for syncing files to Convex
 */
export function useSyncFilesToConvex() {
  return useMutation({
    mutationFn: syncFilesToConvex,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Mutation hook for fetching files from orchestrator and syncing to workbench
 * Returns the files so the caller can update the workbench store
 */
export function useSyncToWorkbench() {
  return useMutation({
    mutationFn: fetchFilesForWorkbench,
    retry: 2,
    retryDelay: 1000,
  });
}
