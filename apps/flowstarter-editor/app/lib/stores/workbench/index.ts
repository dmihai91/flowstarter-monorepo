/**
 * Workbench Store
 *
 * Central store for managing the IDE workbench state.
 * This module coordinates between files, editor, terminal, previews,
 * artifacts, and actions.
 *
 * Refactored into smaller modules for maintainability:
 * - types.ts: Type definitions
 * - artifacts.ts: Artifact management
 * - actions.ts: Action execution
 * - download.ts: Download/sync utilities
 * - document.ts: Document content and scroll operations
 * - fileOperations.ts: File CRUD operations
 */

import { atom, type ReadableAtom, type WritableAtom } from 'nanostores';
import type { EditorDocument, ScrollPosition } from '~/components/editor/codemirror/CodeMirrorEditor';
import type {
  ActionCallbackData,
  ArtifactCallbackData,
  ThinkingArtifactCallbackData,
} from '~/lib/runtime/message-parser';
import type { ITerminal } from '~/types/terminal';
import type { ActionAlert, DeployAlert } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { EditorStore } from '../editor';
import { FilesStore, type FileMap } from '../files';
import { PreviewsStore } from '../previews';
import { TerminalStore } from '../terminal';
import { ArtifactStore } from './artifacts';
import { ActionManager } from './actions';
import { downloadZip, syncFiles } from './download';
import { DocumentOperations } from './document';
import { FileOperations } from './fileOperations';
import type {
  WorkbenchViewType,
  DaytonaPreviewState,
  ArtifactUpdateState,
  ThinkingArtifactUpdateState,
  TestArtifactUpdateState,
  TestArtifactState,
} from './types';

// Re-export types for consumers
export type {
  ArtifactState,
  ArtifactUpdateState,
  TestArtifactState,
  TestArtifactUpdateState,
  ThinkingArtifactState,
  ThinkingArtifactUpdateState,
  WorkbenchViewType,
  DaytonaPreviewState,
  PendingApproval,
} from './types';

const logger = createScopedLogger('WorkbenchStore');

export class WorkbenchStore {
  static readonly MAX_PENDING_ACTIONS = 50;

  #previewsStore = new PreviewsStore();
  #filesStore = new FilesStore();
  #editorStore = new EditorStore(this.#filesStore);
  #terminalStore = new TerminalStore();

  #reloadedMessages = new Set<string>();
  #artifactStore: ArtifactStore;
  #actionManager: ActionManager;
  #documentOps: DocumentOperations;
  #fileOps: FileOperations;

  showWorkbench: WritableAtom<boolean> = import.meta.hot?.data.showWorkbench ?? atom(false);
  currentView: WritableAtom<WorkbenchViewType> = import.meta.hot?.data.currentView ?? atom('code');
  currentArtifactMessageId: WritableAtom<string | null> = import.meta.hot?.data.currentArtifactMessageId ?? atom(null);
  unsavedFiles: WritableAtom<Set<string>> = import.meta.hot?.data.unsavedFiles ?? atom(new Set<string>());
  actionAlert: WritableAtom<ActionAlert | undefined> =
    import.meta.hot?.data.actionAlert ?? atom<ActionAlert | undefined>(undefined);
  deployAlert: WritableAtom<DeployAlert | undefined> =
    import.meta.hot?.data.deployAlert ?? atom<DeployAlert | undefined>(undefined);

  // Daytona preview state
  daytonaPreview: WritableAtom<DaytonaPreviewState> =
    import.meta.hot?.data.daytonaPreview ?? atom({ url: null, sandboxId: null });

  modifiedFiles = new Set<string>();

  constructor() {
    /*
     * Initialize artifact store with callbacks
     * flowstarterTerminal returns { terminal: unknown; process: unknown } which matches ExampleShell
     */
    this.#artifactStore = new ArtifactStore({
      getFlowstarterTerminal: () => this.flowstarterTerminal as { terminal: unknown; process: unknown },
      setActionAlert: (alert) => this.actionAlert.set(alert),
      setDeployAlert: (alert) => this.deployAlert.set(alert),
      isReloadedMessage: (messageId) => this.#reloadedMessages.has(messageId),
      addTestArtifact: (messageId, artifact) => this.addTestArtifact(messageId, artifact),
      updateTestArtifact: (messageId, updates) => this.updateTestArtifact(messageId, updates),
    });

    // Initialize document operations
    this.#documentOps = new DocumentOperations({
      editorStore: this.#editorStore,
      filesStore: this.#filesStore,
      unsavedFiles: this.unsavedFiles,
      currentDocument: this.#editorStore.currentDocument,
      setSelectedFile: (filePath) => this.#editorStore.setSelectedFile(filePath),
    });

    // Initialize file operations
    this.#fileOps = new FileOperations({
      filesStore: this.#filesStore,
      editorStore: this.#editorStore,
      unsavedFiles: this.unsavedFiles,
      currentDocument: this.#editorStore.currentDocument,
      setSelectedFile: (filePath) => this.#editorStore.setSelectedFile(filePath),
      getFiles: () => this.files.get(),
    });

    // Initialize action manager
    this.#actionManager = new ActionManager({
      artifactStore: this.#artifactStore,
      editorStore: this.#editorStore,
      filesStore: this.#filesStore,
      selectedFile: this.#editorStore.selectedFile as WritableAtom<string | undefined>,
      currentView: this.currentView,
      unsavedFiles: this.unsavedFiles,
      saveFile: (filePath) => this.#fileOps.saveFile(filePath),
      resetAllFileModifications: () => this.#fileOps.resetAllFileModifications(),
    });

    if (import.meta.hot) {
      import.meta.hot.data.unsavedFiles = this.unsavedFiles;
      import.meta.hot.data.showWorkbench = this.showWorkbench;
      import.meta.hot.data.currentView = this.currentView;
      import.meta.hot.data.currentArtifactMessageId = this.currentArtifactMessageId;
      import.meta.hot.data.actionAlert = this.actionAlert;
      import.meta.hot.data.deployAlert = this.deployAlert;
      import.meta.hot.data.daytonaPreview = this.daytonaPreview;

      // Ensure binary files are properly preserved across hot reloads
      const filesMap = this.files.get();

      for (const [path, dirent] of Object.entries(filesMap)) {
        if (dirent?.type === 'file' && dirent.isBinary && dirent.content) {
          this.files.setKey(path, { ...dirent });
        }
      }
    }
  }

  // ─── Artifact Accessors ────────────────────────────────────────────────────

  get artifacts() {
    return this.#artifactStore.artifacts;
  }

  get thinkingArtifacts() {
    return this.#artifactStore.thinkingArtifacts;
  }

  get testArtifacts() {
    return this.#artifactStore.testArtifacts;
  }

  get artifactIdList() {
    return this.#artifactStore.artifactIdList;
  }

  get firstArtifact() {
    return this.#artifactStore.firstArtifact;
  }

  get pendingApproval() {
    return this.#actionManager.pendingApproval;
  }

  // ─── Preview Accessors ─────────────────────────────────────────────────────

  get previews() {
    return this.#previewsStore.previews;
  }

  updatePreviewUrl(port: number, url: string) {
    this.#previewsStore.updateUrl(port, url);
  }

  // ─── Files Accessors ───────────────────────────────────────────────────────

  get files() {
    return this.#filesStore.files;
  }

  get filesCount(): number {
    return this.#filesStore.filesCount;
  }

  // ─── Editor Accessors ──────────────────────────────────────────────────────

  get currentDocument(): ReadableAtom<EditorDocument | undefined> {
    return this.#editorStore.currentDocument;
  }

  get selectedFile(): ReadableAtom<string | undefined> {
    return this.#editorStore.selectedFile;
  }

  // ─── Terminal Accessors ────────────────────────────────────────────────────

  get showTerminal() {
    return this.#terminalStore.showTerminal;
  }

  get flowstarterTerminal() {
    return this.#terminalStore.flowstarterTerminal;
  }

  toggleTerminal(value?: boolean) {
    this.#terminalStore.toggleTerminal(value);
  }

  attachTerminal(terminal: ITerminal) {
    this.#terminalStore.attachTerminal(terminal);
  }

  attachFlowstarterTerminal(terminal: ITerminal) {
    this.#terminalStore.attachFlowstarterTerminal(terminal);
  }

  onTerminalResize(cols: number, rows: number) {
    this.#terminalStore.onTerminalResize(cols, rows);
  }

  // ─── Alert Accessors ───────────────────────────────────────────────────────

  get alert() {
    return this.actionAlert;
  }

  clearAlert() {
    this.actionAlert.set(undefined);
  }

  get DeployAlert() {
    return this.deployAlert;
  }

  clearDeployAlert() {
    this.deployAlert.set(undefined);
  }

  // ─── Workbench State ───────────────────────────────────────────────────────

  setShowWorkbench(show: boolean) {
    this.showWorkbench.set(show);
  }

  setDaytonaPreview(preview: DaytonaPreviewState) {
    this.daytonaPreview.set(preview);
    logger.info(`Daytona preview set: ${preview.url}`);
  }

  clearDaytonaPreview() {
    this.daytonaPreview.set({ url: null, sandboxId: null });
  }

  // ─── Document Operations ───────────────────────────────────────────────────

  setDocuments(files: FileMap) {
    this.#documentOps.setDocuments(files);
  }

  setCurrentDocumentContent(newContent: string) {
    this.#documentOps.setCurrentDocumentContent(newContent);
  }

  setCurrentDocumentScrollPosition(position: ScrollPosition) {
    this.#documentOps.setCurrentDocumentScrollPosition(position);
  }

  setSelectedFile(filePath: string | undefined) {
    this.#editorStore.setSelectedFile(filePath);
  }

  // ─── File Operations ───────────────────────────────────────────────────────

  async saveFile(filePath: string) {
    return this.#fileOps.saveFile(filePath);
  }

  async saveCurrentDocument() {
    return this.#fileOps.saveCurrentDocument();
  }

  resetCurrentDocument() {
    this.#documentOps.resetCurrentDocument();
  }

  async saveAllFiles() {
    return this.#fileOps.saveAllFiles();
  }

  getFileModifcations() {
    return this.#fileOps.getFileModifications();
  }

  getModifiedFiles() {
    return this.#fileOps.getModifiedFiles();
  }

  resetAllFileModifications() {
    this.#fileOps.resetAllFileModifications();
  }

  // ─── File Locking ──────────────────────────────────────────────────────────

  lockFile(filePath: string) {
    return this.#fileOps.lockFile(filePath);
  }

  lockFolder(folderPath: string) {
    return this.#fileOps.lockFolder(folderPath);
  }

  unlockFile(filePath: string) {
    return this.#fileOps.unlockFile(filePath);
  }

  unlockFolder(folderPath: string) {
    return this.#fileOps.unlockFolder(folderPath);
  }

  isFileLocked(filePath: string) {
    return this.#fileOps.isFileLocked(filePath);
  }

  isFolderLocked(folderPath: string) {
    return this.#fileOps.isFolderLocked(folderPath);
  }

  // ─── Create/Delete Operations ──────────────────────────────────────────────

  async createFile(filePath: string, content: string | Uint8Array = '') {
    return this.#fileOps.createFile(filePath, content);
  }

  async createFolder(folderPath: string) {
    return this.#fileOps.createFolder(folderPath);
  }

  async deleteFile(filePath: string) {
    return this.#fileOps.deleteFile(filePath);
  }

  async deleteFolder(folderPath: string) {
    return this.#fileOps.deleteFolder(folderPath);
  }

  // ─── Artifact Operations ───────────────────────────────────────────────────

  setReloadedMessages(messages: string[]) {
    this.#reloadedMessages = new Set(messages);
  }

  addArtifact(data: ArtifactCallbackData & { id: string; title: string; type?: string }) {
    this.#artifactStore.addArtifact(data);
  }

  updateArtifact(data: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    this.#artifactStore.updateArtifact(data, state);
  }

  addThinkingArtifact(data: ThinkingArtifactCallbackData) {
    this.#artifactStore.addThinkingArtifact(data);
  }

  updateThinkingArtifact(data: ThinkingArtifactCallbackData, state: Partial<ThinkingArtifactUpdateState>) {
    this.#artifactStore.updateThinkingArtifact(data, state);
  }

  addTestArtifact(messageId: string, artifact: Omit<TestArtifactState, 'closed'>) {
    this.#artifactStore.addTestArtifact(messageId, artifact);
  }

  updateTestArtifact(messageId: string, updates: Partial<TestArtifactUpdateState>) {
    this.#artifactStore.updateTestArtifact(messageId, updates);
  }

  abortAllActions() {
    this.#artifactStore.abortAllActions();
  }

  // ─── Action Operations ─────────────────────────────────────────────────────

  addAction(data: ActionCallbackData) {
    this.#actionManager.addToExecutionQueue(
      () => Promise.resolve(this.#actionManager.addAction(data)),
      (alert) => this.actionAlert.set(alert as ActionAlert),
    );
  }

  runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    if (isStreaming) {
      this.#actionManager.actionStreamSampler(data, isStreaming);
    } else {
      this.#actionManager.addToExecutionQueue(
        () => this.#actionManager.runAction(data, isStreaming),
        (alert) => this.actionAlert.set(alert as ActionAlert),
      );
    }
  }

  async approveFileChange() {
    return this.#actionManager.approveFileChange();
  }

  async rejectFileChange() {
    return this.#actionManager.rejectFileChange();
  }

  // ─── Download/Sync/GitHub ──────────────────────────────────────────────────

  async downloadZip() {
    return downloadZip(this.files.get());
  }

  async syncFiles(targetHandle: FileSystemDirectoryHandle) {
    return syncFiles(this.files.get(), targetHandle);
  }
}

export const workbenchStore = new WorkbenchStore();

