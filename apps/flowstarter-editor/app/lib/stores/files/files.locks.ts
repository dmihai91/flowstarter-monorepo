/**
 * Files Store - Lock Operations
 *
 * Methods for managing file and folder locks.
 */

import type { MapStore } from 'nanostores';
import type { FileMap, File, Folder, LockResult, FolderLockResult } from './files.types';
import {
  addLockedFile,
  removeLockedFile,
  addLockedFolder,
  removeLockedFolder,
  getLockedItemsForChat,
  getLockedFilesForChat,
  getLockedFoldersForChat,
  isPathInLockedFolder,
  migrateLegacyLocks,
} from '~/lib/persistence/lockedFiles';
import { getCurrentChatId } from '~/utils/fileLocks';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FilesStore:Locks');

export interface FilesLockContext {
  files: MapStore<FileMap>;
  getFile: (filePath: string) => File | undefined;
  getFileOrFolder: (path: string) => File | Folder | undefined;
}

/**
 * Apply lock status to all contents of a folder
 */
export function applyLockToFolderContents(
  currentFiles: FileMap,
  updates: FileMap,
  folderPath: string,
): void {
  const folderPrefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

  // Find all files that are within this folder
  Object.entries(currentFiles).forEach(([p, file]) => {
    if (p.startsWith(folderPrefix) && file) {
      if (file.type === 'file') {
        updates[p] = {
          ...file,
          isLocked: true,
          lockedByFolder: folderPath,
        };
      } else if (file.type === 'folder') {
        updates[p] = {
          ...file,
          isLocked: true,
          lockedByFolder: folderPath,
        };
      }
    }
  });
}

/**
 * Load locked files from localStorage for the current chat
 */
export function loadLockedFiles(ctx: FilesLockContext, chatId?: string): void {
  try {
    const currentChatId = chatId || getCurrentChatId();
    const startTime = performance.now();

    migrateLegacyLocks(currentChatId);

    const lockedItems = getLockedItemsForChat(currentChatId);

    const lockedFiles = lockedItems.filter((item) => !item.isFolder);
    const lockedFolders = lockedItems.filter((item) => item.isFolder);

    if (lockedItems.length === 0) {
      logger.info(`Flowstarter: No locked files in this workspace`);
      return;
    }

    logger.info(
      `Flowstarter: Workspace has ${lockedFiles.length} locked files + ${lockedFolders.length} locked folders`,
    );

    const currentFiles = ctx.files.get();
    const updates: FileMap = {};

    for (const lockedFile of lockedFiles) {
      const file = currentFiles[lockedFile.path];

      if (file?.type === 'file') {
        updates[lockedFile.path] = {
          ...file,
          isLocked: true,
        };
      }
    }

    for (const lockedFolder of lockedFolders) {
      const folder = currentFiles[lockedFolder.path];

      if (folder?.type === 'folder') {
        updates[lockedFolder.path] = {
          ...folder,
          isLocked: true,
        };

        applyLockToFolderContents(currentFiles, updates, lockedFolder.path);
      }
    }

    if (Object.keys(updates).length > 0) {
      ctx.files.set({ ...currentFiles, ...updates });
    }

    const endTime = performance.now();
    logger.info(`Loaded locked items in ${Math.round(endTime - startTime)}ms`);
  } catch (error) {
    logger.error('Failed to load locked files from localStorage', error);
  }
}

/**
 * Lock a file
 * @returns True if the file was successfully locked
 */
export function lockFile(ctx: FilesLockContext, filePath: string, chatId?: string): boolean {
  const file = ctx.getFile(filePath);
  const currentChatId = chatId || getCurrentChatId();

  if (!file) {
    logger.error(`Cannot lock non-existent file: ${filePath}`);
    return false;
  }

  // Update the file in the store
  ctx.files.setKey(filePath, {
    ...file,
    isLocked: true,
  });

  // Persist to localStorage with chat ID
  addLockedFile(currentChatId, filePath);

  logger.info(`File locked: ${filePath} for chat: ${currentChatId}`);

  return true;
}

/**
 * Lock a folder and all its contents
 * @returns True if the folder was successfully locked
 */
export function lockFolder(ctx: FilesLockContext, folderPath: string, chatId?: string): boolean {
  const folder = ctx.getFileOrFolder(folderPath);
  const currentFiles = ctx.files.get();
  const currentChatId = chatId || getCurrentChatId();

  if (!folder || folder.type !== 'folder') {
    logger.error(`Cannot lock non-existent folder: ${folderPath}`);
    return false;
  }

  const updates: FileMap = {};

  // Update the folder in the store
  updates[folderPath] = {
    type: folder.type,
    isLocked: true,
  };

  // Apply lock to all files within the folder
  applyLockToFolderContents(currentFiles, updates, folderPath);

  // Update the store with all changes
  ctx.files.set({ ...currentFiles, ...updates });

  // Persist to localStorage with chat ID
  addLockedFolder(currentChatId, folderPath);

  logger.info(`Folder locked: ${folderPath} for chat: ${currentChatId}`);

  return true;
}

/**
 * Unlock a file
 * @returns True if the file was successfully unlocked
 */
export function unlockFile(ctx: FilesLockContext, filePath: string, chatId?: string): boolean {
  const file = ctx.getFile(filePath);
  const currentChatId = chatId || getCurrentChatId();

  if (!file) {
    logger.error(`Cannot unlock non-existent file: ${filePath}`);
    return false;
  }

  // Update the file in the store
  ctx.files.setKey(filePath, {
    ...file,
    isLocked: false,
    lockedByFolder: undefined,
  });

  // Remove from localStorage with chat ID
  removeLockedFile(currentChatId, filePath);

  logger.info(`File unlocked: ${filePath} for chat: ${currentChatId}`);

  return true;
}

/**
 * Unlock a folder and all its contents
 * @returns True if the folder was successfully unlocked
 */
export function unlockFolder(ctx: FilesLockContext, folderPath: string, chatId?: string): boolean {
  const folder = ctx.getFileOrFolder(folderPath);
  const currentFiles = ctx.files.get();
  const currentChatId = chatId || getCurrentChatId();

  if (!folder || folder.type !== 'folder') {
    logger.error(`Cannot unlock non-existent folder: ${folderPath}`);
    return false;
  }

  const updates: FileMap = {};

  // Update the folder in the store
  updates[folderPath] = {
    type: folder.type,
    isLocked: false,
  };

  // Find all files that are within this folder and unlock them
  const folderPrefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

  Object.entries(currentFiles).forEach(([p, file]) => {
    if (p.startsWith(folderPrefix) && file) {
      if (file.type === 'file' && file.lockedByFolder === folderPath) {
        updates[p] = {
          ...file,
          isLocked: false,
          lockedByFolder: undefined,
        };
      } else if (file.type === 'folder' && file.lockedByFolder === folderPath) {
        updates[p] = {
          type: file.type,
          isLocked: false,
          lockedByFolder: undefined,
        };
      }
    }
  });

  // Update the store with all changes
  ctx.files.set({ ...currentFiles, ...updates });

  // Remove from localStorage with chat ID
  removeLockedFolder(currentChatId, folderPath);

  logger.info(`Folder unlocked: ${folderPath} for chat: ${currentChatId}`);

  return true;
}

/**
 * Check if a file is within a locked folder
 */
export function isFileInLockedFolder(filePath: string, chatId?: string): LockResult {
  const currentChatId = chatId || getCurrentChatId();

  // Use the optimized function from lockedFiles.ts
  return isPathInLockedFolder(currentChatId, filePath);
}

/**
 * Check if a file is locked
 * @returns Object with locked status and what caused the lock
 */
export function isFileLocked(ctx: FilesLockContext, filePath: string, chatId?: string): LockResult {
  const file = ctx.getFile(filePath);
  const currentChatId = chatId || getCurrentChatId();

  if (!file) {
    return { locked: false };
  }

  // First check the in-memory state
  if (file.isLocked) {
    // If the file is locked by a folder, include that information
    if (file.lockedByFolder) {
      return {
        locked: true,
        lockedBy: file.lockedByFolder as string,
      };
    }

    return {
      locked: true,
      lockedBy: filePath,
    };
  }

  // Then check localStorage for direct file locks
  const lockedFiles = getLockedFilesForChat(currentChatId);
  const lockedFile = lockedFiles.find((item) => item.path === filePath);

  if (lockedFile) {
    // Update the in-memory state to match localStorage
    ctx.files.setKey(filePath, {
      ...file,
      isLocked: true,
    });

    return { locked: true, lockedBy: filePath };
  }

  // Finally, check if the file is in a locked folder
  const folderLockResult = isFileInLockedFolder(filePath, currentChatId);

  if (folderLockResult.locked) {
    // Update the in-memory state to reflect the folder lock
    ctx.files.setKey(filePath, {
      ...file,
      isLocked: true,
      lockedByFolder: folderLockResult.lockedBy,
    });

    return folderLockResult;
  }

  return { locked: false };
}

/**
 * Check if a folder is locked
 */
export function isFolderLocked(
  ctx: FilesLockContext,
  folderPath: string,
  chatId?: string,
): FolderLockResult {
  const folder = ctx.getFileOrFolder(folderPath);
  const currentChatId = chatId || getCurrentChatId();

  if (!folder || folder.type !== 'folder') {
    return { isLocked: false };
  }

  // First check the in-memory state
  if (folder.isLocked) {
    return {
      isLocked: true,
      lockedBy: folderPath,
    };
  }

  // Then check localStorage for this specific chat
  const lockedFolders = getLockedFoldersForChat(currentChatId);
  const lockedFolder = lockedFolders.find((item) => item.path === folderPath);

  if (lockedFolder) {
    // Update the in-memory state to match localStorage
    ctx.files.setKey(folderPath, {
      type: folder.type,
      isLocked: true,
    });

    return { isLocked: true, lockedBy: folderPath };
  }

  return { isLocked: false };
}
