/**
 * Hook for managing Daytona-based preview rendering.
 *
 * This hook:
 * 1. Fetches project files from Convex
 * 2. Sends them to the Daytona preview API
 * 3. Gets back the preview URL for iframe rendering
 */

import { useCallback } from 'react';
import { useQuery } from 'convex/react';
// eslint-disable-next-line no-restricted-imports
import { api } from '../../../../convex/_generated/api';
// eslint-disable-next-line no-restricted-imports
import type { Id } from '../../../../convex/_generated/dataModel';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

import type { UseDaytonaPreviewOptions, UseDaytonaPreviewResult, ProjectFileData } from './types';
import { convertFilesToRecord } from './utils';
import { useDaytonaState } from './useDaytonaState';
import { useDaytonaApi } from './useDaytonaApi';
import { useDaytonaEffects } from './useDaytonaEffects';

// Re-export types and utilities
export type { BuildError, DaytonaPreviewState, UseDaytonaPreviewOptions, UseDaytonaPreviewResult } from './types';
export { fixBuildErrorWithLLM, createAutoFixHandler } from './utils';

/**
 * Main hook for Daytona preview management.
 */
export function useDaytonaPreview({
  projectId,
  autoStart = false,
  onBuildError,
  maxAutoFixAttempts = 3,
}: UseDaytonaPreviewOptions): UseDaytonaPreviewResult {
  // Query project files from Convex
  const projectFiles = useQuery(
    api.files.getProjectFiles,
    projectId ? { projectId } : 'skip',
  ) as ProjectFileData[] | undefined;

  // Query project details to get the slug (urlId)
  const project = useQuery(api.projects.getById, projectId ? { projectId } : 'skip');

  // Core state management
  const {
    state,
    safeSetState,
    isMountedRef,
    isStartingRef,
    hasAutoStartedRef,
    autoFixAttemptsRef,
    autoFixAttempts,
    setAutoFixAttempts,
    resetState,
    resetAutoFix,
  } = useDaytonaState(projectId);

  // Convert Convex files to Record<string, string> format
  const getFilesRecord = useCallback((): Record<string, string> => {
    console.log(
      '[useDaytonaPreview] getFilesRecord called, projectId:',
      projectId,
      'projectFiles:',
      projectFiles?.length ?? 'null/undefined',
    );
    return convertFilesToRecord(projectFiles);
  }, [projectFiles, projectId]);

  // API operations
  const { startPreview, stopPreview, refreshPreview, fixAndRetry } = useDaytonaApi({
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
  });

  // Retry preview (reset state and start fresh)
  const retryPreview = useCallback(async () => {
    console.log('[useDaytonaPreview] Retrying preview...');

    // Reset state to idle first
    resetState();

    // Reset auto-fix attempts
    resetAutoFix();

    // Clear the starting ref to allow restart
    isStartingRef.current = false;

    // Small delay to ensure state is reset
    await new Promise((r) => setTimeout(r, 100));

    if (!isMountedRef.current) return;

    // Start fresh
    await startPreview();
  }, [startPreview, resetState, resetAutoFix, isStartingRef, isMountedRef]);

  // Wrapped refreshPreview that passes current status
  const wrappedRefreshPreview = useCallback(async () => {
    await refreshPreview(state.status);
  }, [refreshPreview, state.status]);

  // Sync with workbenchStore.daytonaPreview - this catches previews started by build handlers
  const workbenchPreview = useStore(workbenchStore.daytonaPreview);

  // Side effects (auto-start, workbench sync, etc.)
  useDaytonaEffects({
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
  });

  return {
    state,
    startPreview,
    stopPreview,
    refreshPreview: wrappedRefreshPreview,
    retryPreview,
    fixAndRetry,
    isReady: state.status === 'ready',
    autoFixAttempts,
  };
}
