/**
 * API operations hook for Daytona preview.
 */

import { useCallback } from 'react';
import type { BuildError, DaytonaPreviewState, PreviewApiResponse, ProjectData } from './types';
import { PREVIEW_API, generateProxyUrl, generateDisplayUrl } from './utils';

interface UseDaytonaApiOptions {
  projectId: string | null;
  project: ProjectData | null | undefined;
  getFilesRecord: () => Record<string, string>;
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  isStartingRef: React.MutableRefObject<boolean>;
  autoFixAttemptsRef: React.MutableRefObject<number>;
  setAutoFixAttempts: React.Dispatch<React.SetStateAction<number>>;
  onBuildError?: (
    buildError: BuildError,
    currentFiles: Record<string, string>,
  ) => Promise<Record<string, string> | null>;
  maxAutoFixAttempts: number;
}

export interface UseDaytonaApiResult {
  startPreview: () => Promise<void>;
  stopPreview: () => Promise<void>;
  refreshPreview: (currentStatus: string) => Promise<void>;
  fixAndRetry: (fixedFiles: Record<string, string>) => Promise<void>;
}

/**
 * Hook providing API operations for Daytona preview.
 */
export function useDaytonaApi({
  projectId,
  project,
  getFilesRecord,
  safeSetState,
  isMountedRef,
  isStartingRef,
  autoFixAttemptsRef,
  setAutoFixAttempts,
  onBuildError,
  maxAutoFixAttempts,
}: UseDaytonaApiOptions): UseDaytonaApiResult {
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

      const data = (await response.json()) as PreviewApiResponse;

      console.log('[useDaytonaPreview] API response:', data);

      if (!response.ok || !data.success) {
        // If there's a build error, try to auto-fix if callback is provided
        if (data.buildError) {
          const shouldContinue = await handleBuildError(
            data,
            files,
            projectId,
            onBuildError,
            maxAutoFixAttempts,
            autoFixAttemptsRef,
            setAutoFixAttempts,
            safeSetState,
            isMountedRef,
          );

          if (!shouldContinue) {
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
      const proxyUrl = generateProxyUrl(projectId);
      const displayUrl = generateDisplayUrl(project, projectId);

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
  }, [
    projectId,
    project,
    getFilesRecord,
    safeSetState,
    isMountedRef,
    isStartingRef,
    autoFixAttemptsRef,
    setAutoFixAttempts,
    onBuildError,
    maxAutoFixAttempts,
  ]);

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
  const refreshPreview = useCallback(
    async (currentStatus: string) => {
      if (!projectId || currentStatus !== 'ready') {
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

        const data = (await response.json()) as PreviewApiResponse;

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
    },
    [projectId, getFilesRecord, safeSetState, isMountedRef],
  );

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

        const data = (await response.json()) as PreviewApiResponse;

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
        const proxyUrl = generateProxyUrl(projectId);
        const displayUrl = generateDisplayUrl(project, projectId);

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
    [projectId, project, safeSetState, isMountedRef],
  );

  return {
    startPreview,
    stopPreview,
    refreshPreview,
    fixAndRetry,
  };
}

/**
 * Handle build errors with optional auto-fix.
 * Returns true if processing should continue (fix succeeded), false otherwise.
 */
async function handleBuildError(
  data: PreviewApiResponse,
  files: Record<string, string>,
  projectId: string,
  onBuildError:
    | ((buildError: BuildError, currentFiles: Record<string, string>) => Promise<Record<string, string> | null>)
    | undefined,
  maxAutoFixAttempts: number,
  autoFixAttemptsRef: React.MutableRefObject<number>,
  setAutoFixAttempts: React.Dispatch<React.SetStateAction<number>>,
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void,
  isMountedRef: React.MutableRefObject<boolean>,
): Promise<boolean> {
  console.error('[useDaytonaPreview] Build error detected:', data.buildError);
  console.log('[useDaytonaPreview] onBuildError callback:', onBuildError ? 'provided' : 'NOT PROVIDED');
  console.log('[useDaytonaPreview] autoFixAttempts:', autoFixAttemptsRef.current, '/', maxAutoFixAttempts);

  // Check if we should auto-fix
  if (onBuildError && autoFixAttemptsRef.current < maxAutoFixAttempts && data.buildError) {
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

      if (!isMountedRef.current) return false;

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

        if (!isMountedRef.current) return false;

        const retryData = (await retryResponse.json()) as PreviewApiResponse;

        if (retryResponse.ok && retryData.success && retryData.previewUrl) {
          // Success! Reset attempts and update data
          autoFixAttemptsRef.current = 0;
          setAutoFixAttempts(0);

          // Copy retry data to original data object
          Object.assign(data, retryData);
          return true;
        } else if (retryData.buildError && autoFixAttemptsRef.current < maxAutoFixAttempts) {
          /*
           * Still has error, will need to retry
           * Note: This will be handled by the next iteration
           */
          safeSetState((prev) => ({
            ...prev,
            status: 'error',
            error: retryData.error || 'Build error persists after fix',
            buildError: retryData.buildError || null,
          }));

          return false;
        } else {
          // Give up
          safeSetState((prev) => ({
            ...prev,
            status: 'error',
            error: `Build error after ${autoFixAttemptsRef.current} fix attempts: ${retryData.error || data.error}`,
            buildError: retryData.buildError || data.buildError || null,
          }));

          return false;
        }
      } else {
        // onBuildError returned null, skip auto-fix
        safeSetState((prev) => ({
          ...prev,
          status: 'error',
          error: data.error || 'Build error',
          buildError: data.buildError || null,
        }));

        return false;
      }
    } catch (fixError) {
      console.error('[useDaytonaPreview] Auto-fix failed:', fixError);
      safeSetState((prev) => ({
        ...prev,
        status: 'error',
        error: `Auto-fix failed: ${fixError instanceof Error ? fixError.message : 'Unknown error'}`,
        buildError: data.buildError || null,
      }));

      return false;
    }
  } else {
    // No auto-fix callback or max attempts reached
    safeSetState((prev) => ({
      ...prev,
      status: 'error',
      error: data.error || 'Build error',
      buildError: data.buildError || null,
    }));

    return false;
  }
}
