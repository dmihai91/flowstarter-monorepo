/**
 * Files Store
 *
 * Manages the file system state for the workbench.
 * In Daytona mode, files are stored in local state and synced to Daytona via API.
 */

import { getEncoding } from 'istextorbinary';
import { map, type MapStore } from 'nanostores';
import { Buffer } from 'node:buffer';
import { path } from '~/utils/path';
import { computeFileModifications } from '~/utils/diff';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
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

const logger = createScopedLogger('FilesStore');

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string; // Path of the folder that locked this file
}

export interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string; // Path of the folder that locked this folder (for nested folders)
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export class FilesStore {
  #size = 0;

  #modifiedFiles: Map<string, string> = import.meta.hot?.data.modifiedFiles ?? new Map();

  #deletedPaths: Set<string> = import.meta.hot?.data.deletedPaths ?? new Set();

  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  get filesCount() {
    return this.#size;
  }

  // Track if locked files have been loaded (deferred for startup performance)
  #lockedFilesLoaded = false;

  constructor() {
    logger.info('FilesStore initialized (Daytona mode)');

    // Defer deleted paths loading to avoid blocking startup
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback for non-critical initialization
      const scheduleInit = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
        } else {
          setTimeout(callback, 50);
        }
      };

      scheduleInit(() => {
        this.#loadDeletedPaths();
        this.#loadLockedFiles();
      });

      // Setup navigation listeners
      let lastChatId = getCurrentChatId();

      const handleNavigation = () => {
        const currentChatId = getCurrentChatId();

        if (currentChatId !== lastChatId) {
          logger.info(`Chat ID changed from ${lastChatId} to ${currentChatId}, reloading locks`);
          lastChatId = currentChatId;
          this.#loadLockedFiles(currentChatId);
        }
      };

      window.addEventListener('popstate', handleNavigation);
      window.addEventListener('hashchange', handleNavigation);
    }

    if (import.meta.hot) {
      import.meta.hot.data.files = this.files;
      import.meta.hot.data.modifiedFiles = this.#modifiedFiles;
      import.meta.hot.data.deletedPaths = this.#deletedPaths;
    }
  }

  // Separated deleted paths loading for deferred initialization
  #loadDeletedPaths() {
    try {
      if (typeof localStorage !== 'undefined') {
        const deletedPathsJson = localStorage.getItem('Flowstarter-deleted-paths');

        if (deletedPathsJson) {
          const deletedPaths = JSON.parse(deletedPathsJson);

          if (Array.isArray(deletedPaths)) {
            deletedPaths.forEach((p) => this.#deletedPaths.add(p));
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load deleted paths from localStorage', error);
    }
  }

  #loadLockedFiles(chatId?: string) {
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

      const currentFiles = this.files.get();
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

          this.#applyLockToFolderContents(currentFiles, updates, lockedFolder.path);
        }
      }

      if (Object.keys(updates).length > 0) {
        this.files.set({ ...currentFiles, ...updates });
      }

      const endTime = performance.now();
      logger.info(`Loaded locked items in ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      logger.error('Failed to load locked files from localStorage', error);
    }
  }

  #applyLockToFolderContents(currentFiles: FileMap, updates: FileMap, folderPath: string) {
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
   * Lock a file
   * @param filePath Path to the file to lock
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns True if the file was successfully locked
   */
  lockFile(filePath: string, chatId?: string) {
    const file = this.getFile(filePath);
    const currentChatId = chatId || getCurrentChatId();

    if (!file) {
      logger.error(`Cannot lock non-existent file: ${filePath}`);
      return false;
    }

    // Update the file in the store
    this.files.setKey(filePath, {
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
   * @param folderPath Path to the folder to lock
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns True if the folder was successfully locked
   */
  lockFolder(folderPath: string, chatId?: string) {
    const folder = this.getFileOrFolder(folderPath);
    const currentFiles = this.files.get();
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
    this.#applyLockToFolderContents(currentFiles, updates, folderPath);

    // Update the store with all changes
    this.files.set({ ...currentFiles, ...updates });

    // Persist to localStorage with chat ID
    addLockedFolder(currentChatId, folderPath);

    logger.info(`Folder locked: ${folderPath} for chat: ${currentChatId}`);

    return true;
  }

  /**
   * Unlock a file
   * @param filePath Path to the file to unlock
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns True if the file was successfully unlocked
   */
  unlockFile(filePath: string, chatId?: string) {
    const file = this.getFile(filePath);
    const currentChatId = chatId || getCurrentChatId();

    if (!file) {
      logger.error(`Cannot unlock non-existent file: ${filePath}`);
      return false;
    }

    // Update the file in the store
    this.files.setKey(filePath, {
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
   * @param folderPath Path to the folder to unlock
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns True if the folder was successfully unlocked
   */
  unlockFolder(folderPath: string, chatId?: string) {
    const folder = this.getFileOrFolder(folderPath);
    const currentFiles = this.files.get();
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
    this.files.set({ ...currentFiles, ...updates });

    // Remove from localStorage with chat ID
    removeLockedFolder(currentChatId, folderPath);

    logger.info(`Folder unlocked: ${folderPath} for chat: ${currentChatId}`);

    return true;
  }

  /**
   * Check if a file is locked
   * @param filePath Path to the file to check
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns Object with locked status, lock mode, and what caused the lock
   */
  isFileLocked(filePath: string, chatId?: string): { locked: boolean; lockedBy?: string } {
    const file = this.getFile(filePath);
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
      this.files.setKey(filePath, {
        ...file,
        isLocked: true,
      });

      return { locked: true, lockedBy: filePath };
    }

    // Finally, check if the file is in a locked folder
    const folderLockResult = this.isFileInLockedFolder(filePath, currentChatId);

    if (folderLockResult.locked) {
      // Update the in-memory state to reflect the folder lock
      this.files.setKey(filePath, {
        ...file,
        isLocked: true,
        lockedByFolder: folderLockResult.lockedBy,
      });

      return folderLockResult;
    }

    return { locked: false };
  }

  /**
   * Check if a file is within a locked folder
   * @param filePath Path to the file to check
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns Object with locked status, lock mode, and the folder that caused the lock
   */
  isFileInLockedFolder(filePath: string, chatId?: string): { locked: boolean; lockedBy?: string } {
    const currentChatId = chatId || getCurrentChatId();

    // Use the optimized function from lockedFiles.ts
    return isPathInLockedFolder(currentChatId, filePath);
  }

  /**
   * Check if a folder is locked
   * @param folderPath Path to the folder to check
   * @param chatId Optional chat ID (defaults to current chat)
   * @returns Object with locked status and lock mode
   */
  isFolderLocked(folderPath: string, chatId?: string): { isLocked: boolean; lockedBy?: string } {
    const folder = this.getFileOrFolder(folderPath);
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
      this.files.setKey(folderPath, {
        type: folder.type,
        isLocked: true,
      });

      return { isLocked: true, lockedBy: folderPath };
    }

    return { isLocked: false };
  }

  getFile(filePath: string) {
    const dirent = this.files.get()[filePath];

    if (!dirent) {
      return undefined;
    }

    // For backward compatibility, only return file type dirents
    if (dirent.type !== 'file') {
      return undefined;
    }

    return dirent;
  }

  /**
   * Get any file or folder from the file system
   * @param p Path to the file or folder
   * @returns The file or folder, or undefined if it doesn't exist
   */
  getFileOrFolder(p: string) {
    return this.files.get()[p];
  }

  getFileModifications() {
    return computeFileModifications(this.files.get(), this.#modifiedFiles);
  }

  getModifiedFiles() {
    let modifiedFiles: { [path: string]: File } | undefined = undefined;

    for (const [filePath, originalContent] of this.#modifiedFiles) {
      const file = this.files.get()[filePath];

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

  resetFileModifications() {
    this.#modifiedFiles.clear();
  }

  async saveFile(filePath: string, content: string) {
    try {
      // Normalize the file path
      const normalizedPath = path.toForwardSlashes(filePath);

      const oldContent = this.getFile(filePath)?.content;

      if (!oldContent && oldContent !== '') {
        unreachable('Expected content to be defined');
      }

      // Get the current lock state before updating
      const currentFile = this.files.get()[filePath];
      const isLocked = currentFile?.type === 'file' ? currentFile.isLocked : false;

      // In Daytona mode, only update local state (files sync to Daytona via API)
      if (!this.#modifiedFiles.has(filePath)) {
        this.#modifiedFiles.set(filePath, oldContent);
      }

      this.files.setKey(filePath, {
        type: 'file',
        content,
        isBinary: false,
        isLocked,
      });

      logger.info('File updated (Daytona mode - local state only)');
    } catch (error) {
      logger.error('Failed to update file content\n\n', error);
      throw error;
    }
  }

  async createFile(filePath: string, content: string | Uint8Array = '') {
    try {
      // Normalize the file path - convert backslashes to forward slashes
      const normalizedPath = path.toForwardSlashes(filePath);

      // Use normalized path with leading slash for storage key
      const storageKey = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
      const isBinary = content instanceof Uint8Array;

      // In Daytona mode, only update local state (files sync to Daytona via API)
      if (isBinary) {
        const base64Content = Buffer.from(content).toString('base64');
        this.files.setKey(storageKey, {
          type: 'file',
          content: base64Content,
          isBinary: true,
          isLocked: false,
        });
        this.#modifiedFiles.set(storageKey, base64Content);
      } else {
        this.files.setKey(storageKey, {
          type: 'file',
          content: content as string,
          isBinary: false,
          isLocked: false,
        });
        this.#modifiedFiles.set(storageKey, content as string);
      }

      this.#size++;
      logger.info(`File created (Daytona mode - local state only): ${storageKey}`);

      return true;
    } catch (error) {
      logger.error('Failed to create file\n\n', error);
      throw error;
    }
  }

  async createFolder(folderPath: string) {
    try {
      // Normalize the folder path - convert backslashes to forward slashes
      const normalizedPath = path.toForwardSlashes(folderPath);

      // Use normalized path with leading slash for storage key
      const storageKey = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

      // In Daytona mode, only update local state
      this.files.setKey(storageKey, { type: 'folder' });
      logger.info(`Folder created (Daytona mode - local state only): ${storageKey}`);

      return true;
    } catch (error) {
      logger.error('Failed to create folder\n\n', error);
      throw error;
    }
  }

  async deleteFile(filePath: string) {
    try {
      // In Daytona mode, only update local state
      this.#deletedPaths.add(filePath);
      this.files.setKey(filePath, undefined);
      this.#size--;

      if (this.#modifiedFiles.has(filePath)) {
        this.#modifiedFiles.delete(filePath);
      }

      this.#persistDeletedPaths();
      logger.info(`File deleted (Daytona mode - local state only): ${filePath}`);

      return true;
    } catch (error) {
      logger.error('Failed to delete file\n\n', error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string) {
    try {
      // Helper to clean up folder and its contents from local state
      this.#deletedPaths.add(folderPath);
      this.files.setKey(folderPath, undefined);

      const allFiles = this.files.get();

      for (const [fp, dirent] of Object.entries(allFiles)) {
        if (fp.startsWith(folderPath + '/')) {
          this.files.setKey(fp, undefined);
          this.#deletedPaths.add(fp);

          if (dirent?.type === 'file') {
            this.#size--;
          }

          if (dirent?.type === 'file' && this.#modifiedFiles.has(fp)) {
            this.#modifiedFiles.delete(fp);
          }
        }
      }

      this.#persistDeletedPaths();
      logger.info(`Folder deleted (Daytona mode - local state only): ${folderPath}`);

      return true;
    } catch (error) {
      logger.error('Failed to delete folder\n\n', error);
      throw error;
    }
  }

  // method to persist deleted paths to localStorage
  #persistDeletedPaths() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('Flowstarter-deleted-paths', JSON.stringify([...this.#deletedPaths]));
      }
    } catch (error) {
      logger.error('Failed to persist deleted paths to localStorage', error);
    }
  }
}

function isBinaryFile(buffer: Uint8Array | undefined) {
  if (buffer === undefined) {
    return false;
  }

  return getEncoding(convertToBuffer(buffer), { chunkLength: 100 }) === 'binary';
}

/**
 * Converts a `Uint8Array` into a Node.js `Buffer` by copying the prototype.
 * The goal is to  avoid expensive copies. It does create a new typed array
 * but that's generally cheap as long as it uses the same underlying
 * array buffer.
 */
function convertToBuffer(view: Uint8Array): Buffer {
  return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
}

