/**
 * Claude Code Service
 *
 * Re-exports shared types and utilities from @flowstarter/editor-engine,
 * plus app-specific workspace management from the local workspaceManager.
 */

// Shared types & utilities from editor-engine
export type {
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
} from '@flowstarter/editor-engine';

export { WorkspaceState } from './types';

export {
  buildCommand,
  runClaudeCodeInSandbox,
  cancelClaudeCode,
  isClaudeCodeAvailable,
  getClaudeCodeVersion,
  parseChangedFiles,
  CONTEXT_FILE_PATH,
  buildContextMarkdown,
  readContextFile,
  buildContextFromConvex,
  FRONTEND_DESIGN_SKILL,
  buildPromptWithContext,
  encodeSSE,
  encodeSSEDone,
  sseHeaders,
  streamOutput as streamSSEOutput,
} from '@flowstarter/editor-engine';

// App-specific workspace management (uses local logger + workspaceManager)
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

// Local CLI (uses local workspace manager)
export {
  runClaudeCode,
  streamOutput,
  cancelGeneration,
} from './cliInterface';

// Local context builder (uses local workspace manager + accepts workspaceId)
export {
  writeContextFile,
  updateContextFile,
} from './contextBuilder';
