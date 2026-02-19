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
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    PLANNER AGENT / Opus 4.6 (Master)             â”‚
 * â”‚  - Creates modification plan (fetches business + template)      â”‚
 * â”‚  - Reviews generated output                                     â”‚
 * â”‚  - Handles escalations when fixes fail                          â”‚
 * â”‚  Cost: High, rare calls                                         â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                              â”‚
 *                        FlowOps protocol
 *                              â”‚
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    Kimi K2.5 (Code Generator)                     â”‚
 * â”‚  - Template-based generation                                    â”‚
 * â”‚  - Fast iterations, bulk output                                 â”‚
 * â”‚  Cost: Low, many calls                                          â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                              â”‚
 *                        FlowOps protocol
 *                              â”‚
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    SONNET 4 (Fixer)                             â”‚
 * â”‚  - Sonnet 4 primary for fresh perspective                       â”‚
 * â”‚  - K2 optional fast path for simple fixes                       â”‚
 * â”‚  Cost: Medium, as needed                                        â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * Pipeline Phases:
 * PLAN â†’ GENERATE â†’ BUILD â†’ FIX (loop) â†’ REVIEW â†’ REFINE (loop) â†’ ESCALATE/PUBLISH
 * ```
 */

import { getAgentRegistry } from '~/lib/flowops';
import {
  getPlannerAgent,
  type PlannerResponseDTO,
  type PlanResultDTO,
  type ReviewResultDTO,
  type EscalateResultDTO,
} from '~/lib/flowstarter/agents/planner-agent';
import { getCodeGeneratorAgent, type GenerateResultDTO } from '~/lib/flowstarter/agents/code-generator-agent';
import { getFixerAgent, type FixerResponseDTO } from '~/lib/flowstarter/agents/fixer-agent';
import { createScopedLogger } from '~/utils/logger';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

const logger = createScopedLogger('Gretly');

/*
 * ============================================================================
 * Types
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

export interface GretlyInput {
  projectId: string;
  businessInfo: BusinessInfo;
  template: TemplateInfo;
  design?: DesignInfo;
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
  escalation?: EscalateResultDTO;
}

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
  private config: Required<Omit<GretlyConfig, 'onProgress' | 'onPhaseChange' | 'dataFetcher'>> & GretlyConfig;
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
    this.registerAgents();
    logger.info(`Gretly config: maxFixAttempts=${this.config.maxFixAttempts}, maxRefineIterations=${this.config.maxRefineIterations}`);
  }

  /**
   * Register all agents with the FlowOps registry.
   */
  private registerAgents(): void {
    const registry = getAgentRegistry();

    if (!registry.has('planner')) {
      registry.register(getPlannerAgent(this.config.approvalThreshold));
    }

    if (!registry.has('code-generator')) {
      registry.register(getCodeGeneratorAgent());
    }

    if (!registry.has('fixer')) {
      registry.register(getFixerAgent()); // Sonnet 4 is primary by default
    }

    logger.info('Agents registered: gretly, code-generator, fixer');
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
    const errorHistory: Array<{
      file: string;
      error: string;
      fixAttempts: number;
      lastFixSummary?: string;
    }> = [];

    logger.info(`Starting Gretly for project ${input.projectId}`);

    // Resolve input data - use fetcher if available
    let resolvedInput = input;
    let templateFiles: Record<string, string> = {};

    try {
      /*
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       * Phase 0: DATA FETCHING (optional)
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       */
      if (this.config.dataFetcher) {
        this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_FETCHING_PROJECT), 2);

        if (this.config.dataFetcher.fetchBusinessInfo) {
          const freshBusinessInfo = await this.config.dataFetcher.fetchBusinessInfo(input.projectId);

          if (freshBusinessInfo) {
            resolvedInput = { ...resolvedInput, businessInfo: freshBusinessInfo };
            logger.info('Fetched fresh business info');
          }
        }

        if (this.config.dataFetcher.fetchTemplate) {
          const templateData = await this.config.dataFetcher.fetchTemplate(input.template.slug);

          if (templateData) {
            resolvedInput = { ...resolvedInput, template: templateData.info };
            templateFiles = templateData.files;
            logger.info(`Fetched template with ${Object.keys(templateFiles).length} files`);
          }
        }
      }

      /*
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       * Phase 1: PLANNING (GretlyAgent - Opus 4.6)
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       */
      this.setPhase('planning');
      this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_CREATING_PLAN), 5);

      const planResponse = await this.callPlannerAgent('plan', resolvedInput, templateFiles);

      if (planResponse.type !== 'plan' || !planResponse.result.success) {
        throw new Error(planResponse.type === 'plan' ? planResponse.result.error : 'Invalid planner response');
      }

      plan = planResponse.result;
      logger.info(`Plan created: ${plan.modifications.length} modifications`);

      /*
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       * Main Loop: GENERATE â†’ BUILD â†’ FIX â†’ REVIEW â†’ REFINE
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       */
      while (refineIterations <= this.config.maxRefineIterations) {
        /*
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         * Phase 2: GENERATING (CodeGeneratorAgent - Kimi K2.5)
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         */
        this.setPhase('generating');
        this.config.onProgress?.(
          'generating',
          refineIterations === 0
            ? t(EDITOR_LABEL_KEYS.ORCH_CODE_GENERATING)
            : t(EDITOR_LABEL_KEYS.ORCH_CODE_REFINING, { iteration: refineIterations }),
          20 + refineIterations * 10,
        );

        const baseFiles = refineIterations === 0 && Object.keys(templateFiles).length > 0 ? templateFiles : files;

        const generateResponse = await this.callCodeGeneratorAgent(
          refineIterations === 0 ? 'generate' : 'refine',
          resolvedInput,
          plan,
          baseFiles,
          review?.improvements,
        );

        if (!generateResponse.success) {
          throw new Error(generateResponse.error || 'Generation failed');
        }

        files = generateResponse.files;
        logger.info(`Generated ${Object.keys(files).length} files`);

        /*
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         * Phase 3: BUILDING (with self-healing via FixerAgent)
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         */
        this.setPhase('building');
        this.config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_BUILDING_SITE), 40);

        let buildSuccess = false;
        let lastBuildError: BuildErrorDTO | undefined;
        let buildResult: Awaited<ReturnType<typeof buildFn>> | null = null;
        let localFixAttempts = 0;

        // Build loop with self-healing
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

          /*
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           * Phase 4: FIXING (FixerAgent - Sonnet 4 primary, fresh perspective)
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           */
          this.setPhase('fixing');
          this.config.onProgress?.(
            'fixing',
            t(EDITOR_LABEL_KEYS.ORCH_FIXER_FIXING, { file: buildResult.buildError.file }),
            50,
          );
          fixAttempts++;
          localFixAttempts++;

          const fixResult = await this.callFixerAgent(buildResult.buildError, files);

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
          const foundPath = this.findFilePath(buildResult.buildError.file, files);

          if (foundPath) {
            files[foundPath] = fixResult.fixedContent;
            logger.info(`Fixed ${foundPath}: ${fixResult.summary}`);
          }

          this.setPhase('building');
          this.config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_RETRYING_BUILD, { attempt: attempt + 1 }), 55);
        }

        /*
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         * Check if escalation needed
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         */
        if (!buildSuccess && localFixAttempts >= this.config.maxFixAttempts) {
          /*
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           * Phase: ESCALATING (GretlyAgent handles exception)
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           */
          this.setPhase('escalating');
          this.config.onProgress?.('escalating', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_ANALYZING), 60);

          const escalateResponse = await this.callPlannerAgentEscalate(resolvedInput, errorHistory);

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

        if (!buildSuccess) {
          this.setPhase('failed');
          return {
            success: false,
            files,
            phases: this.phases,
            fixAttempts,
            refineIterations,
            error: lastBuildError?.message || buildResult?.error || t(EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED),
          };
        }

        /*
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         * Phase 5: REVIEWING (GretlyAgent - Opus 4.6)
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         */
        if (this.config.skipReview) {
          logger.info('Skipping review (skipReview=true)');
          break;
        }

        this.setPhase('reviewing');
        this.config.onProgress?.('reviewing', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_REVIEWING), 70);

        const reviewResponse = await this.callPlannerAgentReview(resolvedInput, files);

        if (reviewResponse.type !== 'review') {
          throw new Error('Invalid review response');
        }

        review = reviewResponse.result;
        logger.info(`Review: score=${review.score}, approved=${review.approved}`);

        if (review.approved) {
          break;
        }

        /*
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         * Phase 6: REFINING (if not approved)
         * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
         */
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

      /*
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       * Phase 7: PUBLISHING
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       */
      this.setPhase('publishing');
      this.config.onProgress?.('publishing', t(EDITOR_LABEL_KEYS.ORCH_PUBLISHING_SITE), 90);

      await publishFn(input.projectId, files);

      /*
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       * COMPLETE
       * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       */
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
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Agent Communication via FlowOps
   * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   */

  private setPhase(phase: GretlyPhase): void {
    this.currentPhase = phase;
    this.phases.push(phase);
    this.config.onPhaseChange?.(phase);
    logger.debug(`Phase: ${phase}`);
  }

  /**
   * Call GretlyAgent for planning.
   */
  private async callPlannerAgent(
    type: 'plan',
    input: GretlyInput,
    templateFiles: Record<string, string>,
  ): Promise<PlannerResponseDTO> {
    const registry = getAgentRegistry();
    const response = await registry.send(
      'planner',
      JSON.stringify({
        type,
        projectId: input.projectId,
        businessInfo: input.businessInfo,
        template: {
          ...input.template,
          files: templateFiles,
        },
        design: input.design,
      }),
    );

    return JSON.parse(response.message.content) as PlannerResponseDTO;
  }

  /**
   * Call GretlyAgent for review.
   */
  private async callPlannerAgentReview(input: GretlyInput, files: Record<string, string>): Promise<PlannerResponseDTO> {
    const registry = getAgentRegistry();
    const response = await registry.send(
      'planner',
      JSON.stringify({
        type: 'review',
        projectId: input.projectId,
        businessInfo: input.businessInfo,
        template: input.template,
        design: input.design,
        generatedFiles: files,
      }),
    );

    return JSON.parse(response.message.content) as PlannerResponseDTO;
  }

  /**
   * Call GretlyAgent for escalation.
   */
  private async callPlannerAgentEscalate(
    input: GretlyInput,
    errorHistory: Array<{ file: string; error: string; fixAttempts: number; lastFixSummary?: string }>,
  ): Promise<PlannerResponseDTO> {
    const registry = getAgentRegistry();
    const response = await registry.send(
      'planner',
      JSON.stringify({
        type: 'escalate',
        projectId: input.projectId,
        businessInfo: input.businessInfo,
        template: input.template,
        errorHistory,
      }),
    );

    return JSON.parse(response.message.content) as PlannerResponseDTO;
  }

  /**
   * Call CodeGeneratorAgent for generation or refinement.
   */
  private async callCodeGeneratorAgent(
    type: 'generate' | 'refine',
    input: GretlyInput,
    plan: PlanResultDTO,
    baseFiles: Record<string, string>,
    feedback?: Array<{ file: string; instruction: string; priority: 'must-fix' | 'should-fix' | 'nice-to-have' }>,
  ): Promise<GenerateResultDTO> {
    const registry = getAgentRegistry();
    const response = await registry.send(
      'code-generator',
      JSON.stringify({
        type,
        projectId: input.projectId,
        businessInfo: input.businessInfo,
        templateFiles: baseFiles,
        modifications: plan.modifications,
        contentGuidelines: plan.contentGuidelines,
        design: input.design,
        previousFiles: type === 'refine' ? baseFiles : undefined,
        feedback: type === 'refine' ? feedback : undefined,
      }),
    );

    return JSON.parse(response.message.content) as GenerateResultDTO;
  }

  /**
   * Call FixerAgent for error fixing.
   */
  private async callFixerAgent(error: BuildErrorDTO, files: Record<string, string>): Promise<FixerResponseDTO> {
    const foundPath = this.findFilePath(error.file, files);

    if (!foundPath) {
      return {
        success: false,
        tier: 'none',
        attempts: 0,
        error: `File not found: ${error.file}`,
      };
    }

    const registry = getAgentRegistry();
    const response = await registry.send(
      'fixer',
      JSON.stringify({
        file: foundPath,
        content: files[foundPath],
        error: error.message,
        line: parseInt(error.line, 10) || undefined,
        fullOutput: error.fullOutput,
      }),
    );

    return JSON.parse(response.message.content) as FixerResponseDTO;
  }

  /**
   * Find file path with various path variations.
   */
  private findFilePath(filePath: string, files: Record<string, string>): string | null {
    const pathVariations = [
      filePath,
      `/${filePath}`,
      filePath.replace(/^\//, ''),
      `src/${filePath}`,
      `/src/${filePath}`,
    ];

    for (const path of pathVariations) {
      if (files[path]) {
        return path;
      }
    }

    // Try basename match
    const basename = filePath.split('/').pop();

    if (basename) {
      for (const path of Object.keys(files)) {
        if (path.endsWith(basename)) {
          return path;
        }
      }
    }

    return null;
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





