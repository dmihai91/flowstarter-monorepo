/**
 * Batch Utilities
 *
 * Helpers for batching file uploads to stay under Convex limits.
 */

import type { ScaffoldFile } from './types';

// Batch size for file uploads (in bytes) - stay well under Convex's ~1MB limit
export const BATCH_SIZE_BYTES = 500 * 1024; // 500KB per batch
export const MAX_FILES_PER_BATCH = 50; // Also limit number of files per batch

/**
 * Split files into batches that stay under the size limit
 */
export function createFileBatches(files: ScaffoldFile[]): ScaffoldFile[][] {
  const batches: ScaffoldFile[][] = [];
  let currentBatch: ScaffoldFile[] = [];
  let currentBatchSize = 0;

  for (const file of files) {
    const fileSize = file.content.length;

    // Start a new batch if adding this file would exceed limits
    if (
      currentBatch.length > 0 &&
      (currentBatchSize + fileSize > BATCH_SIZE_BYTES || currentBatch.length >= MAX_FILES_PER_BATCH)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push(file);
    currentBatchSize += fileSize;
  }

  // Don't forget the last batch
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

