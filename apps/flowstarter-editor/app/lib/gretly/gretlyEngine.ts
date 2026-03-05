/**
 * Gretly Orchestrator - Three-tier agent architecture
 *
 * Flow: PLAN → GENERATE → BUILD → FIX (loop) → REVIEW → REFINE (loop) → PUBLISH
 * See gretly-phases.ts for phase execution functions.
 */

import { createScopedLogger } from '~/utils/logger';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import type { PlanResultDTO, ReviewResultDTO } from '~/lib/flowstarter/agents/planner-agent';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import type { GretlyPhase, GretlyConfig, GretlyInput, GretlyResult, ResolvedConfig, ErrorHistoryEntry } from './types';
import { registerAgents, callPlannerAgent, callPlannerAgentReview } from './agent-communication';
import { fetchData, executeGeneration, executeBuildWithFixing, handleEscalation } from './gretly-phases';

export type { GretlyPhase, GretlyConfig, GretlyInput, GretlyResult, BusinessInfo, TemplateInfo, DesignInfo, GretlyDataFetcher } from './types';

const logger = createScopedLogger('Gretly');

/**
 * Gretly - Master Orchestrator with Three-Tier Agent Architecture.
 * Phase execution is delegated to standalone functions in gretly-phases.ts.
 */
export class Gretly {
  private config: ResolvedConfig;
  private currentPhase: GretlyPhase = 'idle';
  private phases: GretlyPhase[] = [];

  constructor(config: GretlyConfig = {}) {
    this.config = {
      maxFixAttempts: config.maxFixAttempts ?? 10,
      maxRefineIterations: config.maxRefineIterations ?? 2,
      approvalThreshold: config.approvalThreshold ?? 7,
      skipReview: config.skipReview ?? false,
      ...config,
    };

    // Register agents with FlowOps
    registerAgents(this.config.approvalThreshold);
    logger.info(`Gretly config: maxFixAttempts=${this.config.maxFixAttempts}, maxRefineIterations=${this.config.maxRefineIterations}`);
  }

  /**
   * Get current phase.
   */
  getPhase(): GretlyPhase {
    return this.currentPhase;
  }

  /**
   * Run the complete Gretly pipeline with three-tier agent architecture.
   *
   * Flow:
   * 1. PLAN - GretlyAgent (Opus 4.6) creates modification plan
   * 2. GENERATE - CodeGeneratorAgent (Kimi K2.5) generates files
   * 3. BUILD - Daytona builds the site
   * 4. FIX - FixerAgent (Sonnet 4) fixes build errors with fresh perspective
   * 5. REVIEW - GretlyAgent reviews against requirements
   * 6. REFINE - CodeGeneratorAgent regenerates based on feedback
   * 7. ESCALATE - If max retries exceeded, escalate to user
   * 8. PUBLISH - Save and deploy
   */
  async run(
    input: GretlyInput,
    buildFn: (
      projectId: string,
      files: Record<string, string>,
    ) => Promise<{
      success: boolean;
      error?: string;
      buildError?: BuildErrorDTO;
      previewUrl?: string;
      sandboxId?: string;
    }>,
    publishFn: (projectId: string, files: Record<string, string>) => Promise<void>,
  ): Promise<GretlyResult> {
    this.phases = [];

    let files: Record<string, string> = {};
    let fixAttempts = 0;
    let refineIterations = 0;
    let plan: PlanResultDTO | null = null;
    let review: ReviewResultDTO | null = null;
    const errorHistory: ErrorHistoryEntry[] = [];

    logger.info(`Starting Gretly for project ${input.projectId}`);

    let resolvedInput = input;
    let templateFiles: Record<string, string> = {};

    try {
      if (this.config.dataFetcher) {
        const fetchResult = await fetchData(this.config, input, this.config.onProgress);
        resolvedInput = fetchResult.resolvedInput;
        templateFiles = fetchResult.templateFiles;
      }

      // Phase 1: PLANNING
      this.setPhase('planning');
      this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_CREATING_PLAN), 5);

      const planResponse = await callPlannerAgent('plan', resolvedInput, templateFiles);

      if (planResponse.type !== 'plan' || !planResponse.result.success) {
        throw new Error(planResponse.type === 'plan' ? planResponse.result.error : 'Invalid planner response');
      }

      plan = planResponse.result;
      logger.info(`Plan created: ${plan.modifications.length} modifications`);

      while (refineIterations <= this.config.maxRefineIterations) {
        files = await executeGeneration(
          this.config, resolvedInput, plan, refineIterations,
          templateFiles, files, (p) => this.setPhase(p), review?.improvements,
        );

        const buildResult = await executeBuildWithFixing(
          this.config, input, files, buildFn, errorHistory, fixAttempts, (p) => this.setPhase(p),
        );

        fixAttempts = buildResult.fixAttempts;

        if (buildResult.needsEscalation) {
          const escalationResult = await handleEscalation(
            this.config, resolvedInput, errorHistory, files,
            fixAttempts, refineIterations, this.phases, (p) => this.setPhase(p),
            buildResult.lastBuildError, buildResult.buildResult,
          );
          if (escalationResult) {
            return escalationResult;
          }
        }

        if (!buildResult.success) {
          this.setPhase('failed');
          return {
            success: false,
            files,
            phases: this.phases,
            fixAttempts,
            refineIterations,
            error: buildResult.lastBuildError?.message || buildResult.buildResult?.error || t(EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED),
          };
        }

        // Phase 5: REVIEWING
        if (this.config.skipReview) {
          logger.info('Skipping review (skipReview=true)');
          break;
        }

        this.setPhase('reviewing');
        this.config.onProgress?.('reviewing', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_REVIEWING), 70);

        const reviewResponse = await callPlannerAgentReview(resolvedInput, files);

        if (reviewResponse.type !== 'review') {
          throw new Error('Invalid review response');
        }

        review = reviewResponse.result;
        logger.info(`Review: score=${review.score}, approved=${review.approved}`);

        if (review.approved) {
          break;
        }

        // Phase 6: REFINING (if not approved)
        refineIterations++;

        if (refineIterations > this.config.maxRefineIterations) {
          logger.warn(t(EDITOR_LABEL_KEYS.ORCH_MAX_REFINE_REACHED, { max: this.config.maxRefineIterations }));
          break;
        }

        this.setPhase('refining');
        this.config.onProgress?.(
          'refining',
          t(EDITOR_LABEL_KEYS.ORCH_PREPARING_REFINEMENT, { iteration: refineIterations }),
          75,
        );
      }

      // Phase 7: PUBLISHING
      this.setPhase('publishing');
      this.config.onProgress?.('publishing', t(EDITOR_LABEL_KEYS.ORCH_PUBLISHING_SITE), 90);

      await publishFn(input.projectId, files);

      // COMPLETE
      this.setPhase('complete');
      this.config.onProgress?.('complete', t(EDITOR_LABEL_KEYS.ORCH_GENERATION_COMPLETE), 100);

      return {
        success: true,
        files,
        phases: this.phases,
        fixAttempts,
        refineIterations,
        reviewScore: review?.score,
        reviewSummary: review?.summary,
      };
    } catch (error) {
      logger.error('Gretly error:', error);
      this.setPhase('failed');

      return {
        success: false,
        files,
        phases: this.phases,
        fixAttempts,
        refineIterations,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private setPhase(phase: GretlyPhase): void {
    this.currentPhase = phase;
    this.phases.push(phase);
    this.config.onPhaseChange?.(phase);
    logger.debug(`Phase: ${phase}`);
  }
}

/*
 * ============================================================================
 * Convenience export
 * ============================================================================
 */

/**
 * Create a new Gretly orchestrator instance.
 */
export function createGretly(config?: GretlyConfig): Gretly {
  return new Gretly(config);
}
