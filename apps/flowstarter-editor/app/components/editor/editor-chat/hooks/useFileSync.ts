/**
 * useFileSync Hook
 *
 * Manages file synchronization between Convex and Daytona workspaces.
 * Since we're using Daytona for preview (not WebContainer), all file syncs go through Daytona.
 * 
 * Uses React Query mutations for API calls with automatic retries.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { useSyncToWorkbench, useSyncToDaytona } from '~/lib/hooks/useApiQueries';
import type { UseFileSyncOptions, UseFileSyncReturn } from '../types/sharedState';

export function useFileSync(options: UseFileSyncOptions = {}): UseFileSyncReturn {
  const { onSyncComplete } = options;

  // ─── State ────────────────────────────────────────────────────────────────
  const [lastSyncedOrchestrationId, setLastSyncedOrchestrationId] = useState<string | null>(null);

  // ─── React Query Mutations ────────────────────────────────────────────────
  const syncToWorkbenchMutation = useSyncToWorkbench();
  const syncToDaytonaMutation = useSyncToDaytona();

  // Combined loading state
  const isSyncing = syncToWorkbenchMutation.isPending || syncToDaytonaMutation.isPending;

  // ─── Request Cancellation (for Daytona sync) ──────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /*
   * ─── Sync to Workbench (from Convex via orchestrator API) ─────────────────
   * This syncs files from Convex to the workbench editor for display
   */
  const syncToWorkbench = useCallback(
    async (orchestrationId: string) => {
      if (isSyncing) {
        console.log('[useFileSync] Already syncing, skipping');
        return;
      }

      try {
        const result = await syncToWorkbenchMutation.mutateAsync({ orchestrationId });
        
        // Write each file to the workbench
        for (const [filePath, content] of Object.entries(result.files)) {
          await workbenchStore.createFile(filePath, content);
        }

        // Show the workbench after files are synced
        workbenchStore.setShowWorkbench(true);
        
        setLastSyncedOrchestrationId(orchestrationId);
        onSyncComplete?.(result.fileCount);
        
        console.log(`[useFileSync] Synced ${result.fileCount} files to workbench`);
      } catch (error) {
        console.error('[useFileSync] Failed to sync to workbench:', error);
      }
    },
    [isSyncing, onSyncComplete, syncToWorkbenchMutation],
  );

  /*
   * ─── Sync to Daytona Workspace ────────────────────────────────────────────
   * This syncs files to the Daytona workspace for preview
   */
  const syncToDaytona = useCallback(
    async (workspaceId: string, files: Record<string, string>) => {
      if (isSyncing) {
        console.log('[useFileSync] Already syncing, skipping');
        return;
      }

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const result = await syncToDaytonaMutation.mutateAsync({
          workspaceId,
          files,
          signal: abortControllerRef.current.signal,
        });

        // Also update workbench store for editor display
        for (const [filePath, content] of Object.entries(files)) {
          await workbenchStore.createFile(filePath, content);
        }

        workbenchStore.setShowWorkbench(true);
        onSyncComplete?.(result.fileCount);
        console.log(`[useFileSync] Synced ${result.fileCount} files to Daytona workspace`);
      } catch (error) {
        // Don't log aborted requests as errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('[useFileSync] Failed to sync to Daytona:', error);
      }
    },
    [isSyncing, onSyncComplete, syncToDaytonaMutation],
  );

  return {
    // State
    isSyncing,
    lastSyncedOrchestrationId,

    // Actions
    syncToWorkbench,
    syncToDaytona,
  };
}

export type { UseFileSyncOptions, UseFileSyncReturn };

