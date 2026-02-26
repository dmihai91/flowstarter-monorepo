/**
 * Files Store - Modifications Tracking
 *
 * Methods for tracking file modifications.
 */

import type { MapStore } from 'nanostores';
import type { FileMap, File } from './files.types';
import { computeFileModifications } from '~/utils/diff';

export interface FilesModificationsContext {
  files: MapStore<FileMap>;
  modifiedFiles: Map<string, string>;
}

/**
 * Get computed file modifications comparing current state to original
 */
export function getFileModifications(ctx: FilesModificationsContext) {
  return computeFileModifications(ctx.files.get(), ctx.modifiedFiles);
}

/**
 * Get map of files that have been modified from their original content
 */
export function getModifiedFiles(ctx: FilesModificationsContext): { [path: string]: File } | undefined {
  let modifiedFiles: { [path: string]: File } | undefined = undefined;

  for (const [filePath, originalContent] of ctx.modifiedFiles) {
    const file = ctx.files.get()[filePath];

    if (file?.type !== 'file') {
      continue;
    }

    if (file.content === originalContent) {
      continue;
    }

    if (!modifiedFiles) {
      modifiedFiles = {};
    }

    modifiedFiles[filePath] = file;
  }

  return modifiedFiles;
}

/**
 * Reset all file modification tracking
 */
export function resetFileModifications(ctx: FilesModificationsContext): void {
  ctx.modifiedFiles.clear();
}
