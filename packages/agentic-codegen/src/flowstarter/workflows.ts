import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PiSdkFlowstarterAgents, type AgentBuildResult } from './pi-sdk';
import type { TemplateClassifier } from './template-classifier';
import { buildIntakeText } from './template-classifier';
import { injectPreviewTeaser, type PreviewTeaserOptions } from './preview-teaser';
import { assertSafeBusinessIntake } from './intake-guard';
import type { TemplateLibrary } from './template-library-mcp';
import {
  createPreviewWorkspace,
  materializeScaffold,
  SafeGitWorktreeManager,
  type GitWorktree,
} from './worktree';
import { ProjectState } from './types';
import type {
  BrandConfig,
  BusinessIntakePayload,
  ScrapeCorpus,
  TemplateScaffoldFile,
  TemplateSelection,
} from './types';

export interface SiteValidator {
  /** Trusted, operator-defined formatter/check/build commands run outside Pi. */
  validate(workspaceRoot: string, phase: 'preview' | 'full'): Promise<void>;
}

export interface PreviewPublisher {
  publish(input: {
    projectId: string;
    workspaceRoot: string;
    template: TemplateSelection;
    brandConfig: BrandConfig;
  }): Promise<{
    previewUrl: string;
    artifactUrl: string;
    files: TemplateScaffoldFile[];
    sandboxId?: string;
    teardown?: () => Promise<void>;
  }>;
}

export interface PreviewPipelineOptions {
  /**
   * Give the preview model the entire template source read-only. Pair with a
   * large-context budget model (the flash tier) so the agent understands the
   * design system without tool-call archaeology.
   */
  fullTemplateContext?: boolean;
  /**
   * Run the quality sweep as a second personalization pass: first-person
   * voice, no invented clients or metrics, no template stock copy left over.
   */
  qualitySweep?: boolean;
  /** Blur lower sections of the published preview behind an unlock chip. */
  teaser?: PreviewTeaserOptions | false;
  /**
   * Post-publish rendered audit. Receives the live preview URL; returns a
   * human-readable issue description (low-contrast text, viewport-scale
   * empty gaps, broken scheme) or undefined when the render is acceptable.
   * On an issue the pipeline runs one repair pass and republishes. The
   * auditor lives outside this package — it typically drives a headless
   * browser, which the worker runtime may not ship.
   */
  renderedAudit?: (previewUrl: string) => Promise<string | undefined>;
}

export interface PreviewPipelineResult {
  brandConfig: BrandConfig;
  template: TemplateSelection;
  previewUrl: string;
  artifactUrl: string;
  files: TemplateScaffoldFile[];
  sandboxId?: string;
  teardown?: () => Promise<void>;
}

export class PreviewGenerationPipeline {
  constructor(
    private readonly agents: PiSdkFlowstarterAgents,
    private readonly library: TemplateLibrary,
    private readonly validator: SiteValidator,
    private readonly publisher: PreviewPublisher,
    /**
     * Optional sigma-style deterministic selector. When its top match clears
     * the confidence gate the LLM selection call is skipped entirely; murky
     * intakes still go to the model.
     */
    private readonly templateClassifier?: TemplateClassifier,
    private readonly options: PreviewPipelineOptions = {},
  ) {}

  async run(input: {
    intake: BusinessIntakePayload;
    corpus: ScrapeCorpus;
    cachedAssets: Array<{ sourceId: string; publicPath: string }>;
    onPhase?: (phase: string) => void;
  }): Promise<PreviewPipelineResult> {
    assertSafeBusinessIntake(input.intake);
    input.onPhase?.('Learning your voice and visual direction');
    const brandConfig = await this.agents.analyzeBrand(
      input.intake,
      input.corpus,
    );
    input.onPhase?.('Choosing the best starting design');
    const template = await this.selectTemplate(input.intake, brandConfig);
    input.onPhase?.('Preparing your selected design');
    const scaffold = await this.library.scaffold(template.slug);
    const workspace = await createPreviewWorkspace(scaffold);
    try {
      const personalize = (feedback?: string) =>
        this.agents.buildPreview({
          workspaceRoot: workspace.root,
          intake: input.intake,
          brandConfig,
          templateSlug: template.slug,
          cachedAssets: input.cachedAssets,
          templateConfig: scaffold.template.config,
          feedback,
          fullTemplateContext: this.options.fullTemplateContext,
        });

      input.onPhase?.('Personalizing the site with your business');
      let build = await personalize();
      if (this.options.qualitySweep) {
        input.onPhase?.('Polishing voice and honesty');
        const sweep = await personalize(QUALITY_SWEEP_FEEDBACK);
        if (sweep.changedPaths.length > 0) {
          build = {
            ...sweep,
            changedPaths: Array.from(
              new Set([...build.changedPaths, ...sweep.changedPaths]),
            ),
          };
        }
      }
      let issue = await findPersonalizationIssue(
        workspace.root,
        input.intake,
        build,
      );
      if (issue) {
        input.onPhase?.('Refining the personalization');
        build = await personalize(issue);
        issue = await findPersonalizationIssue(
          workspace.root,
          input.intake,
          build,
        );
        if (issue) {
          throw new Error(`Preview personalization failed: ${issue}`);
        }
      }

      input.onPhase?.('Checking the preview');
      try {
        await this.validator.validate(workspace.root, 'preview');
      } catch (error) {
        input.onPhase?.('Repairing the preview');
        const detail =
          error instanceof Error ? error.message.slice(0, 2_000) : 'unknown';
        await personalize(
          `Automated validation of your previous file changes failed: ${detail}. Repair the workspace files so validation passes.`,
        );
        await this.validator.validate(workspace.root, 'preview');
      }
      if (this.options.teaser !== false && this.options.teaser !== undefined) {
        input.onPhase?.('Preparing the preview teaser');
        await injectPreviewTeaser(workspace.root, this.options.teaser);
      }
      input.onPhase?.('Publishing your live preview');
      let published = await this.publisher.publish({
        projectId: input.intake.projectId,
        workspaceRoot: workspace.root,
        template,
        brandConfig,
      });
      if (this.options.renderedAudit) {
        input.onPhase?.('Reviewing the rendered preview');
        const renderIssue = await this.options.renderedAudit(
          published.previewUrl,
        );
        if (renderIssue) {
          input.onPhase?.('Repairing rendered issues');
          await personalize(
            `A rendered review of the published preview found visual defects you must repair by editing content and style-token values only: ${renderIssue.slice(0, 2_000)}`,
          );
          await this.validator.validate(workspace.root, 'preview');
          await published.teardown?.().catch(() => undefined);
          published = await this.publisher.publish({
            projectId: input.intake.projectId,
            workspaceRoot: workspace.root,
            template,
            brandConfig,
          });
        }
      }
      return { brandConfig, template, ...published };
    } finally {
      await rm(workspace.root, { recursive: true, force: true });
    }
  }

  private async selectTemplate(
    intake: BusinessIntakePayload,
    brandConfig: BrandConfig,
  ): Promise<TemplateSelection> {
    if (this.templateClassifier) {
      const candidates = await this.library.search(
        buildIntakeText(intake.business).slice(0, 280),
      );
      const classified = await this.templateClassifier.classify(
        buildIntakeText(intake.business),
        candidates,
      );
      if (classified.autoSelect) {
        const { slug, score, margin } = classified.autoSelect;
        return {
          slug,
          reason: `sigma classifier auto-selection (cosine ${score.toFixed(3)}, margin ${margin.toFixed(3)} over runner-up)`,
          matchedSignals: ['sigma-embedding'],
          confidence: Math.min(0.99, score),
        };
      }
    }
    return this.agents.selectTemplate({
      intake,
      brandConfig,
      library: this.library,
    });
  }
}

/**
 * Trusted post-session check that the agent actually personalized the
 * template. Returns bounded feedback for one repair pass, or undefined when
 * the work is acceptable.
 */
const QUALITY_SWEEP_FEEDBACK =
  'Quality sweep over every editable content file, changing only what breaks ' +
  'these rules: (1) the site speaks as one person — first-person singular ' +
  'everywhere; rewrite any we/our/us/studio/team voice. (2) Nothing invented ' +
  '— remove or rewrite fabricated clients, testimonials, case studies, ' +
  'metrics, awards or logos; ground every claim in the intake and brand ' +
  'evidence, or repurpose the section to describe real process or skills. ' +
  '(3) No template stock copy or placeholder text may remain anywhere, ' +
  'including subpages. (4) Length discipline: hero heading at most 8 words; ' +
  'hero supporting paragraph at most 45 words; CTA labels at most 4 words — ' +
  'long hero copy stretches the template on phones. Keep everything that ' +
  'already satisfies the rules.';

async function findPersonalizationIssue(
  workspaceRoot: string,
  intake: BusinessIntakePayload,
  build: AgentBuildResult,
): Promise<string | undefined> {
  if (build.changedPaths.length === 0) {
    return (
      'your session ended without modifying any file; rewrite the canonical ' +
      'content file with the client\'s real business content'
    );
  }
  const businessName = intake.business.name.trim();
  if (!businessName) return undefined;
  const needle = businessName.toLowerCase();
  for (const path of build.changedPaths) {
    try {
      const content = await readFile(join(workspaceRoot, path), 'utf8');
      if (content.toLowerCase().includes(needle)) return undefined;
    } catch {
      // A changed file may since be unreadable; keep scanning the rest.
    }
  }
  return (
    `the client's business name "${businessName}" does not appear in any ` +
    'file you changed; replace the template\'s sample brand copy with the ' +
    'client\'s real content'
  );
}

export interface FullSiteBuildJob {
  id: string;
  projectId: string;
  projectState: ProjectState;
  intake: BusinessIntakePayload;
  brandConfig: BrandConfig;
  approvedPreviewFiles: TemplateScaffoldFile[];
  requiredIntegrations: string[];
}

export interface FullSiteBuildJobStore {
  claim(jobId: string): Promise<FullSiteBuildJob | null>;
  markAgentWorking(jobId: string, worktree: GitWorktree): Promise<void>;
  markHumanQa(
    jobId: string,
    result: { commitSha: string; pullRequestUrl: string; stagingUrl: string },
  ): Promise<void>;
  markFailed(
    jobId: string,
    error: { code: string; detail: string },
  ): Promise<void>;
}

export interface PullRequestPublisher {
  create(input: {
    projectId: string;
    branch: string;
    worktreePath: string;
    commitSha: string;
  }): Promise<{ pullRequestUrl: string; stagingUrl: string }>;
}

/** Long-running worker entrypoint invoked by the durable job dispatcher. */
export class FullSiteBuildWorker {
  constructor(
    private readonly store: FullSiteBuildJobStore,
    private readonly worktrees: SafeGitWorktreeManager,
    private readonly agents: PiSdkFlowstarterAgents,
    private readonly validator: SiteValidator,
    private readonly pullRequests: PullRequestPublisher,
  ) {}

  async run(jobId: string): Promise<void> {
    const job = await this.store.claim(jobId);
    if (!job) return;
    if (job.projectState !== ProjectState.DEPOSIT_PAID) {
      await this.store.markFailed(jobId, {
        code: 'INVALID_PROJECT_STATE',
        detail: `Full build requires DEPOSIT_PAID, received ${job.projectState}`,
      });
      return;
    }

    try {
      const worktree = await this.worktrees.create(job.projectId);
      const siteRoot = join(worktree.path, 'generated-sites', job.projectId);
      await mkdir(siteRoot, { recursive: true, mode: 0o700 });
      await materializeScaffold(siteRoot, job.approvedPreviewFiles);
      await this.store.markAgentWorking(jobId, worktree);
      const build = await this.agents.buildFullSite({
        workspaceRoot: siteRoot,
        projectId: job.projectId,
        intake: job.intake,
        brandConfig: job.brandConfig,
        requiredIntegrations: job.requiredIntegrations,
      });
      if (build.changedPaths.length === 0) {
        throw new Error('Full-site agent finished without modifying any file');
      }
      await this.validator.validate(siteRoot, 'full');
      const commitSha = await this.worktrees.commit(
        worktree,
        `build: initialize Flowstarter site ${job.projectId.toLowerCase()}`,
      );
      const published = await this.pullRequests.create({
        projectId: job.projectId,
        branch: worktree.branch,
        worktreePath: worktree.path,
        commitSha,
      });
      await this.store.markHumanQa(jobId, { commitSha, ...published });
    } catch (error) {
      await this.store.markFailed(jobId, {
        code: 'FULL_SITE_BUILD_FAILED',
        detail:
          error instanceof Error
            ? error.message.slice(0, 2_000)
            : 'Unknown build failure',
      });
      throw error;
    }
  }
}
