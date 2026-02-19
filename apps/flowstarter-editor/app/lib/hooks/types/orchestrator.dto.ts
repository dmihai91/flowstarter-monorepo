/**
 * Orchestrator DTOs - Minimal types for backwards compatibility
 *
 * The custom orchestrator has been replaced with Claude Agent SDK.
 * These types are kept for backwards compatibility with existing components.
 */

// Status DTO used by EditorLayout and other components
export interface OrchestratorStatusDTO {
  phase: 'idle' | 'planning' | 'executing' | 'reviewing' | 'complete' | 'error';
  message?: string;
  progress?: number;
  currentTask?: string;
}

// WizardOutput types used by build handlers
export interface BusinessInfoDTO {
  name?: string;
  tagline?: string;
  description?: string;
  uvp?: string;
  targetAudience?: string;
  businessGoals?: string[];
  brandTone?: string;
  pricingOffers?: string;
  services?: string[];
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface PaletteSelectionDTO {
  id: string;
  name: string;
  colors: string[];
}

export interface FontSelectionDTO {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string;
}

export interface TemplateSelectionDTO {
  id: string;
  name: string;
  slug?: string;
  category?: string;
}

export interface ProjectMetaDTO {
  projectId: string;
  name: string;
  urlId: string;
  description: string;
}

export interface WizardOutputDTO {
  project: ProjectMetaDTO;
  template: TemplateSelectionDTO;
  palette: PaletteSelectionDTO;
  fonts: FontSelectionDTO;
  businessInfo?: BusinessInfoDTO;
  tier?: 'standard' | 'premium';
  sessionId?: string;
  completedAt?: number;
}

// Legacy types kept for compatibility
export type OrchestratorStateDTO = 'idle' | 'running' | 'paused' | 'complete' | 'error';
export type TaskStatusDTO = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusDTO;
  filesChanged?: number;
}

export interface PlanDTO {
  id: string;
  tasks: TaskDTO[];
  estimatedTime?: number;
}

export interface ReviewIssueDTO {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  file?: string;
  line?: number;
}

export interface ReviewDTO {
  approved: boolean;
  score?: number;
  summary?: string;
  issues?: ReviewIssueDTO[];
}

export interface PreviewDTO {
  url: string;
  status: 'starting' | 'ready' | 'error';
}

export interface ProgressDTO {
  phase: string;
  message: string;
  progress?: number;
}

export interface OrchestratorEventTypeDTO {
  type: string;
}

export interface OrchestratorEventDTO {
  type: string;
  data?: unknown;
}

export interface UseOrchestratorOptionsDTO {
  onProgress?: (progress: ProgressDTO) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface UseOrchestratorReturnDTO {
  status: OrchestratorStatusDTO;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

// Build DTOs
export type ModelTierDTO = 'standard' | 'premium';

export interface BuildErrorDTO {
  message: string;
  file?: string;
  line?: number;
}

export interface BuildProgressDTO {
  phase: string;
  message: string;
  progress: number;
}

export interface BuildResultDTO {
  success: boolean;
  files?: string[];
  error?: string;
}

export interface DeploymentDTO {
  url: string;
  status: 'deploying' | 'deployed' | 'failed';
}

