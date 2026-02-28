/**
 * Side effects for Daytona preview (auto-start, workbench sync, etc.)
 */

import { useEffect } from 'react';
import type { DaytonaPreviewState, ProjectData, ProjectFileData } from './types';
import { generateProxyUrl, generateDisplayUrl, generateProjectSlug } from './utils';
import { generatePreviewUrl } from '~/lib/config/domains';

/** Preview state from workbench store */
export interface WorkbenchPreviewState {
  url: string | null;
  sandboxId: string | null;
}

interface UseDaytonaEffectsOptions {
  projectId: string | null;
  project: ProjectData | null | undefined;
  projectFiles: ProjectFileData[] | null | undefined;
  autoStart: boolean;
  state: DaytonaPreviewState;
  workbenchPreview: WorkbenchPreviewState;
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  hasAutoStartedRef: React.MutableRefObject<boolean>;
  isStartingRef: React.MutableRefObject<boolean>;
  startPreview: () => Promise<void>;
}

/**
 * Hook that manages side effects for Daytona preview.
 */
export function useDaytonaEffects({
  projectId,
  project,
  projectFiles,
  autoStart,
  state,
  workbenchPreview,
  safeSetState,
  isMountedRef,
  hasAutoStartedRef,
  isStartingRef,
  startPreview,
}: UseDaytonaEffectsOptions): void {
  // Try to reconnect to existing preview from Convex
  useReconnectToCachedPreview({
    autoStart,
    projectId,
    project,
    status: state.status,
    safeSetState,
    isMountedRef,
    hasAutoStartedRef,
  });

  // Auto-start preview when files are available
  useAutoStartPreview({
    autoStart,
    projectId,
    projectFiles,
    status: state.status,
    error: state.error,
    hasAutoStartedRef,
    isStartingRef,
    startPreview,
  });

  // Sync with workbenchStore
  useSyncWithWorkbench({
    projectId,
    project,
    workbenchPreview,
    status: state.status,
    safeSetState,
  });

  // Update displayUrl when project name becomes available
  useUpdateDisplayUrl({
    projectId,
    project,
    status: state.status,
    displayUrl: state.displayUrl,
    safeSetState,
  });
}

/**
 * Reconnect to a cached/persisted preview from Convex.
 */
function useReconnectToCachedPreview({
  autoStart,
  projectId,
  project,
  status,
  safeSetState,
  isMountedRef,
  hasAutoStartedRef,
}: {
  autoStart: boolean;
  projectId: string | null;
  project: ProjectData | null | undefined;
  status: DaytonaPreviewState['status'];
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
  isMountedRef: React.MutableRefObject<boolean>;
  hasAutoStartedRef: React.MutableRefObject<boolean>;
}): void {
  useEffect(() => {
    if (
      autoStart &&
      projectId &&
      status === 'idle' &&
      !hasAutoStartedRef.current &&
      project?.workspaceUrl &&
      project?.daytonaWorkspaceId &&
      project?.workspaceStatus === 'running'
    ) {
      hasAutoStartedRef.current = true;
      console.log('[useDaytonaPreview] Found persisted preview URL, reconnecting...', project.workspaceUrl);

      const proxyUrl = generateProxyUrl(projectId);
      const displayUrl = generateDisplayUrl(project, projectId);

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

      // Health check: verify the proxy URL is actually serving the site
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      fetch(proxyUrl, { method: 'GET', signal: controller.signal })
        .then(async (res) => {
          clearTimeout(timeoutId);

          if (!isMountedRef.current) {
            return;
          }

          if (res.ok) {
            // Check response body — Daytona returns 200 with "Preview Server Starting" when workspace is waking up
            const body = await res.text().catch(() => '');
            const isDaytonaStartupPage =
              body.includes('Preview Server Starting') || body.includes('preview server is still initializing');

            if (isDaytonaStartupPage) {
              console.log(
                '[useDaytonaPreview] Got Daytona startup page (workspace alive but dev server not running), restarting preview',
              );
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

          if (!isMountedRef.current) {
            return;
          }

          console.log('[useDaytonaPreview] Health check failed (network error), restarting preview');
          hasAutoStartedRef.current = false;
          safeSetState((prev) => ({ ...prev, status: 'idle' }));
        });
    }
  }, [autoStart, projectId, project, status, safeSetState, isMountedRef, hasAutoStartedRef]);
}

/**
 * Auto-start preview when files become available.
 */
function useAutoStartPreview({
  autoStart,
  projectId,
  projectFiles,
  status,
  error,
  hasAutoStartedRef,
  isStartingRef,
  startPreview,
}: {
  autoStart: boolean;
  projectId: string | null;
  projectFiles: ProjectFileData[] | null | undefined;
  status: DaytonaPreviewState['status'];
  error: string | null;
  hasAutoStartedRef: React.MutableRefObject<boolean>;
  isStartingRef: React.MutableRefObject<boolean>;
  startPreview: () => Promise<void>;
}): void {
  useEffect(() => {
    if (autoStart && projectId && Array.isArray(projectFiles) && projectFiles.length > 0) {
      if (status === 'idle' && !hasAutoStartedRef.current) {
        hasAutoStartedRef.current = true;
        startPreview();
      } else if (status === 'error' && error === 'No files in project' && !isStartingRef.current) {
        // Files became available after initial error — retry
        console.log('[useDaytonaPreview] Files now available, retrying after previous empty-files error');
        startPreview();
      }
    }
  }, [autoStart, projectId, projectFiles, status, error, hasAutoStartedRef, isStartingRef, startPreview]);
}

/**
 * Sync preview state with workbenchStore.
 */
function useSyncWithWorkbench({
  projectId,
  project,
  workbenchPreview,
  status,
  safeSetState,
}: {
  projectId: string | null;
  project: ProjectData | null | undefined;
  workbenchPreview: WorkbenchPreviewState;
  status: DaytonaPreviewState['status'];
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
}): void {
  useEffect(() => {
    // If workbenchStore has a preview URL and we're still idle, sync the state
    if (workbenchPreview?.url && status === 'idle' && projectId) {
      console.log('[useDaytonaPreview] Syncing preview from workbenchStore:', workbenchPreview.url);

      // Use proxy URL for iframe (avoid X-Frame-Options issues)
      const proxyUrl = workbenchPreview.url.startsWith('/preview/')
        ? workbenchPreview.url
        : generateProxyUrl(projectId);

      const displayUrl = generateDisplayUrl(project, projectId);

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
  }, [workbenchPreview, status, projectId, project, safeSetState]);
}

/**
 * Update displayUrl when project name becomes available.
 */
function useUpdateDisplayUrl({
  projectId,
  project,
  status,
  displayUrl,
  safeSetState,
}: {
  projectId: string | null;
  project: ProjectData | null | undefined;
  status: DaytonaPreviewState['status'];
  displayUrl: string | null;
  safeSetState: (updater: React.SetStateAction<DaytonaPreviewState>) => void;
}): void {
  useEffect(() => {
    if (status === 'ready' && project?.name && projectId) {
      const nameSlug = generateProjectSlug(project, projectId);
      const expectedDisplayUrl = generatePreviewUrl(nameSlug);

      if (displayUrl !== expectedDisplayUrl) {
        console.log('[useDaytonaPreview] Updating displayUrl with project name:', nameSlug);
        safeSetState((prev) => ({ ...prev, displayUrl: expectedDisplayUrl }));
      }
    }
  }, [status, project?.name, projectId, displayUrl, safeSetState]);
}
