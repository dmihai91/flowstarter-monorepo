/**
 * useSnapshotBlob Hook
 *
 * Creates and restores gzip-compressed snapshots using Convex blob storage.
 * This is the primary interface for snapshot operations.
 */

import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import {
  compressFileMapToBlob,
  downloadAndDecompress,
  uploadCompressedBlob,
  isCompressionSupported,
  type FileMap,
} from '~/lib/utils/snapshot-compression';

interface UseSnapshotBlobResult {
  createSnapshot: (projectId: Id<'projects'>, label?: string) => Promise<Id<'snapshots'>>;
  createSnapshotFromFiles: (
    projectId: Id<'projects'>,
    files: Record<string, string>,
    label?: string,
  ) => Promise<Id<'snapshots'>>;
  restoreSnapshot: (snapshotId: Id<'snapshots'>) => Promise<FileMap>;
  isCreating: boolean;
  isRestoring: boolean;
  error: string | null;
  compressionSupported: boolean;
}

export function useSnapshotBlob(): UseSnapshotBlobResult {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const generateUploadUrl = useMutation(api.snapshots.generateUploadUrl);
  const createSnapshotMutation = useMutation(api.snapshots.create);

  /**
   * Create a gzip-compressed snapshot from current project files
   */
  const createSnapshot = useCallback(
    async (projectId: Id<'projects'>, label?: string): Promise<Id<'snapshots'>> => {
      setIsCreating(true);
      setError(null);

      try {
        console.log(`[useSnapshotBlob] Creating snapshot for project: ${projectId}`);

        // Fetch current files from Convex
        const response = await fetch('/api/orchestrator?action=files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useSnapshotBlob] Failed to fetch files:', response.status, errorText);
          throw new Error(`Failed to fetch project files: ${response.status}`);
        }

        const data = (await response.json()) as { files: FileMap; error?: string };

        if (data.error) {
          console.error('[useSnapshotBlob] Files fetch error:', data.error);
        }

        const fileMap = data.files;
        console.log(`[useSnapshotBlob] Fetched files:`, Object.keys(fileMap || {}).length, 'files');

        if (!fileMap || Object.keys(fileMap).length === 0) {
          console.error('[useSnapshotBlob] No files found for project:', projectId);
          throw new Error('No files to snapshot');
        }

        // Compress to gzip blob
        const { blob, compressedSize, uncompressedSize, fileCount } = await compressFileMapToBlob(fileMap);

        console.log(
          `[useSnapshotBlob] Compressed ${fileCount} files: ${uncompressedSize} → ${compressedSize} bytes (${Math.round((compressedSize / uncompressedSize) * 100)}%)`,
        );

        // Get upload URL from Convex
        console.log('[useSnapshotBlob] Getting upload URL...');

        const uploadUrl = await generateUploadUrl();
        console.log('[useSnapshotBlob] Got upload URL');

        // Upload blob
        console.log('[useSnapshotBlob] Uploading blob...');

        const { storageId } = await uploadCompressedBlob(uploadUrl, blob);
        console.log('[useSnapshotBlob] Blob uploaded, storageId:', storageId);

        // Create snapshot record
        const snapshotId = await createSnapshotMutation({
          projectId,
          name: label || 'Snapshot',
          storageId: storageId as Id<'_storage'>,
          compressedSize,
          uncompressedSize,
          fileCount,
          label,
        });

        console.log(`[useSnapshotBlob] Created snapshot: ${snapshotId}`);

        return snapshotId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create snapshot';
        console.error('[useSnapshotBlob] Snapshot creation failed:', err);
        setError(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [generateUploadUrl, createSnapshotMutation],
  );

  /**
   * Create a gzip-compressed snapshot directly from files in memory
   * This bypasses the API fetch and uses the provided files directly
   */
  const createSnapshotFromFiles = useCallback(
    async (projectId: Id<'projects'>, files: Record<string, string>, label?: string): Promise<Id<'snapshots'>> => {
      setIsCreating(true);
      setError(null);

      try {
        console.log(`[useSnapshotBlob] Creating snapshot from ${Object.keys(files).length} files in memory`);

        if (!files || Object.keys(files).length === 0) {
          throw new Error('No files provided for snapshot');
        }

        // Convert simple string map to FileMap format
        const fileMap: FileMap = {};

        for (const [path, content] of Object.entries(files)) {
          // Normalize path to forward slashes
          const normalizedPath = path.replace(/\\/g, '/');
          fileMap[normalizedPath] = {
            type: 'file',
            content,
            isBinary: false,
          };
        }

        // Compress to gzip blob
        const { blob, compressedSize, uncompressedSize, fileCount } = await compressFileMapToBlob(fileMap);

        console.log(
          `[useSnapshotBlob] Compressed ${fileCount} files: ${uncompressedSize} → ${compressedSize} bytes (${Math.round((compressedSize / uncompressedSize) * 100)}%)`,
        );

        // Get upload URL from Convex
        console.log('[useSnapshotBlob] Getting upload URL...');

        const uploadUrl = await generateUploadUrl();
        console.log('[useSnapshotBlob] Got upload URL:', uploadUrl ? 'success' : 'failed');

        if (!uploadUrl) {
          throw new Error('Failed to get upload URL from Convex');
        }

        // Upload blob
        console.log('[useSnapshotBlob] Uploading blob...');

        const { storageId } = await uploadCompressedBlob(uploadUrl, blob);
        console.log('[useSnapshotBlob] Blob uploaded, storageId:', storageId);

        // Create snapshot record
        const snapshotId = await createSnapshotMutation({
          projectId,
          name: label || 'Snapshot',
          storageId: storageId as Id<'_storage'>,
          compressedSize,
          uncompressedSize,
          fileCount,
          label,
        });

        console.log(`[useSnapshotBlob] Created snapshot: ${snapshotId}`);

        return snapshotId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create snapshot';
        console.error('[useSnapshotBlob] Snapshot creation from files failed:', err);
        setError(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [generateUploadUrl, createSnapshotMutation],
  );

  /**
   * Restore files from a gzip-compressed snapshot
   * Returns the FileMap for client-side processing
   */
  const restoreSnapshot = useCallback(async (snapshotId: Id<'snapshots'>): Promise<FileMap> => {
    setIsRestoring(true);
    setError(null);

    try {
      // Get download URL for the snapshot blob
      const response = await fetch(`/api/snapshot-download?id=${snapshotId}`);

      if (!response.ok) {
        throw new Error('Failed to get snapshot download URL');
      }

      const { url } = (await response.json()) as { url: string };

      if (!url) {
        throw new Error('Snapshot has no blob storage');
      }

      // Download and decompress
      const fileMap = await downloadAndDecompress(url);

      console.log(`[useSnapshotBlob] Restored ${Object.keys(fileMap).length} files`);

      return fileMap;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore snapshot';
      setError(message);
      throw err;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  return {
    createSnapshot,
    createSnapshotFromFiles,
    restoreSnapshot,
    isCreating,
    isRestoring,
    error,
    compressionSupported: isCompressionSupported(),
  };
}

