/**
 * Files Store
 *
 * Manages the file system state for the workbench.
 * In Daytona mode, files are stored in local state and synced to Daytona via API.
 */

import { map, type MapStore } from 'nanostores';
import { Buffer } from 'node:buffer';
import { path } from '~/utils/path';
import { unreachable } from '~/utils/unreachable';
import { getCurrentChatId } from '~/utils/fileLocks';
import { createScopedLogger } from '~/utils/logger';

import type { File, Folder, FileMap, LockResult, FolderLockResult } from './files.types';
import { loadDeletedPaths, persistDeletedPaths } from './files.persistence';
import {
  loadLockedFiles,
  lockFile,
  lockFolder,
  unlockFile,
  unlockFolder,
  isFileLocked,
  isFileInLockedFolder,
  isFolderLocked,
  type FilesLockContext,
} from './files.locks';
import {
  getFileModifications,
  getModifiedFiles,
  resetFileModifications,
} from './files.modifications';

const logger = createScopedLogger('FilesStore');

export class FilesStore {
  #size = 0;
  #modifiedFiles: Map<string, string> = import.meta.hot?.data.modifiedFiles ?? new Map();
  #deletedPaths: Set<string> = import.meta.hot?.data.deletedPaths ?? new Set();

  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  get filesCount() {
    return this.#size;
  }

  // Context object for lock operations
  #lockContext: FilesLockContext = {
    files: this.files,
    getFile: this.getFile.bind(this),
    getFileOrFolder: this.getFileOrFolder.bind(this),
  };

  constructor() {
    logger.info('FilesStore initialized (Daytona mode)');

    // Defer deleted paths loading to avoid blocking startup
    if (typeof window !== 'undefined') {
      const scheduleInit = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
            callback,
          );
        } else {
          setTimeout(callback, 50);
        }
      };

      scheduleInit(() => {
        loadDeletedPaths(this.#deletedPaths);
        loadLockedFiles(this.#lockContext);
      });

      // Setup navigation listeners for lock reloading
      let lastChatId = getCurrentChatId();

      const handleNavigation = () => {
        const currentChatId = getCurrentChatId();

        if (currentChatId !== lastChatId) {
          logger.info(`Chat ID changed from ${lastChatId} to ${currentChatId}, reloading locks`);
          lastChatId = currentChatId;
          loadLockedFiles(this.#lockContext, currentChatId);
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

  // ==================== File Access ====================

  getFile(filePath: string): File | undefined {
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

  getFileOrFolder(p: string): File | Folder | undefined {
    return this.files.get()[p];
  }

  // ==================== Lock Operations ====================

  lockFile(filePath: string, chatId?: string): boolean {
    return lockFile(this.#lockContext, filePath, chatId);
  }

  lockFolder(folderPath: string, chatId?: string): boolean {
    return lockFolder(this.#lockContext, folderPath, chatId);
  }

  unlockFile(filePath: string, chatId?: string): boolean {
    return unlockFile(this.#lockContext, filePath, chatId);
  }

  unlockFolder(folderPath: string, chatId?: string): boolean {
    return unlockFolder(this.#lockContext, folderPath, chatId);
  }

  isFileLocked(filePath: string, chatId?: string): LockResult {
    return isFileLocked(this.#lockContext, filePath, chatId);
  }

  isFileInLockedFolder(filePath: string, chatId?: string): LockResult {
    return isFileInLockedFolder(filePath, chatId);
  }

  isFolderLocked(folderPath: string, chatId?: string): FolderLockResult {
    return isFolderLocked(this.#lockContext, folderPath, chatId);
  }

  // ==================== Modifications Tracking ====================

  getFileModifications() {
    return getFileModifications({
      files: this.files,
      modifiedFiles: this.#modifiedFiles,
    });
  }

  getModifiedFiles() {
    return getModifiedFiles({
      files: this.files,
      modifiedFiles: this.#modifiedFiles,
    });
  }

  resetFileModifications() {
    return resetFileModifications({
      files: this.files,
      modifiedFiles: this.#modifiedFiles,
    });
  }

  // ==================== File Operations ====================

  async saveFile(filePath: string, content: string) {
    try {
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

      persistDeletedPaths(this.#deletedPaths);
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

      persistDeletedPaths(this.#deletedPaths);
      logger.info(`Folder deleted (Daytona mode - local state only): ${folderPath}`);

      return true;
    } catch (error) {
      logger.error('Failed to delete folder\n\n', error);
      throw error;
    }
  }
}
