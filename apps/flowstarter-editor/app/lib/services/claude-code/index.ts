/**
 * Claude Code Service
 *
 * Main entry point for the Claude Code on Daytona integration.
 * Provides a unified API for workspace management, code generation,
 * and context building.
 *
 * Usage:
 * ```typescript
 * import {
 *   createWorkspace,
 *   runClaudeCode,
 *   writeContextFile,
 *   destroyWorkspace
 * } from '~/lib/services/claude-code';
 *
 * // Create workspace
 * const { workspace } = await createWorkspace({ projectId: 'abc123' });
 *
 * // Write context
 * await writeContextFile(workspace.workspaceId, contextData);
 *
 * // Run Claude Code
 * const result = await runClaudeCode({
 *   workspaceId: workspace.workspaceId,
 *   prompt: 'Update the hero section...',
 *   contextFile: '/workspace/CONTEXT.md'
 * });
 *
 * // Clean up
 * await destroyWorkspace(workspace.workspaceId);
 * ```
 */

// Types
export type {
  WorkspaceState,
  WorkspaceInfo,
  CreateWorkspaceOptions,
  CreateWorkspaceResult,
  GenerationRequest,
  GenerationProgressEvent,
  GenerationResult,
  ContextData,
  ChatMessage,
  DesignPreferences,
  ExistingContent,
  ClaudeCodeEnv,
  WorkspaceLifecycleHooks,
  ClaudeCodeExecOptions,
  StreamChunk,
} from './types';

// Workspace Management
export {
  createWorkspace,
  destroyWorkspace,
  getWorkspaceStatus,
  getSandbox,
  ensureWorkspaceRunning,
  listWorkspaces,
  findWorkspaceByProject,
  clearRegistry,
} from './workspaceManager';

// Claude Code CLI
export {
  runClaudeCode,
  streamOutput,
  cancelGeneration,
  isClaudeCodeAvailable,
  getClaudeCodeVersion,
} from './cliInterface';

// Context Building
export {
  CONTEXT_FILE_PATH,
  buildContextMarkdown,
  writeContextFile,
  readContextFile,
  updateContextFile,
  buildContextFromConvex,
} from './contextBuilder';
