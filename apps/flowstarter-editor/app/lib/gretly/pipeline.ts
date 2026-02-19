/**
 * Gretly Pipeline
 *
 * Deterministic execution pipeline for site generation:
 *
 * 1. PLAN      - Strategic modification planning
 * 2. GENERATE  - Execute modifications via agent
 * 3. VALIDATE  - Fast typecheck/syntax validation
 * 4. BUILD     - Build with self-healing loop
 * 5. REVIEW    - Master LLM review against requirements
 * 6. REFINE    - If review fails, regenerate with feedback
 * 7. PUBLISH   - Persist and deploy
 *
 * Each phase has clear entry/exit criteria and can loop back if needed.
 */

import { createScopedLogger } from '~/utils/logger';
import { getAgentRegistry } from '~/lib/flowops';
import { getFixerAgent } from '~/lib/flowstarter/agents/fixer-agent';
import { getReviewerAgent, type ReviewResultDTO, ReviewRequestSchema } from '~/lib/flowstarter/agents/reviewer-agent';
import { Gretly, type GretlyResult, type BuildResult } from './builder';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

const logger = createScopedLogger('Gretly:Pipeline');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

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
  modifications: Array<{
    path: string;
    instructions: string;
  }>;
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

/*
 * ============================================================================
 * Pipeline Implementation
 * ============================================================================
 */

/**
 * Deterministic pipeline for site generation with master review.
 *
 * Flow:
 * ```
 * PLAN → GENERATE → VALIDATE → BUILD → REVIEW
 *                                 ↓
 *                     [score < threshold]
 *                                 ↓
 *                              REFINE ←─┐
 *                                 ↓      │
 *                             GENERATE   │
 *                                 ↓      │
 *                              BUILD     │
 *                                 ↓      │
 *                              REVIEW ───┘
 *                                 ↓
 *                     [score >= threshold]
 *                                 ↓
 *                             PUBLISH → COMPLETE
 * ```
 */
export class Pipeline {
  private config: Required<Omit<PipelineConfig, 'onProgress' | 'onPhaseChange' | 'onReviewResult'>> & PipelineConfig;
  private currentPhase: PipelinePhase = 'idle';
  private phases: PipelinePhase[] = [];
  private gretly: Gretly;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      maxRefineIterations: config.maxRefineIterations ?? 2,
      maxBuildAttempts: config.maxBuildAttempts ?? 3,
      approvalThreshold: config.approvalThreshold ?? 7,
      enableTypecheck: config.enableTypecheck ?? true,
      skipReview: config.skipReview ?? false,
      ...config,
    };

    // Initialize Gretly for build orchestration
    this.gretly = new Gretly({
      maxAttempts: this.config.maxBuildAttempts,
      enableTypecheck: this.config.enableTypecheck,
      onProgress: (phase, message, progress) => {
        // Forward Gretly progress to pipeline
        this.config.onProgress?.('building', `[${phase}] ${message}`, progress);
      },
    });

    // Ensure agents are registered
    const agentRegistry = getAgentRegistry();

    if (!agentRegistry.has('fixer')) {
      agentRegistry.register(getFixerAgent());
    }

    if (!agentRegistry.has('reviewer')) {
      agentRegistry.register(getReviewerAgent(this.config.approvalThreshold));
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Public API
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get current phase.
   */
  getPhase(): PipelinePhase {
    return this.currentPhase;
  }

  /**
   * Run the complete pipeline.
   *
   * @param projectId - Project identifier
   * @param businessInfo - Business requirements
   * @param template - Template to customize
   * @param planFn - Function to generate modification plan
   * @param generateFn - Function to generate files from plan
   * @param buildFn - Function to build and get preview
   * @param publishFn - Function to persist/publish final files
   */
  async run(
    projectId: string,
    businessInfo: BusinessInfo,
    template: TemplateInfo,
    planFn: (businessInfo: BusinessInfo, template: TemplateInfo) => Promise<PlanResult>,
    generateFn: (
      plan: PlanResult,
      previousFiles?: Record<string, string>,
      feedback?: string,
    ) => Promise<GenerateResult>,
    buildFn: (projectId: string, files: Record<string, string>) => Promise<BuildResult>,
    publishFn: (projectId: string, files: Record<string, string>) => Promise<void>,
  ): Promise<PipelineResult> {
    this.phases = [];

    let refineIterations = 0;
    let planResult: PlanResult | undefined;
    let files: Record<string, string> = {};
    let buildResult: GretlyResult | undefined;
    let reviewResult: ReviewResultDTO | undefined;
    let feedback: string | undefined;

    logger.info(`Starting pipeline for project ${projectId}`);

    try {
      /*
       * ─────────────────────────────────────────────────────────────────────
       * Phase 1: PLANNING
       * ─────────────────────────────────────────────────────────────────────
       */
      this.setPhase('planning');
      this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_CREATING_PLAN), 5);

      planResult = await planFn(businessInfo, template);

      if (!planResult.success) {
        return this.fail('Planning failed', { planResult, refineIterations });
      }

      logger.info(`Plan created with ${planResult.modifications.length} modifications`);

      /*
       * ─────────────────────────────────────────────────────────────────────
       * Main loop: GENERATE → BUILD → REVIEW → (REFINE)
       * ─────────────────────────────────────────────────────────────────────
       */
      while (refineIterations <= this.config.maxRefineIterations) {
        /*
         * ───────────────────────────────────────────────────────────────────
         * Phase 2: GENERATING
         * ───────────────────────────────────────────────────────────────────
         */
        this.setPhase('generating');
        this.config.onProgress?.(
          'generating',
          refineIterations === 0
            ? t(EDITOR_LABEL_KEYS.ORCH_GENERATING_FILES)
            : t(EDITOR_LABEL_KEYS.ORCH_REFINING_SITE, { iteration: refineIterations }),
          15 + refineIterations * 10,
        );

        const generateResult = await generateFn(planResult, refineIterations > 0 ? files : undefined, feedback);

        if (!generateResult.success) {
          return this.fail('Generation failed', { planResult, refineIterations });
        }

        files = generateResult.files;
        logger.info(`Generated ${Object.keys(files).length} files`);

        /*
         * ───────────────────────────────────────────────────────────────────
         * Phase 3: VALIDATING (via Gretly typecheck)
         * ───────────────────────────────────────────────────────────────────
         */
        this.setPhase('validating');
        this.config.onProgress?.('validating', t(EDITOR_LABEL_KEYS.ORCH_VALIDATING_FILES), 30);

        // Gretly handles typecheck internally

        /*
         * ───────────────────────────────────────────────────────────────────
         * Phase 4: BUILDING (with self-healing)
         * ───────────────────────────────────────────────────────────────────
         */
        this.setPhase('building');
        this.config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_BUILDING_WITH_HEALING), 40);

        buildResult = await this.gretly.buildWithSelfHealing(projectId, files, buildFn);

        if (!buildResult.success) {
          return this.fail(t(EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED_HEALING), {
            planResult,
            buildResult,
            refineIterations,
          });
        }

        // Update files if self-healing made changes
        files = buildResult.files;
        logger.info(`Build succeeded with ${buildResult.fixAttempts} fix attempts`);

        /*
         * ───────────────────────────────────────────────────────────────────
         * Phase 5: REVIEWING (master LLM review)
         * ───────────────────────────────────────────────────────────────────
         */
        if (this.config.skipReview) {
          logger.info('Skipping review (skipReview=true)');
          break;
        }

        this.setPhase('reviewing');
        this.config.onProgress?.('reviewing', t(EDITOR_LABEL_KEYS.ORCH_RUNNING_REVIEW), 70);

        reviewResult = await this.runReview(files, businessInfo, template);
        this.config.onReviewResult?.(reviewResult);

        logger.info(`Review complete: score=${reviewResult.score}, approved=${reviewResult.approved}`);

        /*
         * ───────────────────────────────────────────────────────────────────
         * Check review result
         * ───────────────────────────────────────────────────────────────────
         */
        if (reviewResult.approved) {
          logger.info('Review approved!');
          break;
        }

        /*
         * ───────────────────────────────────────────────────────────────────
         * Phase 6: REFINING (if not approved)
         * ───────────────────────────────────────────────────────────────────
         */
        refineIterations++;

        if (refineIterations > this.config.maxRefineIterations) {
          logger.warn(t(EDITOR_LABEL_KEYS.ORCH_MAX_REFINE_REACHED, { max: this.config.maxRefineIterations }));

          // Proceed with what we have
          break;
        }

        this.setPhase('refining');
        this.config.onProgress?.(
          'refining',
          t(EDITOR_LABEL_KEYS.ORCH_REFINING_FEEDBACK, { iteration: refineIterations }),
          75,
        );

        // Build feedback string from review
        feedback = this.buildFeedback(reviewResult);
        logger.info(`Refining with feedback: ${feedback.slice(0, 200)}...`);
      }

      /*
       * ─────────────────────────────────────────────────────────────────────
       * Phase 7: PUBLISHING
       * ─────────────────────────────────────────────────────────────────────
       */
      this.setPhase('publishing');
      this.config.onProgress?.('publishing', t(EDITOR_LABEL_KEYS.ORCH_PUBLISHING_SITE), 90);

      await publishFn(projectId, files);

      /*
       * ─────────────────────────────────────────────────────────────────────
       * COMPLETE
       * ─────────────────────────────────────────────────────────────────────
       */
      this.setPhase('complete');
      this.config.onProgress?.('complete', t(EDITOR_LABEL_KEYS.ORCH_PIPELINE_COMPLETE), 100);

      return {
        success: true,
        files,
        phases: this.phases,
        planResult,
        buildResult,
        reviewResult,
        refineIterations,
      };
    } catch (error) {
      logger.error('Pipeline error:', error);
      return this.fail(error instanceof Error ? error.message : 'Unknown error', {
        planResult,
        buildResult,
        reviewResult,
        refineIterations,
      });
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Private helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private setPhase(phase: PipelinePhase): void {
    this.currentPhase = phase;
    this.phases.push(phase);
    this.config.onPhaseChange?.(phase);
    logger.debug(`Phase: ${phase}`);
  }

  private fail(error: string, partial: Partial<PipelineResult>): PipelineResult {
    this.setPhase('failed');
    return {
      success: false,
      files: partial.buildResult?.files ?? {},
      phases: this.phases,
      planResult: partial.planResult,
      buildResult: partial.buildResult,
      reviewResult: partial.reviewResult,
      refineIterations: partial.refineIterations ?? 0,
      error,
    };
  }

  private async runReview(
    files: Record<string, string>,
    businessInfo: BusinessInfo,
    template: TemplateInfo,
  ): Promise<ReviewResultDTO> {
    const agentRegistry = getAgentRegistry();

    const request = {
      files,
      businessInfo,
      template,
    };

    // Validate request
    const validation = ReviewRequestSchema.safeParse(request);

    if (!validation.success) {
      logger.error('Review request validation failed:', validation.error);
      return {
        approved: false,
        score: 0,
        confidence: 0,
        summary: t(EDITOR_LABEL_KEYS.ORCH_INVALID_REVIEW, { error: validation.error.message }),
        categoryScores: {
          requirementMatching: 0,
          completeness: 0,
          brandAlignment: 0,
          technicalQuality: 0,
          uxDesign: 0,
        },
        issues: [],
        improvements: [],
      };
    }

    const response = await agentRegistry.send('reviewer', JSON.stringify(request));

    try {
      return JSON.parse(response.message.content) as ReviewResultDTO;
    } catch {
      logger.error('Failed to parse review response');
      return {
        approved: false,
        score: 0,
        confidence: 0,
        summary: t(EDITOR_LABEL_KEYS.ORCH_FAILED_PARSE_REVIEW),
        categoryScores: {
          requirementMatching: 0,
          completeness: 0,
          brandAlignment: 0,
          technicalQuality: 0,
          uxDesign: 0,
        },
        issues: [],
        improvements: [],
      };
    }
  }

  private buildFeedback(review: ReviewResultDTO): string {
    const parts: string[] = [];

    parts.push(`Review Score: ${review.score}/10`);
    parts.push(`Summary: ${review.summary}`);

    // Add must-fix improvements
    const mustFix = review.improvements.filter((i) => i.priority === 'must-fix');

    if (mustFix.length > 0) {
      parts.push('\nMust Fix:');

      for (const imp of mustFix) {
        parts.push(`- ${imp.file}: ${imp.instruction}`);
      }
    }

    // Add critical/major issues
    const criticalIssues = review.issues.filter((i) => i.severity === 'critical' || i.severity === 'major');

    if (criticalIssues.length > 0) {
      parts.push('\nCritical Issues:');

      for (const issue of criticalIssues) {
        parts.push(`- [${issue.severity}] ${issue.description}`);

        if (issue.suggestedFix) {
          parts.push(`  Fix: ${issue.suggestedFix}`);
        }
      }
    }

    return parts.join('\n');
  }
}

/*
 * ============================================================================
 * Convenience export
 * ============================================================================
 */

/**
 * Create a new Pipeline instance.
 */
export function createPipeline(config?: PipelineConfig): Pipeline {
  return new Pipeline(config);
}

