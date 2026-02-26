/**
 * Gretly Orchestrator
 *
 * Master orchestrator using a three-tier agent architecture:
 *
 * Model Roles:
 * - **PlannerAgent (Claude Opus 4.6)** (Master): Planning, reviewing, exception handling
 * - **Kimi K2.5 on Groq** (Executor): Fast code generation, bulk output
 * - **Claude Sonnet 4** (Fixer): Fresh perspective on fixes, primary model
 *
 * All agents communicate via FlowOps protocol.
 *
 * Pipeline Flow:
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    PLANNER AGENT / Opus 4.6 (Master)             │
 * │  - Creates modification plan (fetches business + template)      │
 * │  - Reviews generated output                                     │
 * │  - Handles escalations when fixes fail                          │
 * │  Cost: High, rare calls                                         │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                        FlowOps protocol
 *                              │
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Kimi K2.5 (Code Generator)                     │
 * │  - Template-based generation                                    │
 * │  - Fast iterations, bulk output                                 │
 * │  Cost: Low, many calls                                          │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                        FlowOps protocol
 *                              │
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    SONNET 4 (Fixer)                             │
 * │  - Sonnet 4 primary for fresh perspective                       │
 * │  - K2 optional fast path for simple fixes                       │
 * │  Cost: Medium, as needed                                        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Pipeline Phases:
 * PLAN → GENERATE → BUILD → FIX (loop) → REVIEW → REFINE (loop) → ESCALATE/PUBLISH
 * ```
 */

import { createScopedLogger } from '~/utils/logger';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import type { PlanResultDTO, ReviewResultDTO } from '~/lib/flowstarter/agents/planner-agent';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

// Import modular components
import type {
  GretlyPhase,
  GretlyConfig,
  GretlyInput,
  GretlyResult,
  ResolvedConfig,
  ErrorHistoryEntry,
} from './types';
import {
  registerAgents,
  callPlannerAgent,
  callPlannerAgentReview,
  callPlannerAgentEscalate,
  callCodeGeneratorAgent,
  callFixerAgent,
} from './agent-communication';
import { findFilePath } from './utils';

// Re-export types for external use
export type { GretlyPhase, GretlyConfig, GretlyInput, GretlyResult, BusinessInfo, TemplateInfo, DesignInfo, GretlyDataFetcher } from './types';

const logger = createScopedLogger('Gretly');

/*
 * ============================================================================
 * Gretly Orchestrator
 * ============================================================================
 */

/**
 * Gretly - Master Orchestrator with Three-Tier Agent Architecture
 *
 * - PlannerAgent (Opus 4.6): Planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2.5): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing with fresh perspective
 *
 * All communication happens via FlowOps protocol.
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

    // Resolve input data - use fetcher if available
    let resolvedInput = input;
    let templateFiles: Record<string, string> = {};

    try {
      // Phase 0: DATA FETCHING (optional)
      if (this.config.dataFetcher) {
        const fetchResult = await this.fetchData(input);
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

      // Main Loop: GENERATE → BUILD → FIX → REVIEW → REFINE
      while (refineIterations <= this.config.maxRefineIterations) {
        // Phase 2: GENERATING
        const generateResult = await this.executeGeneration(
          resolvedInput,
          plan,
          refineIterations,
          templateFiles,
          files,
          review?.improvements,
        );
        files = generateResult;

        // Phase 3: BUILDING (with self-healing)
        const buildResult = await this.executeBuildWithFixing(
          input,
          files,
          buildFn,
          errorHistory,
          fixAttempts,
        );

        fixAttempts = buildResult.fixAttempts;

        if (buildResult.needsEscalation) {
          const escalationResult = await this.handleEscalation(
            resolvedInput,
            errorHistory,
            files,
            fixAttempts,
            refineIterations,
            buildResult.lastBuildError,
            buildResult.buildResult,
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

  /*
   * ────────────────────────────────────────────────────────────────────────────
   * Private Methods: Phase Execution
   * ────────────────────────────────────────────────────────────────────────────
   */

  private setPhase(phase: GretlyPhase): void {
    this.currentPhase = phase;
    this.phases.push(phase);
    this.config.onPhaseChange?.(phase);
    logger.debug(`Phase: ${phase}`);
  }

  /**
   * Fetch data from external sources if dataFetcher is configured.
   */
  private async fetchData(input: GretlyInput): Promise<{
    resolvedInput: GretlyInput;
    templateFiles: Record<string, string>;
  }> {
    this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_FETCHING_PROJECT), 2);

    let resolvedInput = input;
    let templateFiles: Record<string, string> = {};

    if (this.config.dataFetcher?.fetchBusinessInfo) {
      const freshBusinessInfo = await this.config.dataFetcher.fetchBusinessInfo(input.projectId);

      if (freshBusinessInfo) {
        resolvedInput = { ...resolvedInput, businessInfo: freshBusinessInfo };
        logger.info('Fetched fresh business info');
      }
    }

    if (this.config.dataFetcher?.fetchTemplate) {
      const templateData = await this.config.dataFetcher.fetchTemplate(input.template.slug);

      if (templateData) {
        resolvedInput = { ...resolvedInput, template: templateData.info };
        templateFiles = templateData.files;
        logger.info(`Fetched template with ${Object.keys(templateFiles).length} files`);
      }
    }

    return { resolvedInput, templateFiles };
  }

  /**
   * Execute the generation phase.
   */
  private async executeGeneration(
    input: GretlyInput,
    plan: PlanResultDTO,
    refineIterations: number,
    templateFiles: Record<string, string>,
    currentFiles: Record<string, string>,
    feedback?: Array<{ file: string; instruction: string; priority: 'must-fix' | 'should-fix' | 'nice-to-have' }>,
  ): Promise<Record<string, string>> {
    this.setPhase('generating');
    this.config.onProgress?.(
      'generating',
      refineIterations === 0
        ? t(EDITOR_LABEL_KEYS.ORCH_CODE_GENERATING)
        : t(EDITOR_LABEL_KEYS.ORCH_CODE_REFINING, { iteration: refineIterations }),
      20 + refineIterations * 10,
    );

    const baseFiles = refineIterations === 0 && Object.keys(templateFiles).length > 0 ? templateFiles : currentFiles;

    const generateResponse = await callCodeGeneratorAgent(
      refineIterations === 0 ? 'generate' : 'refine',
      input,
      plan,
      baseFiles,
      feedback,
    );

    if (!generateResponse.success) {
      throw new Error(generateResponse.error || 'Generation failed');
    }

    logger.info(`Generated ${Object.keys(generateResponse.files).length} files`);
    return generateResponse.files;
  }

  /**
   * Execute the build phase with self-healing via FixerAgent.
   */
  private async executeBuildWithFixing(
    input: GretlyInput,
    files: Record<string, string>,
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
    errorHistory: ErrorHistoryEntry[],
    initialFixAttempts: number,
  ): Promise<{
    success: boolean;
    fixAttempts: number;
    needsEscalation: boolean;
    lastBuildError?: BuildErrorDTO;
    buildResult: Awaited<ReturnType<typeof buildFn>> | null;
  }> {
    this.setPhase('building');
    this.config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_BUILDING_SITE), 40);

    let buildSuccess = false;
    let lastBuildError: BuildErrorDTO | undefined;
    let buildResult: Awaited<ReturnType<typeof buildFn>> | null = null;
    let localFixAttempts = 0;
    let fixAttempts = initialFixAttempts;

    logger.info(`Starting build loop with maxFixAttempts=${this.config.maxFixAttempts}`);

    for (let attempt = 0; attempt <= this.config.maxFixAttempts; attempt++) {
      logger.debug(`Build attempt ${attempt}/${this.config.maxFixAttempts}`);
      buildResult = await buildFn(input.projectId, files);

      if (buildResult.success) {
        buildSuccess = true;
        logger.info(`Build succeeded on attempt ${attempt}`);
        break;
      }

      logger.debug(`Build failed on attempt ${attempt}, buildError=${!!buildResult.buildError}, maxFixAttempts=${this.config.maxFixAttempts}`);

      if (!buildResult.buildError || attempt >= this.config.maxFixAttempts) {
        logger.warn(`Breaking build loop: buildError=${!!buildResult.buildError}, attempt=${attempt} >= maxFixAttempts=${this.config.maxFixAttempts}`);
        lastBuildError = buildResult.buildError;
        break;
      }

      // Phase 4: FIXING
      this.setPhase('fixing');
      this.config.onProgress?.(
        'fixing',
        t(EDITOR_LABEL_KEYS.ORCH_FIXER_FIXING, { file: buildResult.buildError.file }),
        50,
      );
      fixAttempts++;
      localFixAttempts++;

      const fixResult = await callFixerAgent(buildResult.buildError, files);

      if (!fixResult.success || !fixResult.fixedContent) {
        // Track error for potential escalation
        const existingError = errorHistory.find((e) => e.file === buildResult!.buildError!.file);

        if (existingError) {
          existingError.fixAttempts++;
          existingError.lastFixSummary = fixResult.summary;
        } else {
          errorHistory.push({
            file: buildResult.buildError.file,
            error: buildResult.buildError.message,
            fixAttempts: 1,
            lastFixSummary: fixResult.summary,
          });
        }

        lastBuildError = buildResult.buildError;
        break;
      }

      // Apply fix
      const foundPath = findFilePath(buildResult.buildError.file, files);

      if (foundPath) {
        files[foundPath] = fixResult.fixedContent;
        logger.info(`Fixed ${foundPath}: ${fixResult.summary}`);
      }

      this.setPhase('building');
      this.config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_RETRYING_BUILD, { attempt: attempt + 1 }), 55);
    }

    const needsEscalation = !buildSuccess && localFixAttempts >= this.config.maxFixAttempts;

    return {
      success: buildSuccess,
      fixAttempts,
      needsEscalation,
      lastBuildError,
      buildResult,
    };
  }

  /**
   * Handle escalation when fixes fail.
   */
  private async handleEscalation(
    input: GretlyInput,
    errorHistory: ErrorHistoryEntry[],
    files: Record<string, string>,
    fixAttempts: number,
    refineIterations: number,
    lastBuildError?: BuildErrorDTO,
    buildResult?: { success: boolean; error?: string } | null,
  ): Promise<GretlyResult | null> {
    this.setPhase('escalating');
    this.config.onProgress?.('escalating', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_ANALYZING), 60);

    const escalateResponse = await callPlannerAgentEscalate(input, errorHistory);

    if (escalateResponse.type === 'escalate') {
      logger.warn(`Escalation: ${escalateResponse.result.escalationType}`);

      // Return with escalation info - let caller decide what to do
      return {
        success: false,
        files,
        phases: this.phases,
        fixAttempts,
        refineIterations,
        error: escalateResponse.result.explanation,
        escalation: escalateResponse.result,
      };
    }

    // If escalation handler returns something unexpected, fail
    this.setPhase('failed');

    return {
      success: false,
      files,
      phases: this.phases,
      fixAttempts,
      refineIterations,
      error: lastBuildError?.message || buildResult?.error || t(EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED_MAX),
    };
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
