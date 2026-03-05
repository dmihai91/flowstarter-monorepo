/** Gretly Pipeline — Deterministic PLAN→GENERATE→VALIDATE→BUILD→REVIEW→PUBLISH pipeline. */

import { createScopedLogger } from '~/utils/logger';
import { getAgentRegistry } from '~/lib/flowops';
import { getFixerAgent } from '~/lib/flowstarter/agents/fixer-agent';
import { getReviewerAgent, type ReviewResultDTO } from '~/lib/flowstarter/agents/reviewer-agent';
import { Gretly, type GretlyResult, type BuildResult } from './builder';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import type {
  PipelinePhase, BusinessInfo, TemplateInfo, PipelineConfig,
  PlanResult, GenerateResult, PipelineResult,
} from './pipeline-types';
import { runReview, buildFeedback } from './pipeline-review';

export type { PipelinePhase, BusinessInfo, TemplateInfo, PipelineConfig, PlanResult, GenerateResult, PipelineResult } from './pipeline-types';

const logger = createScopedLogger('Gretly:Pipeline');

/** Deterministic pipeline for site generation with master review. */
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

  getPhase(): PipelinePhase { return this.currentPhase; }

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
      // Phase 1: PLANNING
      this.setPhase('planning');
      this.config.onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_CREATING_PLAN), 5);

      planResult = await planFn(businessInfo, template);

      if (!planResult.success) {
        return this.fail('Planning failed', { planResult, refineIterations });
      }

      logger.info(`Plan created with ${planResult.modifications.length} modifications`);

      // Main loop: GENERATE → BUILD → REVIEW → (REFINE)
      while (refineIterations <= this.config.maxRefineIterations) {
        // Phase 2: GENERATING
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

        // Phase 3: VALIDATING
        this.setPhase('validating');
        this.config.onProgress?.('validating', t(EDITOR_LABEL_KEYS.ORCH_VALIDATING_FILES), 30);

        // Phase 4: BUILDING (with self-healing)
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

        files = buildResult.files;
        logger.info(`Build succeeded with ${buildResult.fixAttempts} fix attempts`);

        // Phase 5: REVIEWING
        if (this.config.skipReview) {
          logger.info('Skipping review (skipReview=true)');
          break;
        }

        this.setPhase('reviewing');
        this.config.onProgress?.('reviewing', t(EDITOR_LABEL_KEYS.ORCH_RUNNING_REVIEW), 70);

        reviewResult = await runReview(files, businessInfo, template);
        this.config.onReviewResult?.(reviewResult);

        logger.info(`Review complete: score=${reviewResult.score}, approved=${reviewResult.approved}`);

        if (reviewResult.approved) {
          logger.info('Review approved!');
          break;
        }

        // Phase 6: REFINING
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

        feedback = buildFeedback(reviewResult);
        logger.info(`Refining with feedback: ${feedback.slice(0, 200)}...`);
      }

      // Phase 7: PUBLISHING
      this.setPhase('publishing');
      this.config.onProgress?.('publishing', t(EDITOR_LABEL_KEYS.ORCH_PUBLISHING_SITE), 90);

      await publishFn(projectId, files);

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

}

export function createPipeline(config?: PipelineConfig): Pipeline {
  return new Pipeline(config);
}

