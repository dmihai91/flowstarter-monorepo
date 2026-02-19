/**
 * Workbench Store
 *
 * This file re-exports from the refactored workbench module.
 * The workbench store has been split into smaller, maintainable modules:
 *
 * - workbench/types.ts: Type definitions (~80 lines)
 * - workbench/artifacts.ts: Artifact management (~200 lines)
 * - workbench/actions.ts: Action execution (~220 lines)
 * - workbench/github.ts: GitHub integration (~240 lines)
 * - workbench/download.ts: Download/sync utilities (~80 lines)
 * - workbench/index.ts: Main store (~400 lines)
 *
 * @see ./workbench/index.ts for the main implementation
 */

export {
  WorkbenchStore,
  workbenchStore,
  type ArtifactState,
  type ArtifactUpdateState,
  type TestArtifactState,
  type TestArtifactUpdateState,
  type ThinkingArtifactState,
  type ThinkingArtifactUpdateState,
  type WorkbenchViewType,
  type DaytonaPreviewState,
  type PendingApproval,
} from './workbench/index';

