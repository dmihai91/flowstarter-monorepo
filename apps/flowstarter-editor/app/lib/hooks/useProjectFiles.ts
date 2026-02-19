/**
 * useProjectFiles Hook
 *
 * Subscribes to project files in Convex and syncs them to the workbench.
 * This enables real-time file updates when MCP server or agents write to Convex.
 *
 * Flow:
 * 1. Subscribe to Convex files for project
 * 2. On file changes, sync to workbench store
 * 3. Show files in workbench editor
 */

import { useQuery } from 'convex/react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import { workbenchStore } from '~/lib/stores/workbench';

interface FileEntry {
  _id: string;
  path: string;
  content: string;
  type: string;
  isBinary: boolean;
  updatedAt: number;
}

interface UseProjectFilesOptions {
  projectId: Id<'projects'> | null;
  autoSync?: boolean;
  onFilesLoaded?: (fileCount: number) => void;
  onSyncComplete?: () => void;
  onError?: (error: Error) => void;
}

interface UseProjectFilesResult {
  files: FileEntry[];
  isLoading: boolean;
  fileCount: number;
  lastSyncedAt: number | null;
  syncToWorkbench: () => Promise<void>;
  isSyncing: boolean;
}

export function useProjectFiles({
  projectId,
  autoSync = true,
  onFilesLoaded,
  onSyncComplete,
  onError,
}: UseProjectFilesOptions): UseProjectFilesResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const previousFilesRef = useRef<Map<string, number>>(new Map());
  const initialSyncDoneRef = useRef(false);

  // Subscribe to project files in Convex
  const files = useQuery(api.files.getProjectFiles, projectId ? { projectId } : 'skip') as FileEntry[] | undefined;

  const isLoading = files === undefined && projectId !== null;
  const fileCount = files?.length ?? 0;

  // Sync files to workbench store
  const syncToWorkbench = useCallback(async () => {
    if (!files || files.length === 0) {
      console.log('[useProjectFiles] No files to sync');
      return;
    }

    setIsSyncing(true);
    console.log(`[useProjectFiles] Syncing ${files.length} files to workbench...`);

    const startTime = Date.now();

    try {
      // Show workbench
      workbenchStore.setShowWorkbench(true);

      // Sync each file
      for (const file of files) {
        const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
        await workbenchStore.createFile(path, file.content);
      }

      setLastSyncedAt(Date.now());
      console.log(`[useProjectFiles] Synced ${files.length} files in ${Date.now() - startTime}ms`);

      onSyncComplete?.();
    } catch (error) {
      console.error('[useProjectFiles] Sync failed:', error);
      onError?.(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [files, onSyncComplete, onError]);

  // Auto-sync when files change
  useEffect(() => {
    if (!files || !autoSync) {
      return;
    }

    // Build current file map (path -> updatedAt)
    const currentFileMap = new Map<string, number>();

    for (const file of files) {
      currentFileMap.set(file.path, file.updatedAt);
    }

    // Check for changes
    const hasChanges = files.some((file) => {
      const previousUpdatedAt = previousFilesRef.current.get(file.path);
      return previousUpdatedAt === undefined || previousUpdatedAt < file.updatedAt;
    });

    // Also check for new files or removed files
    const hasNewOrRemovedFiles =
      currentFileMap.size !== previousFilesRef.current.size ||
      Array.from(currentFileMap.keys()).some((path) => !previousFilesRef.current.has(path));

    // Initial sync or changes detected
    if (!initialSyncDoneRef.current || hasChanges || hasNewOrRemovedFiles) {
      console.log('[useProjectFiles] Files changed, syncing...', {
        initialSync: !initialSyncDoneRef.current,
        hasChanges,
        hasNewOrRemovedFiles,
        fileCount: files.length,
      });

      syncToWorkbench();
      initialSyncDoneRef.current = true;

      // Notify files loaded on initial sync
      if (!previousFilesRef.current.size && files.length > 0) {
        onFilesLoaded?.(files.length);
      }
    }

    // Update previous state
    previousFilesRef.current = currentFileMap;
  }, [files, autoSync, syncToWorkbench, onFilesLoaded]);

  // Reset on project change
  useEffect(() => {
    if (projectId) {
      initialSyncDoneRef.current = false;
      previousFilesRef.current = new Map();
      setLastSyncedAt(null);
    }
  }, [projectId]);

  return {
    files: files ?? [],
    isLoading,
    fileCount,
    lastSyncedAt,
    syncToWorkbench,
    isSyncing,
  };
}

/**
 * Hook to get project ID from URL ID
 */
export function useProjectByUrlId(urlId: string | null) {
  const project = useQuery(api.projects.getByUrlId, urlId ? { urlId } : 'skip');

  return {
    project,
    projectId: project?._id ?? null,
    isLoading: project === undefined && urlId !== null,
  };
}

