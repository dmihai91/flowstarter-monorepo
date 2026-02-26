/**
 * Build/Site Generation Query Hooks
 */

import { useMutation } from '@tanstack/react-query';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';
import { fetchTemplateFiles, syncFilesToConvex } from './files';
import { startDaytonaPreview } from './daytona';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GenerateSiteParams {
  projectId: string;
  templateSlug: string;
  businessInfo: BusinessInfo;
  palette?: any;
  font?: any;
  logoUrl?: string;
}

export interface GenerateSiteResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  error?: string;
}

export interface GenerateSiteStreamParams {
  projectId: string;
  siteName: string;
  businessInfo: {
    name: string;
    tagline?: string;
    description?: string;
    services?: string[];
  };
  template: {
    slug: string;
    name: string;
  };
  design: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    headingFont: string;
  };
  integrations?: Array<{
    id: string;
    name: string;
    config: Record<string, unknown>;
  }>;
  deployToPreview?: boolean;
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
}

export interface GenerateSiteStreamResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  preview?: {
    url: string;
    sandboxId: string;
  };
  previewError?: string;
  selfHealAttempts?: number;
  error?: string;
}

export interface BuildPipelineParams {
  // Clone step
  urlId: string;
  projectId: string;
  
  // Files
  templateFiles?: Record<string, string>;
  essentialFiles?: Record<string, string>;
  
  // Callbacks
  signal?: AbortSignal;
  onStep?: (step: string) => void;
  onProgress?: (progress: number) => void;
}

export interface BuildPipelineResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  files: Record<string, string>;
}

// ─── API Functions ──────────────────────────────────────────────────────────

async function generateSite(params: GenerateSiteParams): Promise<GenerateSiteResult> {
  const response = await fetch('/api/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Failed to generate site: ${response.status}`);
  }

  return response.json();
}

async function generateSiteWithStream(params: GenerateSiteStreamParams): Promise<GenerateSiteStreamResult> {
  const { signal, onProgress, ...body } = params;

  const response = await fetch('/api/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `Generation failed: ${response.status}`);
  }

  // Process SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is missing');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let result: GenerateSiteStreamResult | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'progress' && onProgress) {
            onProgress(data.message);
          } else if (data.type === 'error') {
            throw new Error(data.error);
          } else if (data.type === 'complete') {
            result = data.result;
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
            console.warn('Error parsing SSE data:', e);
          }
        }
      }
    }
  }

  if (!result) {
    throw new Error('Stream ended without completion result');
  }

  if (!result.success) {
    throw new Error(result.error || 'Site generation failed');
  }

  return result;
}

/**
 * Execute the full build pipeline: fetch files → sync → preview
 */
async function executeBuildPipeline(params: BuildPipelineParams): Promise<BuildPipelineResult> {
  const { urlId, projectId, essentialFiles = {}, signal, onStep, onProgress } = params;

  let allFiles: Record<string, string> = { ...essentialFiles };

  // Step 1: Fetch template files
  onStep?.('Fetching template files...');
  onProgress?.(10);

  try {
    const templateResult = await fetchTemplateFiles({ urlId, signal });
    allFiles = { ...templateResult.files, ...allFiles }; // Essential files override template
  } catch (error) {
    console.warn('Failed to fetch template files:', error);
  }

  onProgress?.(30);

  // Step 2: Sync to Convex
  onStep?.('Syncing files...');
  onProgress?.(50);

  const convexFiles = Object.entries(allFiles).map(([path, content]) => ({
    path,
    content,
    type: 'file',
    isBinary: false,
  }));

  await syncFilesToConvex({ projectId, files: convexFiles, signal });
  onProgress?.(70);

  // Step 3: Start preview
  onStep?.('Starting preview server...');
  onProgress?.(80);

  const previewResult = await startDaytonaPreview({ 
    projectId, 
    files: allFiles, 
    signal 
  });

  onProgress?.(100);

  return {
    success: previewResult.success,
    previewUrl: previewResult.previewUrl,
    sandboxId: previewResult.sandboxId,
    files: allFiles,
  };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Mutation hook for site generation
 */
export function useGenerateSite() {
  return useMutation({
    mutationFn: generateSite,
    retry: 1, // Only retry once for expensive operations
    retryDelay: 2000,
  });
}

/**
 * Mutation hook for full site generation with SSE streaming
 * Supports progress callbacks for UI updates
 */
export function useGenerateSiteStream() {
  return useMutation({
    mutationFn: generateSiteWithStream,
    retry: 0, // Don't retry streaming operations
  });
}

/**
 * Mutation hook for the complete build pipeline
 */
export function useBuildPipeline() {
  return useMutation({
    mutationFn: executeBuildPipeline,
    retry: 0, // Don't retry complex pipelines
  });
}
