/**
 * Artifact Store Module
 *
 * Manages artifact state including regular artifacts, thinking artifacts,
 * and test artifacts. Handles artifact creation, updates, and retrieval.
 */

import { map, type MapStore } from 'nanostores';
import { ActionRunner, type ExampleShell } from '~/lib/runtime/action-runner';
import type { ArtifactCallbackData, ThinkingArtifactCallbackData } from '~/lib/runtime/message-parser';
import type { ActionAlert, DeployAlert } from '~/types/actions';
import type {
  ArtifactState,
  ArtifactUpdateState,
  TestArtifactState,
  TestArtifactUpdateState,
  ThinkingArtifactState,
  ThinkingArtifactUpdateState,
} from './types';

type Artifacts = MapStore<Record<string, ArtifactState>>;

export interface ArtifactStoreCallbacks {
  getFlowstarterTerminal: () => ExampleShell;
  setActionAlert: (alert: ActionAlert | undefined) => void;
  setDeployAlert: (alert: DeployAlert | undefined) => void;
  isReloadedMessage: (messageId: string) => boolean;
  addTestArtifact: (messageId: string, artifact: Omit<TestArtifactState, 'closed'>) => void;
  updateTestArtifact: (messageId: string, updates: Partial<TestArtifactUpdateState>) => void;
}

export class ArtifactStore {
  artifacts: Artifacts = import.meta.hot?.data.artifacts ?? map({});
  thinkingArtifacts: MapStore<Record<string, ThinkingArtifactState>> =
    import.meta.hot?.data.thinkingArtifacts ?? map({});
  testArtifacts: MapStore<Record<string, TestArtifactState>> = import.meta.hot?.data.testArtifacts ?? map({});

  artifactIdList: string[] = [];

  #callbacks: ArtifactStoreCallbacks;

  constructor(callbacks: ArtifactStoreCallbacks) {
    this.#callbacks = callbacks;

    if (import.meta.hot) {
      import.meta.hot.data.artifacts = this.artifacts;
      import.meta.hot.data.thinkingArtifacts = this.thinkingArtifacts;
      import.meta.hot.data.testArtifacts = this.testArtifacts;
    }
  }

  get firstArtifact(): ArtifactState | undefined {
    return this.getArtifact(this.artifactIdList[0]);
  }

  getArtifact(id: string): ArtifactState | undefined {
    const artifacts = this.artifacts.get();
    return artifacts[id];
  }

  addArtifact(data: ArtifactCallbackData & { id: string; title: string; type?: string }) {
    const { messageId, title, id, type } = data;
    const artifact = this.getArtifact(messageId);

    if (artifact) {
      return;
    }

    if (!this.artifactIdList.includes(messageId)) {
      this.artifactIdList.push(messageId);
    }

    this.artifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      runner: new ActionRunner(
        this.#callbacks.getFlowstarterTerminal,
        (alert) => {
          if (this.#callbacks.isReloadedMessage(messageId)) {
            return;
          }

          this.#callbacks.setActionAlert(alert);
        },
        (alert) => {
          if (this.#callbacks.isReloadedMessage(messageId)) {
            return;
          }

          this.#callbacks.setDeployAlert(alert);
        },
        (testResult) => {
          if (this.#callbacks.isReloadedMessage(messageId)) {
            return;
          }

          const testArtifact = this.getTestArtifact(messageId);

          if (!testArtifact) {
            this.#callbacks.addTestArtifact(messageId, {
              id: `test-${Date.now()}`,
              title: 'Test Results',
              type: 'test',
              command: testResult.command,
              summary: testResult.summary,
              duration: testResult.duration,
              coverage: testResult.coverage,
              failedTests: testResult.failedTests,
              status: testResult.status,
              timestamp: new Date().toISOString(),
            });
          } else {
            this.#callbacks.updateTestArtifact(messageId, {
              summary: testResult.summary,
              duration: testResult.duration,
              coverage: testResult.coverage,
              failedTests: testResult.failedTests,
              status: testResult.status,
            });
          }
        },
        (output, command) => {
          if (this.#callbacks.isReloadedMessage(messageId)) {
            return;
          }

          this.#callbacks.setActionAlert({
            type: 'info',
            title: 'Command Running',
            description: `Executing: ${command}`,
            content: output,
            isStreaming: true,
            streamingOutput: output,
            command,
          });
        },
      ),
    });
  }

  updateArtifact({ messageId }: ArtifactCallbackData, state: Partial<ArtifactUpdateState>) {
    const artifact = this.getArtifact(messageId);

    if (!artifact) {
      return;
    }

    this.artifacts.setKey(messageId, { ...artifact, ...state });
  }

  // ─── Thinking Artifacts ──────────────────────────────────────────────────────

  getThinkingArtifact(messageId: string): ThinkingArtifactState | undefined {
    return this.thinkingArtifacts.get()[messageId];
  }

  addThinkingArtifact({ messageId, title, id, type, steps, content }: ThinkingArtifactCallbackData) {
    const thinkingArtifact = this.getThinkingArtifact(messageId);

    if (thinkingArtifact) {
      return;
    }

    this.thinkingArtifacts.setKey(messageId, {
      id,
      title,
      closed: false,
      type,
      steps,
      content,
    });
  }

  updateThinkingArtifact({ messageId }: ThinkingArtifactCallbackData, state: Partial<ThinkingArtifactUpdateState>) {
    const thinkingArtifact = this.getThinkingArtifact(messageId);

    if (!thinkingArtifact) {
      return;
    }

    this.thinkingArtifacts.setKey(messageId, { ...thinkingArtifact, ...state });
  }

  // ─── Test Artifacts ──────────────────────────────────────────────────────────

  getTestArtifact(messageId: string): TestArtifactState | undefined {
    return this.testArtifacts.get()[messageId];
  }

  addTestArtifact(messageId: string, artifact: Omit<TestArtifactState, 'closed'>) {
    const testArtifact = this.getTestArtifact(messageId);

    if (testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, {
      ...artifact,
      closed: false,
    });
  }

  updateTestArtifact(messageId: string, updates: Partial<TestArtifactUpdateState>) {
    const testArtifact = this.getTestArtifact(messageId);

    if (!testArtifact) {
      return;
    }

    this.testArtifacts.setKey(messageId, { ...testArtifact, ...updates });
  }

  // ─── Action Abort ────────────────────────────────────────────────────────────

  abortAllActions() {
    const artifacts = this.artifacts.get();

    for (const artifact of Object.values(artifacts)) {
      const actions = artifact.runner.actions.get();

      for (const action of Object.values(actions)) {
        if (action.status === 'pending' || action.status === 'running') {
          action.abort();
        }
      }
    }
  }
}

