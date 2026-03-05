/**
 * Pipeline Type Definitions
 */

import type { ReviewResultDTO } from '~/lib/flowstarter/agents/reviewer-agent';
import type { GretlyResult } from './builder';

export type PipelinePhase =
  | 'idle'
  | 'planning'
  | 'generating'
  | 'validating'
  | 'building'
  | 'reviewing'
  | 'refining'
  | 'publishing'
  | 'complete'
  | 'failed';

export interface BusinessInfo {
  name: string;
  description?: string;
  tagline?: string;
  services?: string[];
  targetAudience?: string;
  businessGoals?: string[];
  brandTone?: string;
}

export interface TemplateInfo {
  slug: string;
  name: string;
}

export interface PipelineConfig {
  /** Maximum review-refine iterations */
  maxRefineIterations?: number;
  /** Maximum build self-heal attempts */
  maxBuildAttempts?: number;
  /** Minimum review score to approve (1-10) */
  approvalThreshold?: number;
  /** Enable fast typecheck before build */
  enableTypecheck?: boolean;
  /** Skip master review (for testing) */
  skipReview?: boolean;
  /** Progress callback */
  onProgress?: (phase: PipelinePhase, message: string, progress?: number) => void;
  /** Phase change callback */
  onPhaseChange?: (phase: PipelinePhase) => void;
  /** Review result callback */
  onReviewResult?: (result: ReviewResultDTO) => void;
}

export interface PlanResult {
  success: boolean;
  modifications: Array<{ path: string; instructions: string }>;
  error?: string;
}

export interface GenerateResult {
  success: boolean;
  files: Record<string, string>;
  error?: string;
}

export interface PipelineResult {
  success: boolean;
  files: Record<string, string>;
  phases: PipelinePhase[];
  planResult?: PlanResult;
  buildResult?: GretlyResult;
  reviewResult?: ReviewResultDTO;
  refineIterations: number;
  error?: string;
}
