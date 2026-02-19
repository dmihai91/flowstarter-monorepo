/**
 * Agent DTOs - Editor-friendly types for agent execution hook
 *
 * These types form the boundary between the editor layer and the agent service.
 * Components should only use these types, never import from services directly.
 */

// ─── File Types ──────────────────────────────────────────────────────────────

export interface AgentFileResultDTO {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

// ─── Progress Types ──────────────────────────────────────────────────────────

export type AgentPhaseDTO =
  | 'idle'
  | 'starting'
  | 'classifying'
  | 'planning'
  | 'planned'
  | 'executing'
  | 'reviewing'
  | 'reviewed'
  | 'writing_files'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface AgentProgressDTO {
  phase: AgentPhaseDTO;
  message?: string;
  progress?: number;
  taskIndex?: number;
  taskCount?: number;
}

// ─── Plan Types ──────────────────────────────────────────────────────────────

export interface AgentPlanDTO {
  summary: string;
  taskCount: number;
}

// ─── Review Types ────────────────────────────────────────────────────────────

export interface AgentReviewDTO {
  approved: boolean;
  issueCount: number;
  summary?: string;
}

// ─── State ───────────────────────────────────────────────────────────────────

export interface AgentExecutionStateDTO {
  isRunning: boolean;
  phase: AgentPhaseDTO;
  progress: number;
  currentTask?: string;
  error?: string;
  filesGenerated: number;
  plan?: AgentPlanDTO;
  review?: AgentReviewDTO;
}

// ─── Event Types ─────────────────────────────────────────────────────────────

export type AgentEventTypeDTO = 'plan' | 'task_start' | 'task_complete' | 'review' | 'error' | 'done';

export interface AgentEventDTO {
  type: AgentEventTypeDTO;
  timestamp: number;
  data: Record<string, unknown>;
}

// ─── Context Types (for building project context) ────────────────────────────

export interface AgentDesignSchemeDTO {
  palette?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  fonts?: string[];
  borderRadius?: string;
  shadow?: string;
  spacing?: string;
  theme?: string;
  features?: string[];
}

export interface AgentProjectDetailsDTO {
  title: string;
  description?: string;
  uvp?: string;
  businessGoals?: string[];
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'playful' | 'technical';
}

export interface AgentProjectContextDTO {
  templateId: string;
  templateFiles: Record<string, string>;
  designScheme?: AgentDesignSchemeDTO;
  projectDetails?: AgentProjectDetailsDTO;
}

// ─── Hook Options ────────────────────────────────────────────────────────────

export interface UseAgentExecutionOptionsDTO {
  /**
   * Called for each progress event from the agent
   */
  onProgress?: (event: AgentEventDTO) => void;

  /**
   * Called when a file is generated (for incremental file writing)
   * Consumer is responsible for writing to storage
   */
  onFileGenerated?: (file: AgentFileResultDTO) => void;

  /**
   * Called when agent execution completes
   * Consumer receives all generated files and decides what to do with them
   */
  onComplete?: (files: AgentFileResultDTO[]) => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: string) => void;
}

// ─── Hook Return Type ────────────────────────────────────────────────────────

export interface UseAgentExecutionReturnDTO {
  state: AgentExecutionStateDTO;
  execute: (
    context: AgentProjectContextDTO,
    userRequest: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    forceAgent?: 'daytona',
  ) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

