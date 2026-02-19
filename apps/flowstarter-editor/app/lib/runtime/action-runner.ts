/**
 * Action Runner
 *
 * Handles execution of actions from the AI assistant.
 * In Daytona mode, file operations update local state and sync to Daytona via API.
 * Build/start operations are handled by Daytona cloud sandboxes.
 */

import { path as nodePath } from '~/utils/path';
import { atom, map, type MapStore } from 'nanostores';
import type { ActionAlert, BoltAction, DeployAlert, FileHistory } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';
import { validateCode } from './code-validator';

// Shell terminal type stub (shell operations run in Daytona, not locally)
export type ExampleShell = {
  terminal: unknown;
  process: unknown;
};

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed' | 'awaiting-approval';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

class ActionCommandError extends Error {
  readonly _output: string;
  readonly _header: string;

  constructor(message: string, output: string) {
    // Create a formatted message that includes both the error message and output
    const formattedMessage = `Failed To Execute Shell Command: ${message}\n\nOutput:\n${output}`;
    super(formattedMessage);

    // Set the output separately so it can be accessed programmatically
    this._header = message;
    this._output = output;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ActionCommandError.prototype);

    // Set the name of the error for better debugging
    this.name = 'ActionCommandError';
  }

  // Optional: Add a method to get just the terminal output
  get output() {
    return this._output;
  }
  get header() {
    return this._header;
  }
}

export type TestResultCallback = (result: {
  command: string;
  summary: { total: number; passed: number; failed: number; skipped: number };
  duration: number;
  coverage?: { lines: number; statements: number; functions: number; branches: number };
  failedTests?: Array<{ name: string; file: string; line: number; error: string; stack?: string }>;
  status: 'complete' | 'failed';
}) => void;

// File write callback type - allows integration with external file stores
export type FileWriteCallback = (filePath: string, content: string) => Promise<void>;

export class ActionRunner {
  static readonly MAX_CONCURRENT_FILE_WRITES = 5;

  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #currentFileWrites = 0;
  #fileWriteQueue: Array<() => Promise<void>> = [];
  #shellTerminal: () => ExampleShell;
  #fileWriteCallback?: FileWriteCallback;

  runnerId = atom<string>(`${Date.now()}`);
  actions: ActionsMap = map({});
  onAlert?: (alert: ActionAlert) => void;
  onDeployAlert?: (alert: DeployAlert) => void;
  onTestResult?: TestResultCallback;
  onLiveOutput?: (output: string, actionId: string) => void;
  buildOutput?: { path: string; exitCode: number; output: string };

  constructor(
    getShellTerminal: () => ExampleShell,
    onAlert?: (alert: ActionAlert) => void,
    onDeployAlert?: (alert: DeployAlert) => void,
    onTestResult?: TestResultCallback,
    onLiveOutput?: (output: string, actionId: string) => void,
    fileWriteCallback?: FileWriteCallback,
  ) {
    this.#shellTerminal = getShellTerminal;
    this.onAlert = onAlert;
    this.onDeployAlert = onDeployAlert;
    this.onTestResult = onTestResult;
    this.onLiveOutput = onLiveOutput;
    this.#fileWriteCallback = fileWriteCallback;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      this.#updateAction(actionId, { status: 'running' });
    });
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return; // No return value here
    }

    if (isStreaming && action.type !== 'file') {
      return; // No return value here
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: !isStreaming });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId, isStreaming);
      })
      .catch((error) => {
        console.error('Action failed:', error);
      });

    await this.#currentExecutionPromise;

    return;
  }

  async #executeAction(actionId: string, isStreaming: boolean = false) {
    const action = this.actions.get()[actionId];

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#queueFileWrite(() => this.#runFileAction(action));
          break;
        }
        case 'build': {
          /*
           * In Daytona mode, builds are handled by the cloud sandbox
           * This is a no-op - build happens via Daytona API
           */
          logger.info('Build action - handled by Daytona cloud sandbox');
          this.buildOutput = { path: 'dist', exitCode: 0, output: 'Build handled by Daytona' };
          break;
        }
        case 'start': {
          /*
           * In Daytona mode, start is handled by the cloud sandbox
           * This is mostly a no-op
           */
          logger.info('Start action - handled by Daytona cloud sandbox');
          await new Promise((resolve) => setTimeout(resolve, 500));
          break;
        }
      }

      this.#updateAction(actionId, {
        status: isStreaming ? 'running' : action.abortSignal.aborted ? 'aborted' : 'complete',
      });
    } catch (error) {
      if (action.abortSignal.aborted) {
        return;
      }

      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
      logger.error(`[${action.type}]:Action failed\n\n`, error);

      if (!(error instanceof ActionCommandError)) {
        return;
      }

      this.onAlert?.({
        type: 'error',
        title: 'Dev Server Failed',
        description: error.header,
        content: error.output,
      });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #queueFileWrite(writeOperation: () => Promise<void>): Promise<void> {
    if (this.#currentFileWrites < ActionRunner.MAX_CONCURRENT_FILE_WRITES) {
      this.#currentFileWrites++;

      try {
        await writeOperation();
      } finally {
        this.#currentFileWrites--;
        this.#processFileWriteQueue();
      }
    } else {
      await new Promise<void>((resolve) => {
        this.#fileWriteQueue.push(async () => {
          await writeOperation();
          resolve();
        });
      });
    }
  }

  #processFileWriteQueue() {
    while (this.#fileWriteQueue.length > 0 && this.#currentFileWrites < ActionRunner.MAX_CONCURRENT_FILE_WRITES) {
      const next = this.#fileWriteQueue.shift();

      if (next) {
        this.#currentFileWrites++;
        next().finally(() => {
          this.#currentFileWrites--;
          this.#processFileWriteQueue();
        });
      }
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    // In Daytona mode, shell commands display info but don't execute locally
    logger.info(`Shell action (Daytona mode): ${action.content}`);

    // For test commands, we can still try to parse output if available
    if (this.#isTestCommand(action.content) && this.onTestResult) {
      /*
       * In Daytona mode, tests run in the cloud sandbox
       * The result would come through the Daytona preview/build flow
       */
      logger.info('Test command detected - will run in Daytona sandbox');
    }
  }

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    // Normalize the file path
    const filePath = action.filePath.startsWith('/') ? action.filePath : `/${action.filePath}`;

    const validationResult = validateCode(filePath, action.content);

    if (!validationResult.isValid) {
      logger.warn(`Code validation failed for ${filePath}:`, validationResult.errors);
      logger.warn('Writing file anyway, but it may contain errors');
    }

    if (validationResult.warnings.length > 0) {
      logger.debug(`Code validation warnings for ${filePath}:`, validationResult.warnings);
    }

    try {
      // Use the file write callback if provided (connects to FilesStore)
      if (this.#fileWriteCallback) {
        await this.#fileWriteCallback(filePath, action.content);
        logger.debug(`File written via callback: ${filePath}`);
      } else {
        // Fallback: just log (files will be synced via workbench store)
        logger.debug(`File action recorded: ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to write file\n\n', error);
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();

    this.actions.setKey(id, { ...actions[id], ...newState });
  }

  async getFileHistory(_filePath: string): Promise<FileHistory | null> {
    /*
     * In Daytona mode, file history is not persisted locally
     * History could be tracked via Convex or other cloud storage
     */
    logger.debug('File history not available in Daytona mode');
    return null;
  }

  async saveFileHistory(_filePath: string, _history: FileHistory) {
    // In Daytona mode, file history is not persisted locally
    logger.debug('File history save skipped in Daytona mode');
  }

  // Add this method declaration to the class
  handleDeployAction(
    stage: 'building' | 'deploying' | 'complete',
    status: ActionStatus,
    details?: {
      url?: string;
      error?: string;
      source?: 'vercel' | 'netlify' | 'github' | 'gitlab' | 'cloudflare';
    },
  ): void {
    if (!this.onDeployAlert) {
      logger.debug('No deploy alert handler registered');
      return;
    }

    const alertType = status === 'failed' ? 'error' : status === 'complete' ? 'success' : 'info';

    const title =
      stage === 'building'
        ? 'Building Application'
        : stage === 'deploying'
          ? 'Deploying Application'
          : 'Deployment Complete';

    const description =
      status === 'failed'
        ? `${stage === 'building' ? 'Build' : 'Deployment'} failed`
        : status === 'running'
          ? `${stage === 'building' ? 'Building' : 'Deploying'} your application...`
          : status === 'complete'
            ? `${stage === 'building' ? 'Build' : 'Deployment'} completed successfully`
            : `Preparing to ${stage === 'building' ? 'build' : 'deploy'} your application`;

    const buildStatus =
      stage === 'building' ? status : stage === 'deploying' || stage === 'complete' ? 'complete' : 'pending';

    const deployStatus = stage === 'building' ? 'pending' : status;

    this.onDeployAlert({
      type: alertType,
      title,
      description,
      content: details?.error || '',
      url: details?.url,
      stage,
      buildStatus: buildStatus as any,
      deployStatus: deployStatus as any,
      source: details?.source || 'netlify',
    });
  }

  #isTestCommand(command: string): boolean {
    const patterns = [/\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b/, /\b(vitest|jest|mocha|ava|tape)\b/, /\btest:[^\s]+/];
    return patterns.some((p) => p.test(command));
  }

  #parseTestOutput(output: string): {
    summary: { total: number; passed: number; failed: number; skipped: number };
    duration: number;
    coverage?: { lines: number; statements: number; functions: number; branches: number };
    failedTests?: Array<{ name: string; file: string; line: number; error: string; stack?: string }>;
  } | null {
    try {
      // Try to parse Vitest output
      const vitestMatch = output.match(/Test Files\s+(\d+)\s+passed.*?\((\d+)\)/);
      const vitestFailed = output.match(/(\d+)\s+failed/);
      const vitestSkipped = output.match(/(\d+)\s+skipped/);
      const vitestDuration = output.match(/Duration\s+([\d.]+)([ms]+)/);

      // Try Jest format
      const jestMatch = output.match(/Tests:\s+(\d+)\s+failed.*?(\d+)\s+passed.*?(\d+)\s+total/);
      const jestTime = output.match(/Time:\s+([\d.]+)\s*s/);

      let summary = { total: 0, passed: 0, failed: 0, skipped: 0 };
      let duration = 0;

      if (vitestMatch) {
        const passed = parseInt(vitestMatch[1] || '0', 10);
        const total = parseInt(vitestMatch[2] || '0', 10);
        const failed = vitestFailed ? parseInt(vitestFailed[1] || '0', 10) : 0;
        const skipped = vitestSkipped ? parseInt(vitestSkipped[1] || '0', 10) : 0;

        summary = { total, passed, failed, skipped };

        if (vitestDuration) {
          const value = parseFloat(vitestDuration[1]);
          duration = vitestDuration[2] === 's' ? value * 1000 : value;
        }
      } else if (jestMatch) {
        const failed = parseInt(jestMatch[1] || '0', 10);
        const passed = parseInt(jestMatch[2] || '0', 10);
        const total = parseInt(jestMatch[3] || '0', 10);
        const skipped = total - passed - failed;

        summary = { total, passed, failed, skipped };

        if (jestTime) {
          duration = parseFloat(jestTime[1]) * 1000;
        }
      } else {
        // Fallback: try to find any test counts
        const passedMatch = output.match(/(\d+)\s+pass/i);
        const failedMatch = output.match(/(\d+)\s+fail/i);

        if (passedMatch || failedMatch) {
          const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
          const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
          const total = passed + failed;
          summary = { total, passed, failed, skipped: 0 };
        } else {
          return null;
        }
      }

      // Parse coverage if available
      let coverage;
      const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);

      if (coverageMatch) {
        coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4]),
        };
      }

      // Parse failed tests
      let failedTests;

      if (summary.failed > 0) {
        failedTests = [];

        const failurePattern = /FAIL\s+(.+?)\n.*?›\s+(.+?)\n.*?Error:\s+(.+?)(?=\n\s*\n|\n\s*at|$)/gs;
        let match;

        while ((match = failurePattern.exec(output)) !== null && failedTests.length < 10) {
          const [, filePath, testName, error] = match;
          const lineMatch = filePath.match(/:(\d+):/);
          const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

          failedTests.push({
            name: testName.trim(),
            file: filePath.replace(/:\d+:\d+$/, '').trim(),
            line,
            error: error.trim(),
          });
        }
      }

      return {
        summary,
        duration: duration || 0,
        coverage,
        failedTests,
      };
    } catch (error) {
      logger.error('Failed to parse test output:', error);
      return null;
    }
  }
}

