/**
 * Claude Code Service Types
 *
 * Type definitions for the Claude Code on Daytona integration.
 */

/**
 * Workspace state enum matching Daytona states
 */
export enum WorkspaceState {
  CREATING = 'creating',
  STARTING = 'starting',
  READY = 'ready',
  GENERATING = 'generating',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Workspace info returned by workspace management operations
 */
export interface WorkspaceInfo {
  workspaceId: string;
  sandboxId: string;
  projectId: string;
  state: WorkspaceState;
  createdAt: Date;
  previewUrl?: string;
}

/**
 * Options for creating a workspace
 */
export interface CreateWorkspaceOptions {
  projectId: string;
  templateId?: string;
  timeout?: number; // in seconds
}

/**
 * Result from workspace creation
 */
export interface CreateWorkspaceResult {
  success: boolean;
  workspace?: WorkspaceInfo;
  error?: string;
}

/**
 * Generation request parameters
 */
export interface GenerationRequest {
  workspaceId: string;
  prompt: string;
  contextFile?: string; // Path to CONTEXT.md in the workspace
  model?: string; // Claude model to use
  maxTurns?: number; // Max agentic turns
}

/**
 * Generation progress event
 */
export interface GenerationProgressEvent {
  type: 'start' | 'thinking' | 'tool_use' | 'output' | 'complete' | 'error';
  message?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  output?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  output?: string;
  filesChanged?: string[];
  error?: string;
  duration?: number; // in ms
}

/**
 * Context data for building CONTEXT.md
 */
export interface ContextData {
  // Business info
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  industry?: string;
  targetAudience?: string;

  // Client info
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWebsite?: string;

  // Project info
  projectId: string;
  projectName?: string;
  templateId?: string;
  templateName?: string;

  // Chat history
  chatHistory?: ChatMessage[];

  // Additional context
  additionalInstructions?: string;
  designPreferences?: DesignPreferences;
  existingContent?: ExistingContent;
}

/**
 * Chat message for context
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

/**
 * Design preferences from onboarding
 */
export interface DesignPreferences {
  colorScheme?: string;
  style?: string;
  mood?: string;
  inspirationUrls?: string[];
}

/**
 * Existing content to preserve/incorporate
 */
export interface ExistingContent {
  logo?: string;
  images?: string[];
  copy?: string;
  socialLinks?: Record<string, string>;
}

/**
 * Environment configuration for Claude Code
 */
export interface ClaudeCodeEnv {
  ANTHROPIC_API_KEY?: string;
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

/**
 * Workspace lifecycle hooks
 */
export interface WorkspaceLifecycleHooks {
  onCreating?: (projectId: string) => void;
  onReady?: (workspace: WorkspaceInfo) => void;
  onGenerating?: (workspace: WorkspaceInfo, prompt: string) => void;
  onComplete?: (workspace: WorkspaceInfo, result: GenerationResult) => void;
  onError?: (workspace: WorkspaceInfo | null, error: Error) => void;
}

/**
 * Claude Code CLI execution options
 */
export interface ClaudeCodeExecOptions {
  prompt: string;
  contextFile?: string;
  workDir?: string;
  model?: string;
  maxTurns?: number;
  allowedTools?: string[];
  disallowedTools?: string[];
  timeout?: number; // in seconds
}

/**
 * Stream chunk from Claude Code output
 */
export interface StreamChunk {
  type: 'stdout' | 'stderr' | 'exit';
  data?: string;
  exitCode?: number;
}
