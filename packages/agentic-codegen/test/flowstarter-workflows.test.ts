import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FullSiteBuildWorker,
  PreviewGenerationPipeline,
  ProjectState,
  type BrandConfig,
  type BusinessIntakePayload,
  type FullSiteBuildJobStore,
  type PiSdkFlowstarterAgents,
  type PreviewPublisher,
  type PullRequestPublisher,
  type SafeGitWorktreeManager,
  type ScrapeCorpus,
  type SiteValidator,
  type TemplateLibrary,
} from '../src/index';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('Flowstarter preview-to-build orchestration', () => {
  it('turns an approved intake into a published, template-based preview', async () => {
    const calls: string[] = [];
    let previewWorkspace = '';
    const intake = validIntake();
    const corpus = validCorpus(intake.projectId);
    const brandConfig = validBrandConfig();

    const agents = {
      analyzeBrand: async () => {
        calls.push('agent:brand-intelligence');
        return brandConfig;
      },
      selectTemplate: async () => {
        calls.push('agent:template-selector');
        return {
          slug: 'wellness-therapy',
          reason: 'Trust-led service journey with a consultation conversion.',
          matchedSignals: ['therapy', 'warm', 'bookings'],
          confidence: 0.94,
        };
      },
      buildPreview: async (input: {
        workspaceRoot: string;
        templateConfig?: Record<string, unknown>;
      }) => {
        calls.push('agent:preview-builder');
        previewWorkspace = input.workspaceRoot;
        expect(input.templateConfig).toEqual({ palettes: [] });
        const source = join(input.workspaceRoot, 'src/content/site.md');
        expect(await readFile(source, 'utf8')).toBe('Template copy');
        await writeFile(source, 'Calm Path Therapy preview', 'utf8');
        return {
          summary: 'Preview tailored',
          changedPaths: ['src/content/site.md'],
        };
      },
    } as unknown as PiSdkFlowstarterAgents;

    const library: TemplateLibrary = {
      search: async () => [],
      getDetails: async () => ({}),
      scaffold: async (slug) => {
        calls.push('mcp:scaffold');
        expect(slug).toBe('wellness-therapy');
        return {
          template: {
            metadata: {
              slug,
              displayName: 'Wellness & Therapy',
              description: 'Trust-led service template.',
              category: 'services',
              useCase: ['therapy'],
              fileCount: 1,
              totalLOC: 1,
            },
            config: { palettes: [] },
          },
          files: [
            {
              path: 'src/content/site.md',
              content: 'Template copy',
              type: 'file',
            },
          ],
        };
      },
      close: async () => undefined,
    };

    const validator: SiteValidator = {
      validate: async (workspaceRoot, phase) => {
        calls.push(`validator:${phase}`);
        expect(
          await readFile(join(workspaceRoot, 'src/content/site.md'), 'utf8'),
        ).toBe('Calm Path Therapy preview');
      },
    };

    const publisher: PreviewPublisher = {
      publish: async (input) => {
        calls.push('publisher:preview');
        const content = await readFile(
          join(input.workspaceRoot, 'src/content/site.md'),
          'utf8',
        );
        return {
          previewUrl: 'https://preview.flowstarter.net/calm-path',
          artifactUrl: 's3://flowstarter-previews/calm-path.tar.gz',
          files: [{ path: 'src/content/site.md', content, type: 'file' }],
        };
      },
    };

    const pipeline = new PreviewGenerationPipeline(
      agents,
      library,
      validator,
      publisher,
    );
    const result = await pipeline.run({
      intake,
      corpus,
      cachedAssets: [
        { sourceId: 'image-1', publicPath: '/assets/portrait.webp' },
      ],
    });

    expect(result.template.slug).toBe('wellness-therapy');
    expect(result.previewUrl).toBe('https://preview.flowstarter.net/calm-path');
    expect(result.files[0]?.content).toBe('Calm Path Therapy preview');
    expect(calls).toEqual([
      'agent:brand-intelligence',
      'agent:template-selector',
      'mcp:scaffold',
      'agent:preview-builder',
      'validator:preview',
      'publisher:preview',
    ]);
    await expect(access(previewWorkspace)).rejects.toThrow();
  });

  it('retries personalization with feedback when the agent leaves the template untouched', async () => {
    const feedbacks: Array<string | undefined> = [];
    const intake = validIntake();

    const agents = {
      analyzeBrand: async () => validBrandConfig(),
      selectTemplate: async () => ({
        slug: 'wellness-therapy',
        reason: 'Fits the service journey.',
        matchedSignals: ['therapy'],
        confidence: 0.9,
      }),
      buildPreview: async (input: {
        workspaceRoot: string;
        feedback?: string;
      }) => {
        feedbacks.push(input.feedback);
        if (feedbacks.length === 1) {
          return { summary: 'No changes made', changedPaths: [] };
        }
        const source = join(input.workspaceRoot, 'src/content/site.md');
        await writeFile(source, 'Calm Path Therapy preview', 'utf8');
        return {
          summary: 'Preview tailored',
          changedPaths: ['src/content/site.md'],
        };
      },
    } as unknown as PiSdkFlowstarterAgents;

    const pipeline = new PreviewGenerationPipeline(
      agents,
      staticLibrary(),
      { validate: async () => undefined },
      staticPublisher(),
    );
    const result = await pipeline.run({
      intake,
      corpus: validCorpus(intake.projectId),
      cachedAssets: [],
    });

    expect(result.previewUrl).toBe('https://preview.flowstarter.net/static');
    expect(feedbacks).toHaveLength(2);
    expect(feedbacks[0]).toBeUndefined();
    expect(feedbacks[1]).toContain('without modifying any file');
  });

  it('gives the agent one bounded repair pass when preview validation fails', async () => {
    const feedbacks: Array<string | undefined> = [];
    let validations = 0;
    const intake = validIntake();

    const agents = {
      analyzeBrand: async () => validBrandConfig(),
      selectTemplate: async () => ({
        slug: 'wellness-therapy',
        reason: 'Fits the service journey.',
        matchedSignals: ['therapy'],
        confidence: 0.9,
      }),
      buildPreview: async (input: {
        workspaceRoot: string;
        feedback?: string;
      }) => {
        feedbacks.push(input.feedback);
        const source = join(input.workspaceRoot, 'src/content/site.md');
        await writeFile(source, 'Calm Path Therapy preview', 'utf8');
        return {
          summary: 'Preview tailored',
          changedPaths: ['src/content/site.md'],
        };
      },
    } as unknown as PiSdkFlowstarterAgents;

    const validator: SiteValidator = {
      validate: async () => {
        validations++;
        if (validations === 1) throw new Error('Astro check failed: bad frontmatter');
      },
    };

    const pipeline = new PreviewGenerationPipeline(
      agents,
      staticLibrary(),
      validator,
      staticPublisher(),
    );
    await pipeline.run({
      intake,
      corpus: validCorpus(intake.projectId),
      cachedAssets: [],
    });

    expect(validations).toBe(2);
    expect(feedbacks).toHaveLength(2);
    expect(feedbacks[1]).toContain('Astro check failed: bad frontmatter');
  });

  it('moves a deposit-paid project through the full-build agents into human QA', async () => {
    const calls: string[] = [];
    const projectId = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
    const worktreeRoot = await mkdtemp(
      join(tmpdir(), 'flowstarter-worker-test-'),
    );
    temporaryDirectories.push(worktreeRoot);

    const store: FullSiteBuildJobStore = {
      claim: async (jobId) => {
        calls.push('store:claim');
        expect(jobId).toBe('job-1');
        return {
          id: jobId,
          projectId,
          projectState: ProjectState.DEPOSIT_PAID,
          intake: validIntake(),
          brandConfig: validBrandConfig(),
          approvedPreviewFiles: [
            {
              path: 'src/content/site.md',
              content: 'Approved preview',
              type: 'file',
            },
          ],
          requiredIntegrations: ['cal.com', 'newsletter', 'lead-form'],
        };
      },
      markAgentWorking: async (_jobId, worktree) => {
        calls.push('store:agents-working');
        expect(worktree.branch).toBe(`client/flowstarter-${projectId}`);
      },
      markHumanQa: async (_jobId, result) => {
        calls.push('store:human-qa');
        expect(result).toEqual({
          commitSha: 'abc123def456',
          pullRequestUrl: 'https://github.com/flowstarter/sites/pull/42',
          stagingUrl: 'https://calm-path.preview.flowstarter.net',
        });
      },
      markFailed: async () => {
        calls.push('store:failed');
      },
    };

    const worktrees = {
      create: async (id: string) => {
        calls.push('git:create-worktree');
        expect(id).toBe(projectId);
        return {
          branch: `client/flowstarter-${projectId}`,
          path: worktreeRoot,
        };
      },
      commit: async (_worktree: unknown, message: string) => {
        calls.push('git:commit');
        expect(message).toBe(`build: initialize Flowstarter site ${projectId}`);
        expect(
          await readFile(
            join(
              worktreeRoot,
              'generated-sites',
              projectId,
              'src/pages/about.astro',
            ),
            'utf8',
          ),
        ).toContain('Human-ready full site');
        return 'abc123def456';
      },
    } as unknown as SafeGitWorktreeManager;

    const agents = {
      buildFullSite: async (input: {
        workspaceRoot: string;
        requiredIntegrations: string[];
      }) => {
        calls.push('agent:full-site-builder');
        expect(input.requiredIntegrations).toEqual([
          'cal.com',
          'newsletter',
          'lead-form',
        ]);
        expect(
          await readFile(
            join(input.workspaceRoot, 'src/content/site.md'),
            'utf8',
          ),
        ).toBe('Approved preview');
        await mkdir(join(input.workspaceRoot, 'src/pages'), {
          recursive: true,
        });
        await writeFile(
          join(input.workspaceRoot, 'src/pages/about.astro'),
          '<main>Human-ready full site</main>',
          'utf8',
        );
        return {
          summary: 'Full site built',
          changedPaths: ['src/pages/about.astro'],
        };
      },
    } as unknown as PiSdkFlowstarterAgents;

    const validator: SiteValidator = {
      validate: async (workspaceRoot, phase) => {
        calls.push(`validator:${phase}`);
        expect(phase).toBe('full');
        expect(
          await readFile(join(workspaceRoot, 'src/pages/about.astro'), 'utf8'),
        ).toContain('Human-ready full site');
      },
    };

    const pullRequests: PullRequestPublisher = {
      create: async (input) => {
        calls.push('publisher:pr-staging');
        expect(input.branch).toBe(`client/flowstarter-${projectId}`);
        expect(input.commitSha).toBe('abc123def456');
        return {
          pullRequestUrl: 'https://github.com/flowstarter/sites/pull/42',
          stagingUrl: 'https://calm-path.preview.flowstarter.net',
        };
      },
    };

    const worker = new FullSiteBuildWorker(
      store,
      worktrees,
      agents,
      validator,
      pullRequests,
    );
    await worker.run('job-1');

    expect(calls).toEqual([
      'store:claim',
      'git:create-worktree',
      'store:agents-working',
      'agent:full-site-builder',
      'validator:full',
      'git:commit',
      'publisher:pr-staging',
      'store:human-qa',
    ]);
  });

  it('refuses to build when the 20% deposit gate has not been reached', async () => {
    const calls: string[] = [];
    const store: FullSiteBuildJobStore = {
      claim: async () => ({
        id: 'job-2',
        projectId: validIntake().projectId,
        projectState: ProjectState.PREVIEW_READY,
        intake: validIntake(),
        brandConfig: validBrandConfig(),
        approvedPreviewFiles: [],
        requiredIntegrations: [],
      }),
      markAgentWorking: async () => undefined,
      markHumanQa: async () => undefined,
      markFailed: async (_jobId, error) => {
        calls.push(error.code);
      },
    };
    const worktrees = {
      create: async () => {
        calls.push('worktree-created');
        throw new Error('must not run');
      },
    } as unknown as SafeGitWorktreeManager;

    const worker = new FullSiteBuildWorker(
      store,
      worktrees,
      {} as PiSdkFlowstarterAgents,
      {} as SiteValidator,
      {} as PullRequestPublisher,
    );
    await worker.run('job-2');

    expect(calls).toEqual(['INVALID_PROJECT_STATE']);
  });
});

function staticLibrary(): TemplateLibrary {
  return {
    search: async () => [],
    getDetails: async () => ({}),
    scaffold: async (slug) => ({
      template: {
        metadata: {
          slug,
          displayName: 'Wellness & Therapy',
          description: 'Trust-led service template.',
          category: 'services',
          useCase: ['therapy'],
          fileCount: 1,
          totalLOC: 1,
        },
        config: {},
      },
      files: [
        { path: 'src/content/site.md', content: 'Template copy', type: 'file' },
      ],
    }),
    close: async () => undefined,
  };
}

function staticPublisher(): PreviewPublisher {
  return {
    publish: async () => ({
      previewUrl: 'https://preview.flowstarter.net/static',
      artifactUrl: 's3://flowstarter-previews/static.tar.gz',
      files: [],
    }),
  };
}

function validIntake(): BusinessIntakePayload {
  return {
    projectId: '0f4e1088-8d8f-4f18-83b1-406cc292b23c',
    business: {
      name: 'Calm Path Therapy',
      niche: 'Therapy practice',
      location: 'Cluj-Napoca, Romania',
      description: 'Calm, practical therapy for founders and creatives.',
      targetAudience: 'Founders and creative professionals',
      primaryGoal: 'bookings',
    },
    socialMedia: [
      {
        platform: 'instagram',
        profileUrl: 'https://www.instagram.com/calmpaththerapy',
        scraper: { provider: 'approved-worker' },
      },
      {
        platform: 'linkedin',
        profileUrl: 'https://www.linkedin.com/company/calmpaththerapy',
        scraper: { provider: 'approved-worker' },
      },
    ],
    locale: 'en-RO',
    submittedAt: '2026-08-11T10:00:00.000Z',
    consent: {
      publicProfileAnalysis: true,
      acceptedAt: '2026-08-11T10:00:00.000Z',
    },
  };
}

function validCorpus(projectId: string): ScrapeCorpus {
  return {
    projectId,
    documents: [
      {
        sourceId: 'text-1',
        platform: 'instagram',
        kind: 'caption',
        text: 'A calmer, practical way through change.',
      },
    ],
    images: [
      {
        sourceId: 'image-1',
        objectKey: 'private/calmpath/portrait.webp',
        mediaType: 'image/webp',
      },
    ],
    completedAt: '2026-08-11T10:05:00.000Z',
  };
}

function validBrandConfig(): BrandConfig {
  return {
    schemaVersion: '1.0',
    colors: {
      primary: '#19352D',
      onPrimary: '#FFFFFF',
      secondary: '#B36A44',
      onSecondary: '#FFFFFF',
      accent: '#8A3B12',
      onAccent: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#F3EEE5',
      text: '#111111',
      mutedText: '#555555',
    },
    typography: {
      headingFont: 'Newsreader',
      bodyFont: 'Source Sans 3',
      fallbackStack: 'sans-serif',
      source: 'google_fonts',
    },
    voice: {
      formality: 0.7,
      warmth: 0.88,
      energy: 0.35,
      playfulness: 0.15,
      directness: 0.66,
      adjectives: ['calm', 'credible', 'personal'],
      avoidPhrases: ['unlock your potential'],
      sampleHeadline: 'A calmer path through change.',
      sampleBody: 'Practical support for founders and creative professionals.',
      primaryCta: 'Book a session',
    },
    ideas: {
      positioning: 'Practical therapy for demanding creative work.',
      heroAngle: 'Lead with calm, relevant support.',
      sections: [
        {
          id: 'services',
          purpose: 'Explain the therapy offer.',
          evidenceSourceIds: ['text-1'],
        },
      ],
      contentThemes: ['calm support', 'practical change'],
    },
    evidence: {
      textSourceIds: ['text-1'],
      imageSourceIds: ['image-1'],
      assumptions: [],
    },
  };
}

describe('preview teaser injection', () => {
  it('injects assets and patches layouts idempotently', async () => {
    const { injectPreviewTeaser } = await import('../src/flowstarter/preview-teaser');
    const { mkdtemp, mkdir, writeFile, readFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = await mkdtemp(join(tmpdir(), 'fs-teaser-'));
    temporaryDirectories.push(root);
    await mkdir(join(root, 'src/layouts'), { recursive: true });
    await writeFile(
      join(root, 'src/layouts/Base.astro'),
      '<html><head><title>x</title></head><body><slot /></body></html>',
      'utf8',
    );

    const first = await injectPreviewTeaser(root, { keepHomeSections: 2 });
    expect(first.layoutsPatched).toBe(1);
    const layout = await readFile(join(root, 'src/layouts/Base.astro'), 'utf8');
    expect(layout).toContain('flowstarter-preview-teaser.css');
    expect(layout).toContain('flowstarter-preview-teaser.js');
    const js = await readFile(join(root, 'public/flowstarter-preview-teaser.js'), 'utf8');
    expect(js).toContain('location.pathname === \'/\' ? 2 : 1');

    // Second run must not double-inject.
    const second = await injectPreviewTeaser(root, { keepHomeSections: 2 });
    expect(second.layoutsPatched).toBe(1);
    const again = await readFile(join(root, 'src/layouts/Base.astro'), 'utf8');
    expect(again.split('flowstarter-preview-teaser.css').length).toBe(2);
  });

  it('leaves the agent boundary intact — teaser is operator code on layouts', async () => {
    const { injectPreviewTeaser } = await import('../src/flowstarter/preview-teaser');
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = await mkdtemp(join(tmpdir(), 'fs-teaser-'));
    temporaryDirectories.push(root);
    // No layouts at all: injector degrades gracefully.
    const result = await injectPreviewTeaser(root);
    expect(result.layoutsPatched).toBe(0);
  });
});

describe('rendered-audit repair loop', () => {
  it('repairs and republishes once when the audit reports a defect', async () => {
    const { PreviewGenerationPipeline } = await import('../src/flowstarter/workflows');
    const { mkdir: mkdirP, writeFile: writeF } = await import('node:fs/promises');
    const { join: joinP } = await import('node:path');

    const calls: string[] = [];
    let teardowns = 0;
    const agents = {
      analyzeBrand: async () => validBrandConfig(),
      selectTemplate: async () => ({
        slug: 'wellness-therapy', reason: 'r', matchedSignals: [], confidence: 0.9,
      }),
      buildPreview: async (input: { workspaceRoot: string; feedback?: string }) => {
        calls.push(input.feedback ? `personalize:${input.feedback.slice(0, 30)}` : 'personalize:first');
        const target = joinP(input.workspaceRoot, 'src/content/site.md');
        await mkdirP(joinP(input.workspaceRoot, 'src/content'), { recursive: true });
        await writeF(target, `# ${validIntake().business.name}`, 'utf8');
        return { summary: 'ok', changedPaths: ['src/content/site.md'] };
      },
    } as never;
    const library = {
      search: async () => [],
      getDetails: async () => ({}),
      scaffold: async () => ({
        template: { metadata: { slug: 'wellness-therapy', displayName: 'x', description: 'x', category: 'services', useCase: [], fileCount: 1, totalLOC: 1 }, config: {} },
        files: [{ path: 'src/content/site.md', content: 'seed', type: 'file' }],
      }),
      close: async () => undefined,
    } as never;
    const validator = { validate: async () => undefined } as never;
    const publisher = {
      publish: async () => {
        calls.push('publish');
        return {
          previewUrl: `http://preview/${calls.filter((c) => c === 'publish').length}`,
          artifactUrl: 'local://x',
          files: [],
          teardown: async () => { teardowns++; },
        };
      },
    } as never;

    let audits = 0;
    const pipeline = new PreviewGenerationPipeline(agents, library, validator, publisher, undefined, {
      renderedAudit: async (url: string) => {
        audits++;
        calls.push(`audit:${url}`);
        return audits === 1 ? 'hero heading renders dark-on-dark in the dark scheme' : undefined;
      },
    });

    const result = await pipeline.run({ intake: validIntake(), corpus: validCorpus(validIntake().projectId), cachedAssets: [] });

    expect(calls).toEqual([
      'personalize:first',
      'publish',
      'audit:http://preview/1',
      'personalize:A rendered review of the publi',
      'publish',
    ]);
    expect(teardowns).toBe(1);
    expect(result.previewUrl).toBe('http://preview/2');
  });
});
