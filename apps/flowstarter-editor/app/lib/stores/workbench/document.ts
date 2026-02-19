/**
 * Document Operations Module
 *
 * Handles document content and scroll position management.
 * Coordinates with the editor store for document state.
 */

import type { WritableAtom, ReadableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import type { EditorStore } from '../editor';
import type { FilesStore, FileMap } from '../files';

export interface DocumentOperationsConfig {
  editorStore: EditorStore;
  filesStore: FilesStore;
  unsavedFiles: WritableAtom<Set<string>>;
  currentDocument: ReadableAtom<EditorDocument | undefined>;
  setSelectedFile: (filePath: string | undefined) => void;
}

export class DocumentOperations {
  #config: DocumentOperationsConfig;

  constructor(config: DocumentOperationsConfig) {
    this.#config = config;
  }

  // ─── Document Setup ───────────────────────────────────────────────────────

  setDocuments(files: FileMap) {
    this.#config.editorStore.setDocuments(files);

    if (this.#config.filesStore.filesCount > 0 && this.#config.currentDocument.get() === undefined) {
      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file') {
          this.#config.setSelectedFile(filePath);
          break;
        }
      }
    }
  }

  // ─── Content Operations ───────────────────────────────────────────────────

  setCurrentDocumentContent(newContent: string) {
    const filePath = this.#config.currentDocument.get()?.filePath;

    if (!filePath) {
      return;
    }

    const originalContent = this.#config.filesStore.getFile(filePath)?.content;
    const unsavedChanges = originalContent !== undefined && originalContent !== newContent;

    this.#config.editorStore.updateFile(filePath, newContent);

    const currentDocument = this.#config.currentDocument.get();

    if (currentDocument) {
      const previousUnsavedFiles = this.#config.unsavedFiles.get();

      if (unsavedChanges && previousUnsavedFiles.has(currentDocument.filePath)) {
        return;
      }

      const newUnsavedFiles = new Set(previousUnsavedFiles);

      if (unsavedChanges) {
        newUnsavedFiles.add(currentDocument.filePath);
      } else {
        newUnsavedFiles.delete(currentDocument.filePath);
      }

      this.#config.unsavedFiles.set(newUnsavedFiles);
    }
  }

  // ─── Scroll Position ──────────────────────────────────────────────────────

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    const editorDocument = this.#config.currentDocument.get();

    if (!editorDocument) {
      return;
    }

    const { filePath } = editorDocument;
    this.#config.editorStore.updateScrollPosition(filePath, position);
  }

  // ─── Reset Operations ─────────────────────────────────────────────────────

  resetCurrentDocument() {
    const currentDocument = this.#config.currentDocument.get();

    if (currentDocument === undefined) {
      return;
    }

    const { filePath } = currentDocument;
    const file = this.#config.filesStore.getFile(filePath);

    if (!file) {
      return;
    }

    this.setCurrentDocumentContent(file.content);
  }
}

