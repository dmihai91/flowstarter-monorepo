/**
 * Hook for managing Daytona-based preview rendering.
 *
 * This hook:
 * 1. Fetches project files from Convex
 * 2. Sends them to the Daytona preview API
 * 3. Gets back the preview URL for iframe rendering
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../convex/_generated/dataModel';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

export interface BuildError {
  file: string;
  line: string;
  message: string;
  fullOutput: string;
}

export interface DaytonaPreviewState {
  status: 'idle' | 'creating' | 'syncing' | 'starting' | 'reconnecting' | 'ready' | 'error';
  workspaceId: string | null;
  previewUrl: string | null; // The proxied URL (local) for iframe
  rawPreviewUrl: string | null; // The actual Daytona URL
  displayUrl: string | null; // The friendly URL to show in address bar
  error: string | null;
  buildError: BuildError | null; // Structured build error for agent to fix
}

interface UseDaytonaPreviewOptions {
  projectId: Id<'projects'> | null;
  autoStart?: boolean;

  /** Called when a build error is detected. Return fixed files to auto-retry, or null to skip auto-fix. */
  onBuildError?: (
    buildError: BuildError,
    currentFiles: Record<string, string>,
  ) => Promise<Record<string, string> | null>;

  /** Max number of auto-fix attempts before giving up */
  maxAutoFixAttempts?: number;
}

interface UseDaytonaPreviewResult {
  state: DaytonaPreviewState;
  startPreview: () => Promise<void>;
  stopPreview: () => Promise<void>;
  refreshPreview: () => Promise<void>;
  retryPreview: () => Promise<void>;

  /** Manually trigger a fix for the current build error */
  fixAndRetry: (fixedFiles: Record<string, string>) => Promise<void>;
  isReady: boolean;

  /** Number of auto-fix attempts made for current preview */
  autoFixAttempts: number;
}

const PREVIEW_API = '/api/daytona/preview';

export function useDaytonaPreview({
  projectId,
  autoStart = false,
  onBuildError,
  maxAutoFixAttempts = 3,
}: UseDaytonaPreviewOptions): UseDaytonaPreviewResult {
  const [state, setState] = useState<DaytonaPreviewState>({
    status: 'idle',
    workspaceId: null,
    previewUrl: null,
    rawPreviewUrl: null,
    displayUrl: null,
    error: null,
    buildError: null,
  });

  const isStartingRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const autoFixAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const [autoFixAttempts, setAutoFixAttempts] = useState(0);

  // Query project files from Convex
  const projectFiles = useQuery(api.files.getProjectFiles, projectId ? { projectId } : 'skip');

  // Query project details to get the slug (urlId)
  const project = useQuery(api.projects.getById, projectId ? { projectId } : 'skip');

  // Cleanup refs on unmount to prevent stale state and race conditions
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isStartingRef.current = false;
      hasAutoStartedRef.current = false;
    };
  }, []);

  // Convert Convex files to Record<string, string> format
  const getFilesRecord = useCallback((): Record<string, string> => {
    console.log('[useDaytonaPreview] getFilesRecord called, projectId:', projectId, 'projectFiles:', projectFiles?.length ?? 'null/undefined');
    if (!projectFiles || projectFiles.length === 0) {
      return {};
    }

    const files: Record<string, string> = {};

    for (const file of projectFiles) {
      if (file.type === 'file' && !file.isBinary && file.content) {
        // Normalize path - ensure it starts with /
        const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
        files[path] = file.content;
      }
    }

    return files;
  }, [projectFiles]);

  // Helper to safely update state only if mounted
  const safeSetState = useCallback((updater: React.SetStateAction<DaytonaPreviewState>) => {
    if (isMountedRef.current) {
      setState(updater);
    }
  }, []);

  // Start preview
  const startPreview = useCallback(async () => {
    if (isStartingRef.current || !projectId) {
      return;
    }

    const files = getFilesRecord();

    if (Object.keys(files).length === 0) {
      console.log('[useDaytonaPreview] No files to sync');
      safeSetState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No files in project',
        buildError: null,
      }));

      return;
    }

    isStartingRef.current = true;

    try {
      // Update status through the flow
      safeSetState((prev) => ({ ...prev, status: 'creating', error: null, buildError: null }));

      console.log(`[useDaytonaPreview] Starting preview with ${Object.keys(files).length} files`);

      // Small delay to show creating state
      await new Promise((r) => setTimeout(r, 500));
      
      if (!isMountedRef.current) return;
      safeSetState((prev) => ({ ...prev, status: 'syncing' }));

      // Call the API to start preview
      const response = await fetch(PREVIEW_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
        }),
      });

      if (!isMountedRef.current) return;

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        sandboxId?: string;
        previewUrl?: string;
        buildError?: BuildError;
      };

      console.log('[useDaytonaPreview] API response:', data);

      if (!response.ok || !data.success) {
        // If there's a build error, try to auto-fix if callback is provided
        if (data.buildError) {
          console.error('[useDaytonaPreview] Build error detected:', data.buildError);
          console.log('[useDaytonaPreview] onBuildError callback:', onBuildError ? 'provided' : 'NOT PROVIDED');
          console.log('[useDaytonaPreview] autoFixAttempts:', autoFixAttemptsRef.current, '/', maxAutoFixAttempts);

          // Check if we should auto-fix
          if (onBuildError && autoFixAttemptsRef.current < maxAutoFixAttempts) {
            autoFixAttemptsRef.current++;
            setAutoFixAttempts(autoFixAttemptsRef.current);
            console.log(`[useDaytonaPreview] Auto-fix attempt ${autoFixAttemptsRef.current}/${maxAutoFixAttempts}`);

            safeSetState((prev) => ({
              ...prev,
              status: 'syncing',
              error: `Fixing build error (attempt ${autoFixAttemptsRef.current}/${maxAutoFixAttempts})...`,
              buildError: data.buildError || null,
            }));

            try {
              // Call the onBuildError callback to get fixed files
              const fixedFiles = await onBuildError(data.buildError, files);

              if (!isMountedRef.current) return;

              if (fixedFiles) {
                console.log('[useDaytonaPreview] Got fixed files, retrying preview...');

                // Retry with fixed files
                const retryResponse = await fetch(PREVIEW_API, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    projectId,
                    files: fixedFiles,
                  }),
                });

                if (!isMountedRef.current) return;

                const retryData = (await retryResponse.json()) as {
                  success?: boolean;
                  error?: string;
                  sandboxId?: string;
                  previewUrl?: string;
                  buildError?: BuildError;
                };

                if (retryResponse.ok && retryData.success && retryData.previewUrl) {
                  // Success! Reset attempts and continue
                  autoFixAttemptsRef.current = 0;
                  setAutoFixAttempts(0);

                  // Update data to use retry response
                  Object.assign(data, retryData);
                } else if (retryData.buildError && autoFixAttemptsRef.current < maxAutoFixAttempts) {
                  /*
                   * Still has error, recursively try again
                   * Note: This will be handled by the next iteration
                   */
                  safeSetState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: retryData.error || 'Build error persists after fix',
                    buildError: retryData.buildError || null,
                  }));
                  isStartingRef.current = false;

                  return;
                } else {
                  // Give up
                  safeSetState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: `Build error after ${autoFixAttemptsRef.current} fix attempts: ${retryData.error || data.error}`,
                    buildError: retryData.buildError || data.buildError || null,
                  }));
                  isStartingRef.current = false;

                  return;
                }
              } else {
                // onBuildError returned null, skip auto-fix
                safeSetState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: data.error || 'Build error',
                  buildError: data.buildError || null,
                }));
                isStartingRef.current = false;

                return;
              }
            } catch (fixError) {
              console.error('[useDaytonaPreview] Auto-fix failed:', fixError);
              safeSetState((prev) => ({
                ...prev,
                status: 'error',
                error: `Auto-fix failed: ${fixError instanceof Error ? fixError.message : 'Unknown error'}`,
                buildError: data.buildError || null,
              }));
              isStartingRef.current = false;

              return;
            }
          } else {
            // No auto-fix callback or max attempts reached
            safeSetState((prev) => ({
              ...prev,
              status: 'error',
              error: data.error || 'Build error',
              buildError: data.buildError || null,
            }));
            isStartingRef.current = false;

            return;
          }
        } else {
          throw new Error(data.error || 'Failed to start preview');
        }
      }

      // Validate that we actually got a preview URL
      if (!data.previewUrl) {
        throw new Error('Preview URL not returned from server. The Daytona sandbox may have failed to start.');
      }

      if (!isMountedRef.current) return;
      safeSetState((prev) => ({ ...prev, status: 'starting' }));

      // Small delay to show starting state
      await new Promise((r) => setTimeout(r, 1000));

      if (!isMountedRef.current) return;

      // Use proxy URL for iframe to avoid X-Frame-Options issues
      const proxyUrl = `/preview/${projectId}/`;

      // Use project name slug for the friendly display URL (urlId may be a random auto-generated ID)
      const projectSlug =
        project?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || project?.urlId || projectId.toString().slice(-8);
      const displayUrl = `https://${projectSlug}.flowstarter.app`;

      safeSetState({
        status: 'ready',
        workspaceId: data.sandboxId || null,
        previewUrl: proxyUrl,
        rawPreviewUrl: data.previewUrl,
        displayUrl,
        error: null,
        buildError: null,
      });

      console.log(`[useDaytonaPreview] Preview ready at ${proxyUrl} (raw: ${data.previewUrl})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      safeSetState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        buildError: null,
      }));
      console.error('[useDaytonaPreview] Failed to start preview:', error);
    } finally {
      isStartingRef.current = false;
    }
  }, [projectId, getFilesRecord, project, onBuildError, maxAutoFixAttempts, safeSetState]);

  // Stop preview
  const stopPreview = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      await fetch(PREVIEW_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      safeSetState({
        status: 'idle',
        workspaceId: null,
        previewUrl: null,
        rawPreviewUrl: null,
        displayUrl: null,
        error: null,
        buildError: null,
      });
    } catch (error) {
      console.error('[useDaytonaPreview] Failed to stop preview:', error);
    }
  }, [projectId, safeSetState]);

  // Refresh preview (re-sync files)
  const refreshPreview = useCallback(async () => {
    if (!projectId || state.status !== 'ready') {
      return;
    }

    const files = getFilesRecord();

    if (Object.keys(files).length === 0) {
      return;
    }

    try {
      safeSetState((prev) => ({ ...prev, status: 'syncing' }));

      const response = await fetch(PREVIEW_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          files,
        }),
      });

      if (!isMountedRef.current) return;

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        previewUrl?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh preview');
      }

      /*
       * Keep the proxy URL (don't replace with raw Daytona URL from API)
       * The API returns the raw Daytona URL, but we want to keep using our proxy
       */
      safeSetState((prev) => ({
        ...prev,
        status: 'ready',
        rawPreviewUrl: data.previewUrl || prev.rawPreviewUrl,

        // Don't update previewUrl - keep the proxy URL
      }));
    } catch (error) {
      console.error('[useDaytonaPreview] Failed to refresh preview:', error);

      // Don't change status to error, just log it
      safeSetState((prev) => ({ ...prev, status: 'ready' }));
    }
  }, [projectId, state.status, getFilesRecord, safeSetState]);

  // Retry preview (reset state and start fresh)
  const retryPreview = useCallback(async () => {
    console.log('[useDaytonaPreview] Retrying preview...');

    // Reset state to idle first
    safeSetState({
      status: 'idle',
      workspaceId: null,
      previewUrl: null,
      rawPreviewUrl: null,
      displayUrl: null,
      error: null,
      buildError: null,
    });

    // Reset auto-fix attempts
    autoFixAttemptsRef.current = 0;
    setAutoFixAttempts(0);

    // Clear the starting ref to allow restart
    isStartingRef.current = false;

    // Small delay to ensure state is reset
    await new Promise((r) => setTimeout(r, 100));

    if (!isMountedRef.current) return;

    // Start fresh
    await startPreview();
  }, [startPreview, safeSetState]);

  // Manually fix and retry with provided fixed files
  const fixAndRetry = useCallback(
    async (fixedFiles: Record<string, string>) => {
      if (!projectId) {
        return;
      }

      console.log('[useDaytonaPreview] Manual fix and retry with', Object.keys(fixedFiles).length, 'files');

      safeSetState((prev) => ({
        ...prev,
        status: 'syncing',
        error: 'Applying fix and retrying...',
      }));

      try {
        const response = await fetch(PREVIEW_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            files: fixedFiles,
          }),
        });

        if (!isMountedRef.current) return;

        const data = (await response.json()) as {
          success?: boolean;
          error?: string;
          sandboxId?: string;
          previewUrl?: string;
          buildError?: BuildError;
        };

        if (!response.ok || !data.success) {
          safeSetState((prev) => ({
            ...prev,
            status: 'error',
            error: data.error || 'Fix failed',
            buildError: data.buildError || null,
          }));
          return;
        }

        // Success!
        const proxyUrl = `/preview/${projectId}/`;
        const projectSlug =
          project?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || project?.urlId || projectId.toString().slice(-8);
        const displayUrl = `https://${projectSlug}.flowstarter.app`;

        safeSetState({
          status: 'ready',
          workspaceId: data.sandboxId || null,
          previewUrl: proxyUrl,
          rawPreviewUrl: data.previewUrl || null,
          displayUrl,
          error: null,
          buildError: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        safeSetState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
      }
    },
    [projectId, project, safeSetState],
  );

  // Auto-start preview if enabled and files are loaded
  // First check if project already has a cached/persisted preview URL in Convex
  // This avoids a full rebuild on page reload
  useEffect(() => {
    if (
      autoStart &&
      projectId &&
      state.status === 'idle' &&
      !hasAutoStartedRef.current &&
      project?.workspaceUrl &&
      project?.daytonaWorkspaceId &&
      project?.workspaceStatus === 'running'
    ) {
      hasAutoStartedRef.current = true;
      console.log('[useDaytonaPreview] Found persisted preview URL, reconnecting...', project.workspaceUrl);

      const proxyUrl = `/preview/${projectId}/`;
      const nameSlug = project.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || project.urlId || projectId.toString().slice(-8);
      const displayUrl = `https://${nameSlug}.flowstarter.app`;

      // Show "Restoring preview..." while we verify the cached URL is still alive
      safeSetState({
        status: 'reconnecting',
        workspaceId: project.daytonaWorkspaceId,
        previewUrl: proxyUrl,
        rawPreviewUrl: project.workspaceUrl,
        displayUrl,
        error: null,
        buildError: null,
      });

      // Health check: verify the proxy URL is actually serving the site (not Daytona's startup page)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      fetch(proxyUrl, { method: 'GET', signal: controller.signal })
        .then(async (res) => {
          clearTimeout(timeoutId);
          if (!isMountedRef.current) return;

          if (res.ok) {
            // Check response body — Daytona returns 200 with "Preview Server Starting" when workspace is waking up
            const body = await res.text().catch(() => '');
            const isDaytonaStartupPage = body.includes('Preview Server Starting') || body.includes('preview server is still initializing');

            if (isDaytonaStartupPage) {
              console.log('[useDaytonaPreview] Got Daytona startup page (workspace alive but dev server not running), restarting preview');
              hasAutoStartedRef.current = false;
              safeSetState((prev) => ({ ...prev, status: 'idle' }));
            } else {
              console.log('[useDaytonaPreview] Health check passed, preview is alive');
              safeSetState((prev) => ({ ...prev, status: 'ready' }));
            }
          } else {
            console.log('[useDaytonaPreview] Health check failed (status', res.status, '), restarting preview');
            hasAutoStartedRef.current = false;
            safeSetState((prev) => ({ ...prev, status: 'idle' }));
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);
          if (!isMountedRef.current) return;
          console.log('[useDaytonaPreview] Health check failed (network error), restarting preview');
          hasAutoStartedRef.current = false;
          safeSetState((prev) => ({ ...prev, status: 'idle' }));
        });
    }
  }, [autoStart, projectId, project, state.status, safeSetState]);

  // Fall back to full preview start if no cached URL or files not yet loaded
  useEffect(() => {
    if (
      autoStart &&
      projectId &&
      Array.isArray(projectFiles) &&
      projectFiles.length > 0
    ) {
      if (state.status === 'idle' && !hasAutoStartedRef.current) {
        hasAutoStartedRef.current = true;
        startPreview();
      } else if (state.status === 'error' && state.error === 'No files in project' && !isStartingRef.current) {
        // Files became available after initial error — retry
        console.log('[useDaytonaPreview] Files now available, retrying after previous empty-files error');
        startPreview();
      }
    }
  }, [autoStart, projectId, projectFiles, state.status, state.error, startPreview]);

  // Sync with workbenchStore.daytonaPreview - this catches previews started by build handlers
  const workbenchPreview = useStore(workbenchStore.daytonaPreview);

  useEffect(() => {
    // If workbenchStore has a preview URL and we're still idle, sync the state
    if (workbenchPreview?.url && state.status === 'idle' && projectId) {
      console.log('[useDaytonaPreview] Syncing preview from workbenchStore:', workbenchPreview.url);

      // Use proxy URL for iframe (avoid X-Frame-Options issues)
      // workbenchStore.url could be either proxy URL or raw Daytona URL
      const proxyUrl = workbenchPreview.url.startsWith('/preview/') ? workbenchPreview.url : `/preview/${projectId}/`;

      // Build display URL from project info (prefer name-derived slug over random urlId)
      const projectSlug =
        project?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || project?.urlId || projectId.toString().slice(-8);
      const displayUrl = `https://${projectSlug}.flowstarter.app`;

      safeSetState({
        status: 'ready',
        workspaceId: workbenchPreview.sandboxId || null,
        previewUrl: proxyUrl,
        rawPreviewUrl: workbenchPreview.url,
        displayUrl,
        error: null,
        buildError: null,
      });
    }
  }, [workbenchPreview, state.status, projectId, project, safeSetState]);

  // Update displayUrl when project name becomes available (project query may resolve after initial state set)
  useEffect(() => {
    if (state.status === 'ready' && project?.name && projectId) {
      const nameSlug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const expectedDisplayUrl = `https://${nameSlug}.flowstarter.app`;
      if (state.displayUrl !== expectedDisplayUrl) {
        console.log('[useDaytonaPreview] Updating displayUrl with project name:', nameSlug);
        safeSetState((prev) => ({ ...prev, displayUrl: expectedDisplayUrl }));
      }
    }
  }, [state.status, project?.name, projectId, state.displayUrl, safeSetState]);

  // Reset auto-start flag when projectId changes
  useEffect(() => {
    hasAutoStartedRef.current = false;
  }, [projectId]);

  return {
    state,
    startPreview,
    stopPreview,
    refreshPreview,
    retryPreview,
    fixAndRetry,
    isReady: state.status === 'ready',
    autoFixAttempts,
  };
}

/**
 * Helper function to fix a build error using the LLM API.
 * Can be used as the onBuildError callback for useDaytonaPreview.
 *
 * @param buildError - The build error details
 * @param currentFiles - The current project files
 * @returns Fixed files if successful, null if failed
 */
export async function fixBuildErrorWithLLM(
  buildError: BuildError,
  currentFiles: Record<string, string>,
): Promise<Record<string, string> | null> {
  console.log(`[fixBuildErrorWithLLM] Fixing error in ${buildError.file}`);
  console.log(`[fixBuildErrorWithLLM] Available files:`, Object.keys(currentFiles));

  // Try multiple path variations to find the file
  const pathVariations = [
    buildError.file,
    `/${buildError.file}`,
    buildError.file.replace(/^\//, ''),
    `app/${buildError.file}`,
    `/app/${buildError.file}`,
  ];

  let fileContent: string | undefined;
  let foundPath: string | undefined;

  for (const path of pathVariations) {
    if (currentFiles[path]) {
      fileContent = currentFiles[path];
      foundPath = path;
      console.log(`[fixBuildErrorWithLLM] Found file at path: ${path}`);
      break;
    }
  }

  if (!fileContent) {
    console.error(`[fixBuildErrorWithLLM] Cannot find file ${buildError.file} in current files`);
    console.error(`[fixBuildErrorWithLLM] Tried paths:`, pathVariations);

    return null;
  }

  try {
    const response = await fetch('/api/fix-build-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildError,
        fileContent,
        maxAttempts: 2, // Quick fix attempts
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      fixedContent?: string;
      summary?: string;
      error?: string;
    };

    if (!response.ok || !data.success || !data.fixedContent) {
      console.error(`[fixBuildErrorWithLLM] Fix failed:`, data.error);
      return null;
    }

    console.log(`[fixBuildErrorWithLLM] Fixed: ${data.summary}`);
    console.log(`[fixBuildErrorWithLLM] Applying fix to path: ${foundPath}`);

    // Return updated files with the fix applied
    const fixedFiles = { ...currentFiles };
    fixedFiles[foundPath!] = data.fixedContent;

    return fixedFiles;
  } catch (error) {
    console.error(`[fixBuildErrorWithLLM] API call failed:`, error);
    return null;
  }
}

/**
 * Create a default onBuildError handler that uses the LLM API.
 * This is a convenience function for components that want auto-fix behavior.
 */
export function createAutoFixHandler() {
  return async (buildError: BuildError, currentFiles: Record<string, string>) => {
    return fixBuildErrorWithLLM(buildError, currentFiles);
  };
}

