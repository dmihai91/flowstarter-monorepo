/**
 * File Operations Module
 *
 * Handles file and folder CRUD operations for the workbench.
 * Coordinates between the files store, editor store, and unsaved files tracking.
 */

import type { WritableAtom } from 'nanostores';
import type { EditorDocument } from '~/components/editor/codemirror/CodeMirrorEditor';
import { path } from '~/utils/path';
import type { EditorStore } from '../editor';
import type { FilesStore } from '../files';

export interface FileOperationsConfig {
  filesStore: FilesStore;
  editorStore: EditorStore;
  unsavedFiles: WritableAtom<Set<string>>;
  currentDocument: { get: () => EditorDocument | undefined };
  setSelectedFile: (filePath: string | undefined) => void;
  getFiles: () => Record<string, { type: string } | undefined>;
}

export class FileOperations {
  #config: FileOperationsConfig;

  constructor(config: FileOperationsConfig) {
    this.#config = config;
  }

  // ─── File Save Operations ─────────────────────────────────────────────────

  async saveFile(filePath: string) {
    const documents = this.#config.editorStore.documents.get();
    const document = documents[filePath];

    if (document === undefined) {
      return;
    }

    await this.#config.filesStore.saveFile(filePath, document.value);

    const newUnsavedFiles = new Set(this.#config.unsavedFiles.get());
    newUnsavedFiles.delete(filePath);
    this.#config.unsavedFiles.set(newUnsavedFiles);
  }

  async saveCurrentDocument() {
    const currentDocument = this.#config.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    await this.saveFile(currentDocument.filePath);
  }

  async saveAllFiles() {
    for (const filePath of this.#config.unsavedFiles.get()) {
      await this.saveFile(filePath);
    }
  }

  // ─── File Modification Tracking ───────────────────────────────────────────

  getFileModifications() {
    return this.#config.filesStore.getFileModifications();
  }

  getModifiedFiles() {
    return this.#config.filesStore.getModifiedFiles();
  }

  resetAllFileModifications() {
    this.#config.filesStore.resetFileModifications();
  }

  // ─── File Locking ─────────────────────────────────────────────────────────

  lockFile(filePath: string) {
    return this.#config.filesStore.lockFile(filePath);
  }

  lockFolder(folderPath: string) {
    return this.#config.filesStore.lockFolder(folderPath);
  }

  unlockFile(filePath: string) {
    return this.#config.filesStore.unlockFile(filePath);
  }

  unlockFolder(folderPath: string) {
    return this.#config.filesStore.unlockFolder(folderPath);
  }

  isFileLocked(filePath: string) {
    return this.#config.filesStore.isFileLocked(filePath);
  }

  isFolderLocked(folderPath: string) {
    return this.#config.filesStore.isFolderLocked(folderPath);
  }

  // ─── Create Operations ────────────────────────────────────────────────────

  async createFile(filePath: string, content: string | Uint8Array = '') {
    try {
      const normalizedPath = path.toForwardSlashes(filePath);
      const storageKey = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

      const success = await this.#config.filesStore.createFile(filePath, content);

      if (success) {
        this.#config.setSelectedFile(storageKey);

        if (typeof content === 'string' && content === '') {
          const newUnsavedFiles = new Set(this.#config.unsavedFiles.get());
          newUnsavedFiles.delete(storageKey);
          this.#config.unsavedFiles.set(newUnsavedFiles);
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async createFolder(folderPath: string) {
    try {
      return await this.#config.filesStore.createFolder(folderPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  // ─── Delete Operations ────────────────────────────────────────────────────

  async deleteFile(filePath: string) {
    try {
      const currentDocument = this.#config.currentDocument.get();
      const isCurrentFile = currentDocument?.filePath === filePath;

      const success = await this.#config.filesStore.deleteFile(filePath);

      if (success) {
        const newUnsavedFiles = new Set(this.#config.unsavedFiles.get());

        if (newUnsavedFiles.has(filePath)) {
          newUnsavedFiles.delete(filePath);
          this.#config.unsavedFiles.set(newUnsavedFiles);
        }

        if (isCurrentFile) {
          this.#selectNextFile();
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string) {
    try {
      const currentDocument = this.#config.currentDocument.get();
      const isInCurrentFolder = currentDocument?.filePath?.startsWith(folderPath + '/');

      const success = await this.#config.filesStore.deleteFolder(folderPath);

      if (success) {
        this.#cleanupUnsavedFilesInFolder(folderPath);

        if (isInCurrentFolder) {
          this.#selectNextFile();
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  #selectNextFile() {
    const files = this.#config.getFiles();
    let nextFile: string | undefined = undefined;

    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file') {
        nextFile = filePath;
        break;
      }
    }

    this.#config.setSelectedFile(nextFile);
  }

  #cleanupUnsavedFilesInFolder(folderPath: string) {
    const unsavedFiles = this.#config.unsavedFiles.get();
    const newUnsavedFiles = new Set<string>();

    for (const file of unsavedFiles) {
      if (!file.startsWith(folderPath + '/')) {
        newUnsavedFiles.add(file);
      }
    }

    if (newUnsavedFiles.size !== unsavedFiles.size) {
      this.#config.unsavedFiles.set(newUnsavedFiles);
    }
  }
}

