/**
 * POST /api/discovery/preview/live   — start a real, sandbox-hosted demo
 * GET  /api/discovery/preview/live?demoId=…  — poll its status
 *
 * Runs the headless Pi SDK pipeline (brand intelligence → MCP template
 * selection → bounded template personalization) and publishes the result to
 * Daytona. Work runs detached;
 * POST returns a demoId immediately and the wizard polls GET (the build-step
 * checklist covers the wait). Fails open: budget-blocked / engine or sandbox
 * error → { skip:true }, so step-7 falls back to the deterministic JSON demo
 * and the funnel never dead-ends.
 *
 * Node runtime + long maxDuration: Pi needs a filesystem and multiple model
 * turns, so this must run on a durable Node host rather than a short function.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, symlink } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import { funnelBudgetState, recordGenerationCost } from '@/lib/ai/funnel-cost';
import { createJob, getJob, updateJob } from '@/lib/discovery/live-jobs';
import type {
  BusinessIntakePayload,
  PreviewPublisher,
  ScrapeCorpus,
  SiteValidator,
  TemplateScaffoldFile,
} from '@flowstarter/agentic-codegen';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SpecSchema = z.object({
  businessName: z.string().max(200).optional().default(''),
  fullName: z.string().max(200).optional().default(''),
  description: z.string().min(1).max(5000),
  industry: z.string().max(200).optional().default(''),
  targetAudience: z.string().max(500).optional().default(''),
  goal: z.string().max(400).optional().default(''),
  brandTone: z.string().max(400).optional().default(''),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function buildPiEvidence(
  demoId: string,
  spec: z.infer<typeof SpecSchema>
): { intake: BusinessIntakePayload; corpus: ScrapeCorpus } {
  const submittedAt = new Date().toISOString();
  const intake: BusinessIntakePayload = {
    projectId: demoId,
    business: {
      name: spec.businessName.trim(),
      niche: spec.industry.trim() || 'Service business',
      location: 'Not provided',
      description: spec.description.trim(),
      targetAudience: spec.targetAudience.trim() || undefined,
      primaryGoal: spec.goal.trim() || undefined,
    },
    socialMedia: [],
    locale: 'en',
    submittedAt,
    consent: {
      publicProfileAnalysis: false,
      acceptedAt: '',
    },
  };
  const corpus: ScrapeCorpus = {
    projectId: demoId,
    completedAt: submittedAt,
    documents: [
      {
        sourceId: 'intake-description',
        platform: 'intake',
        kind: 'intake_answer',
        text: [
          `Business: ${spec.businessName.trim()}`,
          `Industry: ${spec.industry.trim() || 'Not provided'}`,
          `Description: ${spec.description.trim()}`,
          `Audience: ${spec.targetAudience.trim() || 'Not provided'}`,
          `Goal: ${spec.goal.trim() || 'Not provided'}`,
          `Desired tone: ${spec.brandTone.trim() || 'Not provided'}`,
        ].join('\n'),
      },
    ],
    images: [],
  };
  return { intake, corpus };
}

async function readPreviewFiles(root: string): Promise<TemplateScaffoldFile[]> {
  const files: TemplateScaffoldFile[] = [];
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git'))
        continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        files.push({
          path: relative(root, absolute).split(sep).join('/'),
          content: await readFile(absolute, 'utf8'),
          type: 'file',
        });
      }
    }
  }
  await walk(root);
  return files;
}

async function reserveLocalPort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '0.0.0.0', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) =>
        error || port === 0
          ? reject(error ?? new Error('No local preview port'))
          : resolvePort(port)
      );
    });
  });
}

async function publishLocalPreview(input: {
  projectId: string;
  templateSlug: string;
  workspaceRoot: string;
}): Promise<{
  previewUrl: string;
  artifactUrl: string;
  teardown: () => Promise<void>;
}> {
  if (process.env.FLOWSTARTER_LOCAL_PREVIEW !== 'true') {
    throw new Error('Local preview publishing is disabled');
  }
  const templateRoot =
    process.env.FLOWSTARTER_TEMPLATE_ROOT?.trim() ||
    resolve(process.cwd(), '../flowstarter-templates');
  const dependencies = resolve(
    templateRoot,
    input.templateSlug,
    'node_modules'
  );
  const localParent = join(tmpdir(), 'flowstarter-local-previews');
  const localRoot = join(localParent, input.projectId);
  await mkdir(localParent, { recursive: true });
  await rm(localRoot, { recursive: true, force: true });
  await cp(input.workspaceRoot, localRoot, { recursive: true });
  await symlink(dependencies, join(localRoot, 'node_modules'), 'dir');

  const port = await reserveLocalPort();
  const astroCli = resolve(dependencies, '.bin', 'astro');
  const child = spawn(
    astroCli,
    ['dev', '--host', '0.0.0.0', '--port', String(port)],
    {
      cwd: localRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    }
  );
  let launchOutput = '';
  const captureLaunchOutput = (chunk: Buffer) => {
    launchOutput = `${launchOutput}${chunk.toString('utf8')}`.slice(-4_000);
  };
  child.stdout?.on('data', captureLaunchOutput);
  child.stderr?.on('data', captureLaunchOutput);
  const teardown = async () => {
    if (!child.killed) child.kill('SIGTERM');
    await rm(localRoot, { recursive: true, force: true });
  };

  let ready = false;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Astro is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  if (!ready) {
    await teardown();
    const diagnostic = launchOutput.trim().replace(/\s+/g, ' ').slice(-1_000);
    throw new Error(
      `Local preview server did not become ready${
        diagnostic ? `: ${diagnostic}` : ''
      }`
    );
  }

  const host =
    process.env.FLOWSTARTER_LOCAL_PREVIEW_HOST?.trim() || '127.0.0.1';
  return {
    previewUrl: `http://${host}:${port}`,
    artifactUrl: `local://${localRoot}`,
    teardown,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ skip: true }, { status: 200 });
  }
  const parsed = SpecSchema.safeParse(body);
  if (!parsed.success || !parsed.data.businessName.trim()) {
    return NextResponse.json({ skip: true }, { status: 200 });
  }

  // Budget kill-switch: over the monthly cap → deterministic demo instead.
  // Over the soft threshold → 'degrade' so the orchestrator runs in lite mode
  // (single Kimi pass, no Sonnet brain) to keep spending bounded.
  let budgetState: 'ok' | 'degrade' | 'blocked' = 'ok';
  try {
    const budget = await funnelBudgetState();
    if (budget.state === 'blocked') {
      return NextResponse.json({ skip: true }, { status: 200 });
    }
    budgetState = budget.state;
  } catch {
    /* fail-safe: continue */
  }

  const demoId = randomUUID();
  createJob(demoId);
  const ip = clientIp(req);
  const spec = parsed.data;

  // Detached: do NOT await. The wizard polls GET while the Pi agent analyzes
  // the brand, selects an approved MCP template, edits only its isolated
  // workspace, validates it, and publishes the result to Daytona.
  void (async () => {
    let closeLibrary: (() => Promise<void>) | undefined;
    try {
      const {
        FlowstarterMcpTemplateLibrary,
        PiSdkFlowstarterAgents,
        PreviewGenerationPipeline,
      } = await import('@flowstarter/agentic-codegen');
      const { previewInSandbox } = await import('@flowstarter/daytona-utils');

      const piApiKey =
        process.env.PI_API_KEY?.trim() ||
        process.env.OPENROUTER_API_KEY?.trim();
      const mcpUrl = process.env.FLOWSTARTER_MCP_URL?.trim();
      const mcpToken = process.env.FLOWSTARTER_MCP_INTERNAL_TOKEN?.trim();
      if (!piApiKey || !mcpUrl || !mcpToken || !process.env.DAYTONA_API_KEY) {
        updateJob(demoId, {
          status: 'failed',
          error: 'Pi preview infrastructure is not configured',
        });
        return;
      }

      const agents = new PiSdkFlowstarterAgents({
        provider: process.env.PI_PROVIDER?.trim() || 'openrouter',
        modelId: process.env.PI_MODEL?.trim() || 'z-ai/glm-5.2',
        apiKey: piApiKey,
        thinkingLevel: 'low',
        timeoutMs: 240_000,
      });
      const library = new FlowstarterMcpTemplateLibrary({
        endpoint: mcpUrl,
        internalToken: mcpToken,
      });
      closeLibrary = () => library.close();

      const validator: SiteValidator = {
        validate: async (workspaceRoot, phase) => {
          if (phase !== 'preview')
            throw new Error('Unexpected validation phase');
          const files = await readPreviewFiles(workspaceRoot);
          const paths = new Set(files.map((file) => file.path));
          if (!paths.has('package.json'))
            throw new Error('Selected template has no package manifest');
          if (!Array.from(paths).some((path) => path.startsWith('src/')))
            throw new Error('Selected template has no source files');
          const manifest = JSON.parse(
            files.find((file) => file.path === 'package.json')?.content ?? '{}'
          ) as { scripts?: Record<string, unknown> };
          if (!manifest.scripts?.dev && !manifest.scripts?.start)
            throw new Error('Selected template has no preview command');
        },
      };

      const publisher: PreviewPublisher = {
        publish: async (input) => {
          const files = await readPreviewFiles(input.workspaceRoot);
          const preview = await previewInSandbox(input.workspaceRoot, {
            projectId: input.projectId,
            env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
            onProgress: () =>
              updateJob(demoId, { phase: 'Publishing your live preview' }),
          });
          if (!preview.success || !preview.previewUrl || !preview.sandboxId) {
            await preview.teardown().catch(() => {});
            if (process.env.FLOWSTARTER_LOCAL_PREVIEW === 'true') {
              try {
                const local = await publishLocalPreview({
                  projectId: input.projectId,
                  templateSlug: input.template.slug,
                  workspaceRoot: input.workspaceRoot,
                });
                return { ...local, files };
              } catch (localError) {
                throw new Error(
                  `${
                    preview.error ?? 'Preview sandbox unavailable'
                  }; local fallback: ${
                    localError instanceof Error
                      ? localError.message
                      : 'unknown error'
                  }`
                );
              }
            }
            throw new Error(preview.error ?? 'Preview sandbox unavailable');
          }
          return {
            previewUrl: preview.previewUrl,
            artifactUrl: `daytona://${preview.sandboxId}`,
            files,
            sandboxId: preview.sandboxId,
            teardown: preview.teardown,
          };
        },
      };

      const pipeline = new PreviewGenerationPipeline(
        agents,
        library,
        validator,
        publisher
      );
      const evidence = buildPiEvidence(demoId, spec);
      const result = await pipeline.run({
        ...evidence,
        cachedAssets: [],
        onPhase: (phase) => updateJob(demoId, { phase }),
      });

      updateJob(demoId, {
        status: 'ready',
        previewUrl: result.previewUrl,
        sandboxId: result.sandboxId,
        personalized: true,
        phase: 'Done — your site is ready',
        teardown: result.teardown,
      });
      await recordGenerationCost({
        kind: 'codegen',
        model: process.env.PI_MODEL?.trim() || 'z-ai/glm-5.2',
        demoId,
        ip,
      }).catch(() => {});
    } catch (e) {
      updateJob(demoId, {
        status: 'failed',
        error: e instanceof Error ? e.message : 'live demo error',
      });
    } finally {
      await closeLibrary?.().catch(() => {});
    }
  })();

  return NextResponse.json({ demoId, status: 'building' }, { status: 200 });
}

export async function GET(req: NextRequest) {
  // Prewarm path: load the heavy codegen + sandbox module graph into this
  // container so the first real visitor doesn't pay the multi-second import
  // cost. No generation runs, no AI/Daytona calls are made — we only resolve
  // the dynamic imports the POST handler depends on. Hit by the scheduled
  // prewarm function (netlify/functions/prewarm.mjs).
  if (req.nextUrl.searchParams.get('warm') === '1') {
    try {
      await Promise.all([
        import('@flowstarter/agentic-codegen'),
        import('@flowstarter/daytona-utils'),
      ]);
      return NextResponse.json({ warmed: true }, { status: 200 });
    } catch {
      return NextResponse.json({ warmed: false }, { status: 200 });
    }
  }

  const demoId = req.nextUrl.searchParams.get('demoId');
  if (!demoId)
    return NextResponse.json({ error: 'demoId required' }, { status: 400 });
  const job = getJob(demoId);
  if (!job)
    return NextResponse.json(
      { status: 'failed', error: 'unknown demo' },
      { status: 200 }
    );
  return NextResponse.json(
    {
      status: job.status,
      phase: job.phase,
      personalized: job.personalized ?? false,
      previewUrl: job.status === 'ready' ? job.previewUrl : undefined,
      editsUsed: job.editsUsed,
      error: job.status === 'failed' ? job.error : undefined,
    },
    { status: 200 }
  );
}
