/**
 * React Query Hooks for Editor API Calls
 * 
 * Centralized API hooks with caching, retries, and error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const queryKeys = {
  templates: ['templates'] as const,
  recommendations: (businessInfo: BusinessInfo | null) => ['recommendations', businessInfo] as const,
  projectName: (description: string) => ['projectName', description] as const,
  templateTheme: (slug: string) => ['templateTheme', slug] as const,
  businessInfo: (description: string) => ['businessInfo', description] as const,
};

// ─── Stale Times ────────────────────────────────────────────────────────────
const STALE_TIME = {
  templates: 5 * 60 * 1000,      // 5 minutes
  recommendations: 0,             // Always fresh - each business context is unique
  templateTheme: 30 * 60 * 1000,  // 30 minutes (rarely changes)
};

// ─── Template Recommendations ───────────────────────────────────────────────

interface RecommendationsParams {
  businessInfo: BusinessInfo;
  projectName: string;
  projectDescription: string;
}

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

// ─── Project Name Generation ────────────────────────────────────────────────

interface GenerateNameParams {
  description: string;
  businessInfo?: BusinessInfo;
  style?: 'creative' | 'professional' | 'playful';
}

interface GenerateNameResult {
  name: string;
  alternatives?: string[];
}

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

// ─── Site Generation ────────────────────────────────────────────────────────

interface GenerateSiteParams {
  projectId: string;
  templateSlug: string;
  businessInfo: BusinessInfo;
  palette?: any;
  font?: any;
  logoUrl?: string;
}

interface GenerateSiteResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  error?: string;
}

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

// ─── Business Info Extraction ───────────────────────────────────────────────

interface ExtractBusinessInfoParams {
  description: string;
  url?: string;
}

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

/**
 * Mutation hook for extracting business info from description/URL
 */
export function useExtractBusinessInfo() {
  return useMutation({
    mutationFn: extractBusinessInfo,
    retry: 2,
  });
}

// ─── Generate Business Info ─────────────────────────────────────────────────

interface GenerateBusinessInfoParams {
  field: string;
  context: {
    description?: string;
    name?: string;
    existingInfo?: Partial<BusinessInfo>;
  };
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

/**
 * Mutation hook for generating individual business info fields
 */
export function useGenerateBusinessInfo() {
  return useMutation({
    mutationFn: generateBusinessInfo,
    retry: 2,
  });
}

// ─── Template Theme ─────────────────────────────────────────────────────────

interface TemplateTheme {
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text?: string;
  };
}

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

// ─── Logo Generation ────────────────────────────────────────────────────────

interface GenerateLogoParams {
  businessName: string;
  industry?: string;
  style?: string;
  colors?: string[];
}

interface GenerateLogoResult {
  url: string;
  variants?: string[];
}

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

/**
 * Mutation hook for logo generation
 */
export function useGenerateLogo() {
  return useMutation({
    mutationFn: generateLogo,
    retry: 1,
  });
}

// ─── File Operations ────────────────────────────────────────────────────────

interface SyncFilesParams {
  workspaceId: string;
  files: Array<{ path: string; content: string }>;
}

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

/**
 * Mutation hook for syncing files to workspace
 */
export function useSyncFiles() {
  return useMutation({
    mutationFn: syncFiles,
    retry: 2,
  });
}

// ─── Orchestrator Files ─────────────────────────────────────────────────────

interface OrchestratorFilesParams {
  projectId: string;
}

interface OrchestratorFilesResult {
  files: Array<{ path: string; content: string }>;
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

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR / BUILD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Fetch Template Files (Orchestrator) ────────────────────────────────────

interface FetchTemplateFilesParams {
  urlId: string;
  signal?: AbortSignal;
}

interface TemplateFilesResult {
  files: Record<string, string>;
}

async function fetchTemplateFiles(params: FetchTemplateFilesParams): Promise<TemplateFilesResult> {
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

// ─── Sync Files to Convex ───────────────────────────────────────────────────

interface SyncFilesToConvexParams {
  projectId: string;
  files: Array<{ path: string; content: string; type?: string; isBinary?: boolean }>;
  signal?: AbortSignal;
}

async function syncFilesToConvex(params: SyncFilesToConvexParams): Promise<{ success: boolean }> {
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

// ─── Start Daytona Preview ──────────────────────────────────────────────────

interface StartPreviewParams {
  projectId: string;
  files: Record<string, string>;
  signal?: AbortSignal;
}

interface StartPreviewResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;
}

async function startDaytonaPreview(params: StartPreviewParams): Promise<StartPreviewResult> {
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

// ─── Full Site Generation (SSE Stream) ──────────────────────────────────────

interface GenerateSiteStreamParams {
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

interface GenerateSiteStreamResult {
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
 * Mutation hook for full site generation with SSE streaming
 * Supports progress callbacks for UI updates
 */
export function useGenerateSiteStream() {
  return useMutation({
    mutationFn: generateSiteWithStream,
    retry: 0, // Don't retry streaming operations
  });
}

// ─── Combined Build Pipeline ────────────────────────────────────────────────

interface BuildPipelineParams {
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

interface BuildPipelineResult {
  success: boolean;
  previewUrl?: string;
  sandboxId?: string;
  files: Record<string, string>;
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

/**
 * Mutation hook for the complete build pipeline
 */
export function useBuildPipeline() {
  return useMutation({
    mutationFn: executeBuildPipeline,
    retry: 0, // Don't retry complex pipelines
  });
}

// ─── Sync Files to Workbench ────────────────────────────────────────────────

interface SyncToWorkbenchParams {
  orchestrationId: string;
}

interface SyncToWorkbenchResult {
  files: Record<string, string>;
  fileCount: number;
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

// ─── Sync to Daytona Workspace ──────────────────────────────────────────────

interface SyncToDaytonaParams {
  workspaceId: string;
  files: Record<string, string>;
  signal?: AbortSignal;
}

interface SyncToDaytonaResult {
  fileCount: number;
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

