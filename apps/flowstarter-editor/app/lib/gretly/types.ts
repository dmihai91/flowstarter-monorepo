/**
 * Gretly Types
 *
 * Type definitions for the Gretly orchestrator.
 */

/*
 * ============================================================================
 * Phase Types
 * ============================================================================
 */

export type GretlyPhase =
  | 'idle'
  | 'planning'
  | 'generating'
  | 'building'
  | 'fixing'
  | 'reviewing'
  | 'refining'
  | 'escalating'
  | 'publishing'
  | 'complete'
  | 'failed';

/*
 * ============================================================================
 * Input Types
 * ============================================================================
 */

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

export interface DesignInfo {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface GretlyInput {
  projectId: string;
  businessInfo: BusinessInfo;
  template: TemplateInfo;
  design?: DesignInfo;
}

/*
 * ============================================================================
 * Configuration Types
 * ============================================================================
 */

export interface GretlyConfig {
  /** Maximum self-healing attempts per build */
  maxFixAttempts?: number;

  /** Maximum review-refine iterations */
  maxRefineIterations?: number;

  /** Minimum review score to approve (1-10) */
  approvalThreshold?: number;

  /** Skip master review (for testing/speed) */
  skipReview?: boolean;

  /** Progress callback */
  onProgress?: (phase: GretlyPhase, message: string, progress?: number) => void;

  /** Phase change callback */
  onPhaseChange?: (phase: GretlyPhase) => void;

  /** Optional data fetcher for loading project/template data */
  dataFetcher?: GretlyDataFetcher;
}

/**
 * Optional data fetcher for Gretly to load project data from external sources.
 * If provided, Gretly will call these to get the latest data before planning.
 */
export interface GretlyDataFetcher {
  /** Fetch business info from database (e.g., Convex) */
  fetchBusinessInfo?: (projectId: string) => Promise<BusinessInfo | null>;

  /** Fetch template info including its files */
  fetchTemplate?: (templateSlug: string) => Promise<{
    info: TemplateInfo;
    files: Record<string, string>;
  } | null>;

  /** Fetch existing project files (for refinement) */
  fetchProjectFiles?: (projectId: string) => Promise<Record<string, string>>;
}

/*
 * ============================================================================
 * Result Types
 * ============================================================================
 */

export interface GretlyResult {
  success: boolean;
  files: Record<string, string>;
  phases: GretlyPhase[];
  fixAttempts: number;
  refineIterations: number;
  reviewScore?: number;
  reviewSummary?: string;
  previewUrl?: string;
  sandboxId?: string;
  error?: string;

  /** Escalation info if user intervention needed */
  escalation?: import('~/lib/flowstarter/agents/planner-agent').EscalateResultDTO;
}

/*
 * ============================================================================
 * Internal Types
 * ============================================================================
 */

export interface ErrorHistoryEntry {
  file: string;
  error: string;
  fixAttempts: number;
  lastFixSummary?: string;
}

export type ResolvedConfig = Required<Omit<GretlyConfig, 'onProgress' | 'onPhaseChange' | 'dataFetcher'>> & GretlyConfig;
