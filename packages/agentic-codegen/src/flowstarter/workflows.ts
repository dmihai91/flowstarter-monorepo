import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PiSdkFlowstarterAgents, type AgentBuildResult } from './pi-sdk';
import type { TemplateClassifier } from './template-classifier';
import { buildIntakeText } from './template-classifier';
import { injectPreviewTeaser, type PreviewTeaserOptions } from './preview-teaser';
import {
  materializeCachedAssets,
  type CachedAssetEntry,
  type CachedAssetFile,
} from './preview-assets';
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
    /**
     * Client media bytes (scraped brand photos) the trusted orchestrator
     * writes into public/flowstarter-assets/ after scaffolding; the resulting
     * entries are merged into cachedAssets for the agent.
     */
    cachedAssetFiles?: CachedAssetFile[];
    onPhase?: (phase: string) => void;
  }): Promise<PreviewPipelineResult> {
    assertSafeBusinessIntake(input.intake);
    input.onPhase?.('Learning your voice and visual direction');

    // The sigma classifier reads the intake only, so template selection does
    // not have to wait for the vision pass to finish. Racing them removes the
    // classifier and the scaffold download from the critical path entirely;
    // a murky intake still falls back to the model, which does need the brand
    // config and so runs after it.
    const deterministicSelection = this.templateClassifier
      ? this.classifyTemplate(input.intake).catch(() => undefined)
      : Promise.resolve(undefined);

    const [brandConfig, classified] = await Promise.all([
      this.agents.analyzeBrand(input.intake, input.corpus),
      deterministicSelection,
    ]);

    input.onPhase?.('Choosing the best starting design');
    const template =
      classified ??
      (await this.agents.selectTemplate({
        intake: input.intake,
        brandConfig,
        library: this.library,
      }));
    input.onPhase?.('Preparing your selected design');
    const scaffold = await this.library.scaffold(template.slug);
    const workspace = await createPreviewWorkspace(scaffold);
    try {
      const cachedAssets = [
        ...input.cachedAssets,
        ...(await materializeCachedAssets(
          workspace.root,
          input.cachedAssetFiles ?? [],
        )),
      ];
      const personalize = (feedback?: string) =>
        this.agents.buildPreview({
          workspaceRoot: workspace.root,
          intake: input.intake,
          brandConfig,
          templateSlug: template.slug,
          cachedAssets,
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
        const repair = await personalize(issue);
        // Re-check against everything written so far, not just this pass. A
        // repair that correctly concludes there is nothing left to change
        // reports no changed files, and judging it alone would fail a preview
        // that is actually fine.
        build = {
          ...repair,
          changedPaths: Array.from(
            new Set([...build.changedPaths, ...repair.changedPaths]),
          ),
        };
        issue = await findPersonalizationIssue(
          workspace.root,
          input.intake,
          build,
        );
        if (issue) {
          throw new Error(`Preview personalization failed: ${issue}`);
        }
      }

      // Soft checks on image placement. Both run one repair pass at most and
      // never fail the pipeline: a stubborn image slot must not cost the
      // client their whole preview.
      const mediaIssue = await findClientMediaIssue(
        workspace.root,
        cachedAssets,
        build,
      );
      if (mediaIssue) {
        input.onPhase?.('Placing your own photos');
        build = await personalize(mediaIssue);
      }

      const heroIssue = await findHeroAssetIssue(
        workspace.root,
        cachedAssets,
        build,
      );
      if (heroIssue) {
        input.onPhase?.('Choosing the right hero image');
        build = await personalize(heroIssue);
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

  /**
   * The deterministic half of template selection: intake text only, so it can
   * run while the brand agent is still looking at images. Returns undefined
   * when nothing clears the confidence gate, leaving the decision to the model.
   */
  private async classifyTemplate(
    intake: BusinessIntakePayload,
  ): Promise<TemplateSelection | undefined> {
    if (!this.templateClassifier) return undefined;
    const intakeText = buildIntakeText(intake.business);
    const candidates = await this.library.search(intakeText.slice(0, 280));
    const classified = await this.templateClassifier.classify(
      intakeText,
      candidates,
    );
    if (!classified.autoSelect) return undefined;
    const { slug, score, margin } = classified.autoSelect;
    return {
      slug,
      reason: `sigma classifier auto-selection (cosine ${score.toFixed(3)}, margin ${margin.toFixed(3)} over runner-up)`,
      matchedSignals: ['sigma-embedding'],
      confidence: Math.min(0.99, score),
    };
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

/**
 * Trusted post-session check that the hero image is one the caller vouched
 * for. Aesthetic suitability is not something the orchestrator can judge from
 * bytes, so the gate is mechanical: only `heroEligible` client media may sit
 * in a hero slot, and everything else falls back to the template's own
 * art-directed asset.
 */
async function findHeroAssetIssue(
  workspaceRoot: string,
  cachedAssets: CachedAssetEntry[],
  build: AgentBuildResult,
): Promise<string | undefined> {
  const barred = cachedAssets.filter((asset) => !asset.heroEligible);
  const allowed = cachedAssets.filter((asset) => asset.heroEligible);
  if (barred.length === 0 && allowed.length === 0) return undefined;

  for (const path of build.changedPaths) {
    let content: string;
    try {
      content = await readFile(join(workspaceRoot, path), 'utf8');
    } catch {
      continue;
    }
    // The hero image key sits at the top of the template's content file; a
    // barred asset on that line is the failure this check exists to catch.
    const heroLine = content
      .split('\n')
      .find((line) => /^\s{0,4}image:\s*["']?\/flowstarter-assets\//.test(line));
    if (!heroLine) continue;
    const used = barred.find((asset) => heroLine.includes(asset.publicPath));
    if (!used) continue;
    return (
      `the hero image is ${used.publicPath}, which is not marked ` +
      '"heroEligible" and must not fill a hero slot. ' +
      (allowed.length > 0
        ? `Use ${allowed.map((asset) => asset.publicPath).join(' or ')} instead.`
        : 'Use the template\'s own art-directed asset, or leave the hero ' +
          'image empty so the template renders its designed art panel.') +
      ` Keep ${used.publicPath} only in a secondary about, project, or mood slot.`
    );
  }

  // The client vouched for a photo and the hero still renders the template's
  // placeholder panel: their face is the strongest thing the page has.
  if (allowed.length > 0) {
    for (const path of build.changedPaths) {
      let content: string;
      try {
        content = await readFile(join(workspaceRoot, path), 'utf8');
      } catch {
        continue;
      }
      const heroLine = content
        .split('\n')
        .find((line) => /^\s{0,4}image:\s*["']/.test(line));
      if (!heroLine) continue;
      // The character after the opening quote must be real content, not the
      // closing quote: `image: ""` is an empty hero, not a filled one.
      const filled = /image:\s*(["'])\s*[^"'\s]/.test(heroLine);
      if (filled) return undefined;
      return (
        'the hero image is empty while the client supplied a hero-ready ' +
        `photo. Set the hero image to ${allowed
          .map((asset) => asset.publicPath)
          .join(' or ')} rather than leaving the template's placeholder panel.`
      );
    }
  }
  return undefined;
}

/**
 * Trusted post-session check that the client's own media made it into the
 * site. Returns bounded repair feedback, or undefined when at least one
 * cached asset is referenced (or there is none to place).
 */
async function findClientMediaIssue(
  workspaceRoot: string,
  cachedAssets: CachedAssetEntry[],
  build: AgentBuildResult,
): Promise<string | undefined> {
  if (cachedAssets.length === 0 || build.changedPaths.length === 0) {
    return undefined;
  }
  for (const path of build.changedPaths) {
    try {
      const content = await readFile(join(workspaceRoot, path), 'utf8');
      if (cachedAssets.some((asset) => content.includes(asset.publicPath))) {
        return undefined;
      }
    } catch {
      // A changed file may since be unreadable; keep scanning the rest.
    }
  }
  const available = cachedAssets
    .map((asset) => `${asset.publicPath} (source ${asset.sourceId})`)
    .join(', ');
  return (
    'none of the client\'s own photos appear anywhere in the site; per the ' +
    'asset policy, use the client\'s photo for the primary portrait and ' +
    'about-page slots (replacing demo-persona or abstract portrait art), and ' +
    `use further client media where the evidence matches. Available: ${available}`
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
