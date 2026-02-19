/**
 * Flowstarter Service
 *
 * High-level service that integrates:
 * - Gretly orchestrator (agent coordination)
 * - Daytona (sandbox builds and preview)
 * - Convex (persistence)
 *
 * This is the main entry point for site generation with full pipeline support.
 */

import {
  createGretly,
  type GretlyInput,
  type GretlyResult,
  type GretlyConfig,
  type BusinessInfo,
  type TemplateInfo,
  type DesignInfo,
} from '~/lib/gretly/gretlyEngine';
import {
  startPreview,
  prewarmSandbox,
  startPreviewWithPrewarmedSandbox,
  type PreviewResult,
  type PrewarmedSandbox,
} from '~/lib/services/daytonaService.server';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import { createScopedLogger } from '~/utils/logger';
import { fetchTemplateScaffold } from '~/lib/services/templateService';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

const logger = createScopedLogger('Flowstarter');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface FlowstarterInput {
  projectId: string;
  siteName: string;
  businessInfo: BusinessInfo;
  template: TemplateInfo & {
    files?: Record<string, string>;
  };
  design?: DesignInfo;
}

export interface FlowstarterProgress {
  phase: string;
  message: string;
  progress?: number;
}

export interface FlowstarterResult {
  success: boolean;
  files: Record<string, string>;
  previewUrl?: string;
  sandboxId?: string;
  reviewScore?: number;
  reviewSummary?: string;
  fixAttempts: number;
  refineIterations: number;
  phases: string[];
  error?: string;
}

export interface FlowstarterOptions {
  /** Skip the review phase (faster, less quality control) */
  skipReview?: boolean;

  /** Maximum self-healing attempts per build */
  maxFixAttempts?: number;

  /** Maximum review-refine iterations */
  maxRefineIterations?: number;

  /** Minimum review score to approve (1-10) */
  approvalThreshold?: number;

  /** Progress callback for streaming updates */
  onProgress?: (progress: FlowstarterProgress) => void;

  /** Pre-warmed sandbox from parallel initialization */
  prewarmedSandbox?: PrewarmedSandbox | null;
}

/*
 * ============================================================================
 * Flowstarter Service
 * ============================================================================
 */

/**
 * Generate a site using the full Gretly pipeline.
 *
 * This integrates:
 * 1. Gretly orchestrator for agent coordination
 * 2. Daytona for real builds and preview
 * 3. Self-healing via FixerAgent
 *
 * Pipeline: PLAN É≈' GENERATE É≈' BUILD É≈' FIX É≈' REVIEW É≈' REFINE É≈' PUBLISH
 */
export async function generateSite(
  input: FlowstarterInput,
  options: FlowstarterOptions = {},
): Promise<FlowstarterResult> {
  const startTime = Date.now();
  logger.info(`Starting site generation for ${input.projectId}`);

  const {
    skipReview = false,
    maxFixAttempts = 10,
    maxRefineIterations = 2,
    approvalThreshold = 7,
    onProgress,
    prewarmedSandbox,
  } = options;

  // Configure Gretly with template fetcher
  const gretlyConfig: GretlyConfig = {
    skipReview,
    maxFixAttempts,
    dataFetcher: {
      fetchTemplate: async (slug: string) => {
        try {
          const files = await fetchTemplateScaffold(slug);
          const filesRecord: Record<string, string> = {};
          for (const f of files) {
            filesRecord[f.path] = f.content;
          }
          return {
            info: { slug, name: slug },
            files: filesRecord,
          };
        } catch (e) {
          logger.warn(`Failed to fetch template ${slug}:`, e);
          return null;
        }
      },
    },
    maxRefineIterations,
    approvalThreshold,
    onProgress: (phase, message, progress) => {
      onProgress?.({ phase, message, progress });
    },
    onPhaseChange: (phase) => {
      logger.debug(`Phase changed to: ${phase}`);
    },
  };

  // Create orchestrator
  const gretly = createGretly(gretlyConfig);

  // Prepare input for Gretly
  const gretlyInput: GretlyInput = {
    projectId: input.projectId,
    businessInfo: input.businessInfo,
    template: {
      slug: input.template.slug,
      name: input.template.name,
    },
    design: input.design,
  };

  // Track if we're using a pre-warmed sandbox
  let activeSandbox = prewarmedSandbox;

  // Build function - uses Daytona to build and get preview
  const buildFn = async (
    projectId: string,
    files: Record<string, string>,
  ): Promise<{
    success: boolean;
    error?: string;
    buildError?: BuildErrorDTO;
    previewUrl?: string;
    sandboxId?: string;
  }> => {
    logger.debug(`Building project ${projectId} with ${Object.keys(files).length} files`);
    onProgress?.({ phase: 'building', message: t(EDITOR_LABEL_KEYS.ORCH_STARTING_PREVIEW), progress: 40 });

    let previewResult: PreviewResult;

    if (activeSandbox) {
      // Use pre-warmed sandbox
      previewResult = await startPreviewWithPrewarmedSandbox(projectId, files, activeSandbox);

      // Clear so we don't reuse on retry
      activeSandbox = null;
    } else {
      // Start fresh preview
      previewResult = await startPreview(projectId, files);
    }

    if (!previewResult.success) {
      logger.warn(`Build failed: ${previewResult.error}`);

      // Extract build error if available
      if (previewResult.buildError) {
        return {
          success: false,
          error: previewResult.error,
          buildError: {
            file: previewResult.buildError.file,
            line: previewResult.buildError.line,
            message: previewResult.buildError.message,
            fullOutput: previewResult.buildError.fullOutput,
          },
        };
      }

      return {
        success: false,
        error: previewResult.error,
      };
    }

    logger.info(`Build succeeded: ${previewResult.previewUrl}`);

    return {
      success: true,
      previewUrl: previewResult.previewUrl,
      sandboxId: previewResult.sandboxId,
    };
  };

  // Publish function - currently just logs (could save to Convex, deploy to CDN, etc.)
  const publishFn = async (projectId: string, files: Record<string, string>): Promise<void> => {
    logger.info(`Publishing ${Object.keys(files).length} files for project ${projectId}`);
    onProgress?.({ phase: 'publishing', message: 'Finalizing site...', progress: 95 });

    // TODO: Could save to Convex, deploy to CDN, etc.
  };

  try {
    // Run the Gretly pipeline
    const result = await gretly.run(gretlyInput, buildFn, publishFn);

    const elapsed = Date.now() - startTime;
    logger.info(`Site generation completed in ${elapsed}ms (success=${result.success})`);

    return {
      success: result.success,
      files: result.files,
      previewUrl: result.previewUrl,
      sandboxId: result.sandboxId,
      reviewScore: result.reviewScore,
      reviewSummary: result.reviewSummary,
      fixAttempts: result.fixAttempts,
      refineIterations: result.refineIterations,
      phases: result.phases,
      error: result.error,
    };
  } catch (error) {
    logger.error('Site generation failed:', error);
    return {
      success: false,
      files: {},
      fixAttempts: 0,
      refineIterations: 0,
      phases: ['failed'],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pre-warm a sandbox for faster site generation.
 * Call this in parallel with data collection to save 30-60s.
 */
export async function prewarmEnvironment(projectId: string): Promise<PrewarmedSandbox | null> {
  logger.debug(`Pre-warming sandbox for ${projectId}`);
  return prewarmSandbox(projectId);
}

/**
 * Quick site generation without the full review cycle.
 * Useful for rapid prototyping or when quality is less critical.
 */
export async function generateSiteQuick(
  input: FlowstarterInput,
  options: Omit<FlowstarterOptions, 'skipReview' | 'maxRefineIterations'> = {},
): Promise<FlowstarterResult> {
  return generateSite(input, {
    ...options,
    skipReview: true,
    maxRefineIterations: 0,
  });
}

/*
 * ============================================================================
 * Re-exports for convenience
 * ============================================================================
 */

export type { BusinessInfo, TemplateInfo, DesignInfo, GretlyResult } from '~/lib/gretly/gretlyEngine';
export type { PrewarmedSandbox } from '~/lib/services/daytonaService.server';



