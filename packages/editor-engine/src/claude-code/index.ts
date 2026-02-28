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
  IntegrationData,
  ContactDetails,
  DomainInfo,
  BillingInfo,
  FileInfo,
  ClaudeCodeEnv,
  WorkspaceLifecycleHooks,
  ClaudeCodeExecOptions,
  StreamChunk,
} from './types';

// CLI
export {
  buildCommand,
  runClaudeCodeInSandbox,
  cancelClaudeCode,
  isClaudeCodeAvailable,
  getClaudeCodeVersion,
  parseChangedFiles,
  createStreamChunk,
} from './cli';

// Context Builder
export {
  CONTEXT_FILE_PATH,
  buildContextMarkdown,
  writeContextFile,
  readContextFile,
  buildContextFromConvex,
} from './context-builder';

// System Prompt
export {
  FRONTEND_DESIGN_SKILL,
  buildPromptWithContext,
} from './system-prompt';

// SSE Stream
export type { SSEEvent } from './stream';
export {
  encodeSSE,
  encodeSSEDone,
  sseHeaders,
  streamOutput,
} from './stream';
