/**
 * Action Management Module
 *
 * Handles action execution, file change approval/rejection,
 * and action queue management.
 */

import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import type { EditorStore } from '../editor';
import type { FilesStore } from '../files';
import type { ArtifactStore } from './artifacts';
import type { PendingApproval, WorkbenchViewType } from './types';
import type { WritableAtom } from 'nanostores';
import { atom } from 'nanostores';
import { unreachable } from '~/utils/unreachable';
import { createScopedLogger } from '~/utils/logger';
import { createSampler } from '~/utils/sampler';
import { diffApprovalStore } from '../settings';

const logger = createScopedLogger('ActionManager');

const DEFAULT_ACTION_SAMPLE_INTERVAL = 500;

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve(), { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export interface ActionManagerDeps {
  artifactStore: ArtifactStore;
  editorStore: EditorStore;
  filesStore: FilesStore;
  selectedFile: WritableAtom<string | undefined>;
  currentView: WritableAtom<WorkbenchViewType>;
  unsavedFiles: WritableAtom<Set<string>>;
  saveFile: (filePath: string) => Promise<void>;
  resetAllFileModifications: () => void;
}

export class ActionManager {
  static readonly MAX_PENDING_ACTIONS = 50;

  #actionQueueDepth = 0;
  #globalExecutionQueue = Promise.resolve();

  pendingApproval: WritableAtom<PendingApproval | null> = import.meta.hot?.data.pendingApproval ?? atom(null);

  #deps: ActionManagerDeps;

  constructor(deps: ActionManagerDeps) {
    this.#deps = deps;

    if (import.meta.hot) {
      import.meta.hot.data.pendingApproval = this.pendingApproval;
    }
  }

  addToExecutionQueue(
    callback: () => Promise<void>,
    setActionAlert: (alert: { type: string; title: string; description: string }) => void,
  ) {
    if (this.#actionQueueDepth >= ActionManager.MAX_PENDING_ACTIONS) {
      logger.warn(`Action queue full (${this.#actionQueueDepth}), dropping action`);

      setActionAlert({
        type: 'warning',
        title: 'Action Queue Full',
        description: 'Too many pending actions. Slowing down to prevent crashes.',
      });

      return;
    }

    this.#actionQueueDepth++;

    this.#globalExecutionQueue = this.#globalExecutionQueue
      .then(() => callback())
      .finally(() => {
        this.#actionQueueDepth--;
      });
  }

  addAction(data: ActionCallbackData) {
    const { messageId } = data;
    const artifact = this.#deps.artifactStore.getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    return artifact.runner.addAction(data);
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { messageId } = data;
    const artifact = this.#deps.artifactStore.getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const action = artifact.runner.actions.get()[data.actionId];

    if (!action || action.executed) {
      return;
    }

    await yieldToMainThread();

    if (data.action.type === 'file' && !isStreaming && diffApprovalStore.get()) {
      const fullPath = data.action.filePath.startsWith('/') ? data.action.filePath : `/${data.action.filePath}`;

      let beforeContent = '';
      const existingFile = this.#deps.filesStore.files.get()[fullPath];

      if (existingFile && existingFile.type === 'file') {
        beforeContent = existingFile.content;
      }

      const afterContent = data.action.content;

      if (beforeContent !== afterContent) {
        this.pendingApproval.set({
          actionId: data.actionId,
          messageId,
          artifactId: data.artifactId,
          filePath: fullPath,
          beforeContent,
          afterContent,
          action: data.action,
        });

        const actions = artifact.runner.actions.get();
        const currentAction = actions[data.actionId];

        if (currentAction) {
          artifact.runner.actions.setKey(data.actionId, {
            ...currentAction,
            status: 'awaiting-approval',
          });
        }

        return;
      }
    }

    if (data.action.type === 'file') {
      const fullPath = data.action.filePath.startsWith('/') ? data.action.filePath : `/${data.action.filePath}`;

      if (this.#deps.selectedFile.get() !== fullPath) {
        this.#deps.selectedFile.set(fullPath);
      }

      if (this.#deps.currentView.get() !== 'code') {
        this.#deps.currentView.set('code');
      }

      const doc = this.#deps.editorStore.documents.get()[fullPath];

      if (!doc) {
        await artifact.runner.runAction(data, isStreaming);
      }

      this.#deps.editorStore.updateFile(fullPath, data.action.content);
      await yieldToMainThread();

      if (!isStreaming && data.action.content) {
        await this.#deps.saveFile(fullPath);
        await yieldToMainThread();
      }

      if (!isStreaming) {
        await artifact.runner.runAction(data);
        this.#deps.resetAllFileModifications();
      }
    } else {
      await artifact.runner.runAction(data);
    }
  }

  actionStreamSampler = createSampler(async (data: ActionCallbackData, isStreaming: boolean = false) => {
    return await this.runAction(data, isStreaming);
  }, DEFAULT_ACTION_SAMPLE_INTERVAL);

  async approveFileChange() {
    const pending = this.pendingApproval.get();

    if (!pending) {
      return;
    }

    const { actionId, messageId, artifactId, action } = pending;

    this.pendingApproval.set(null);

    const artifact = this.#deps.artifactStore.getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const actions = artifact.runner.actions.get();
    const currentAction = actions[actionId];

    if (currentAction) {
      artifact.runner.actions.setKey(actionId, { ...currentAction, status: 'running' });
    }

    const wasEnabled = diffApprovalStore.get();
    diffApprovalStore.set(false);

    try {
      await this.runAction(
        {
          messageId,
          artifactId,
          actionId,
          action,
        },
        false,
      );
    } finally {
      diffApprovalStore.set(wasEnabled);
    }
  }

  async rejectFileChange() {
    const pending = this.pendingApproval.get();

    if (!pending) {
      return;
    }

    const { actionId, messageId } = pending;

    this.pendingApproval.set(null);

    const artifact = this.#deps.artifactStore.getArtifact(messageId);

    if (!artifact) {
      unreachable('Artifact not found');
    }

    const actions = artifact.runner.actions.get();
    const currentAction = actions[actionId];

    if (currentAction) {
      artifact.runner.actions.setKey(actionId, { ...currentAction, status: 'aborted' });
    }
  }
}

