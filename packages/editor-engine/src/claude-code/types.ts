/**
 * Claude Code Service Types
 *
 * Type definitions for the Claude Code on Daytona integration.
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

export interface WorkspaceInfo {
  workspaceId: string;
  sandboxId: string;
  projectId: string;
  state: WorkspaceState;
  createdAt: Date;
  previewUrl?: string;
}

export interface CreateWorkspaceOptions {
  projectId: string;
  templateId?: string;
  timeout?: number;
}

export interface CreateWorkspaceResult {
  success: boolean;
  workspace?: WorkspaceInfo;
  error?: string;
}

export interface GenerationRequest {
  workspaceId: string;
  prompt: string;
  contextFile?: string;
  model?: string;
  maxTurns?: number;
}

export interface GenerationProgressEvent {
  type: 'start' | 'thinking' | 'tool_use' | 'output' | 'complete' | 'error';
  message?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  output?: string;
  error?: string;
  timestamp: Date;
}

export interface GenerationResult {
  success: boolean;
  output?: string;
  filesChanged?: string[];
  error?: string;
  duration?: number;
}

export interface ContextData {
  projectId: string;
  projectName?: string;
  templateId?: string;
  templateName?: string;

  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  industry?: string;
  targetAudience?: string;

  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWebsite?: string;

  chatHistory?: ChatMessage[];

  additionalInstructions?: string;
  designPreferences?: DesignPreferences;
  existingContent?: ExistingContent;

  // Extended fields (Phase 4)
  integrations?: IntegrationData;
  contactDetails?: ContactDetails;
  domainInfo?: DomainInfo;
  billingInfo?: BillingInfo;
  currentFiles?: FileInfo[];
  locale?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface DesignPreferences {
  colorScheme?: string;
  style?: string;
  mood?: string;
  inspirationUrls?: string[];
  palette?: string;
  fonts?: { heading?: string; body?: string };
}

export interface ExistingContent {
  logo?: string;
  images?: string[];
  copy?: string;
  socialLinks?: Record<string, string>;
}

export interface IntegrationData {
  bookingProvider?: string;
  bookingUrl?: string;
  newsletterProvider?: string;
  newsletterUrl?: string;
}

export interface ContactDetails {
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: Record<string, string>;
}

export interface DomainInfo {
  domainType?: string;
  domainName?: string;
  domainProvider?: string;
}

export interface BillingInfo {
  setupFee?: number;
  monthlyFee?: number;
  isPaid?: boolean;
}

export interface FileInfo {
  path: string;
  lastModified?: number;
}

export interface ClaudeCodeEnv {
  ANTHROPIC_API_KEY?: string;
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

export interface WorkspaceLifecycleHooks {
  onCreating?: (projectId: string) => void;
  onReady?: (workspace: WorkspaceInfo) => void;
  onGenerating?: (workspace: WorkspaceInfo, prompt: string) => void;
  onComplete?: (workspace: WorkspaceInfo, result: GenerationResult) => void;
  onError?: (workspace: WorkspaceInfo | null, error: Error) => void;
}

export interface ClaudeCodeExecOptions {
  prompt: string;
  contextFile?: string;
  workDir?: string;
  model?: string;
  maxTurns?: number;
  allowedTools?: string[];
  disallowedTools?: string[];
  timeout?: number;
}

export interface StreamChunk {
  type: 'stdout' | 'stderr' | 'exit';
  data?: string;
  exitCode?: number;
}
