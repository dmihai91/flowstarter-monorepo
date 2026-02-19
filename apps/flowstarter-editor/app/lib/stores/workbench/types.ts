/**
 * Workbench Types
 *
 * Shared types and interfaces for the workbench store modules.
 */

import type { FileAction } from '~/types/actions';

// ─── Artifact State Types ────────────────────────────────────────────────────

export interface ArtifactState {
  id: string;
  title: string;
  type?: string;
  closed: boolean;
  runner: import('~/lib/runtime/action-runner').ActionRunner;
}

export interface ThinkingArtifactState {
  id: string;
  title: string;
  type: 'thinking';
  closed: boolean;
  steps: string[];
  content: string;
}

export interface TestArtifactState {
  id: string;
  title: string;
  type: 'test';
  closed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  duration: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  failedTests?: Array<{
    name: string;
    file: string;
    line: number;
    error: string;
    stack?: string;
  }>;
  command: string;
  status: 'running' | 'complete' | 'failed';
  timestamp: string;
}

// ─── Update State Types ──────────────────────────────────────────────────────

export type ArtifactUpdateState = Pick<ArtifactState, 'title' | 'closed'>;
export type ThinkingArtifactUpdateState = Pick<ThinkingArtifactState, 'title' | 'closed'>;
export type TestArtifactUpdateState = Pick<
  TestArtifactState,
  'title' | 'closed' | 'status' | 'summary' | 'duration' | 'coverage' | 'failedTests'
>;

// ─── Workbench View Types ────────────────────────────────────────────────────

export type WorkbenchViewType = 'code' | 'diff' | 'preview' | 'progress';

// ─── Pending Approval Types ──────────────────────────────────────────────────

export interface PendingApproval {
  actionId: string;
  messageId: string;
  artifactId: string;
  filePath: string;
  beforeContent: string;
  afterContent: string;
  action: FileAction;
}

// ─── Daytona Preview Types ───────────────────────────────────────────────────

export interface DaytonaPreviewState {
  url: string | null;
  sandboxId: string | null;
}

