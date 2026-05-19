/**
 * POST /api/discovery/preview/live   — start a real, sandbox-hosted demo
 * GET  /api/discovery/preview/live?demoId=…  — poll its status
 *
 * Calls the agentic-codegen engine (industry-routed, ~60-95s personalization)
 * then Daytona (live `astro dev` → public preview URL). Work runs detached;
 * POST returns a demoId immediately and the wizard polls GET (the build-step
 * checklist covers the wait). Fails open: budget-blocked / engine or sandbox
 * error → { skip:true }, so step-7 falls back to the deterministic JSON demo
 * and the funnel never dead-ends.
 *
 * Node runtime + long maxDuration: this needs the `claude` binary, a
 * filesystem and ~90s — it must run on a Node host, not a short Netlify fn.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { funnelBudgetState, recordGenerationCost } from '@/lib/ai/funnel-cost';
import { createJob, getJob, updateJob } from '@/lib/discovery/live-jobs';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SpecSchema = z.object({
  businessName: z.string().max(200).optional().default(''),
  fullName: z.string().max(200).optional().default(''),
  description: z.string().min(1).max(5000),
  industry: z.string().max(200).optional().default(''),
  targetAudience: z.string().max(500).optional().default(''),
  goal: z.string().max(50).optional().default(''),
  brandTone: z.string().max(50).optional().default(''),
});

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
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
  try {
    const budget = await funnelBudgetState();
    if (budget.state === 'blocked') {
      return NextResponse.json({ skip: true }, { status: 200 });
    }
  } catch {
    /* fail-safe: continue */
  }

  const demoId = randomUUID();
  createJob(demoId);
  const ip = clientIp(req);
  const spec = parsed.data;

  // Detached: do NOT await — the wizard polls GET while progress streams.
  // Runs the autonomous Agent-SDK build INSIDE a Daytona sandbox, then
  // serves it live. The route only orchestrates Daytona (no host claude
  // binary), so this is Netlify-safe aside from duration (must run on a
  // Node host; the wizard polls, it doesn't hold the request).
  void (async () => {
    try {
      const { selectBaseTemplate, AGENT_BUILD_SYSTEM, buildAgentTask } =
        await import('@flowstarter/agentic-codegen');
      const { buildSiteInSandbox } = await import('@flowstarter/daytona-utils');

      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        updateJob(demoId, {
          status: 'failed',
          error: 'ANTHROPIC_API_KEY missing',
        });
        return;
      }

      const codegenSpec = {
        businessName: spec.businessName,
        industry: spec.industry,
        description: spec.description,
        targetAudience: spec.targetAudience,
        goal: spec.goal,
        brandTone: spec.brandTone,
      };
      // Next runtime cwd = apps/flowstarter-main → repo root is two up.
      const repoRoot = join(process.cwd(), '..', '..');
      const base = selectBaseTemplate(codegenSpec);
      const templateDir = join(repoRoot, base.rootRel);
      const runnerPath = join(
        repoRoot,
        'packages/agentic-codegen/sandbox/agent-runner.mjs'
      );

      const build = await buildSiteInSandbox(templateDir, {
        projectId: demoId,
        systemPrompt: AGENT_BUILD_SYSTEM,
        taskPrompt: buildAgentTask(codegenSpec),
        runnerPath,
        model: 'claude-sonnet-4-6',
        env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
        anthropicApiKey,
        agentTimeoutMs: 14 * 60_000,
        onProgress: (e) =>
          updateJob(demoId, {
            phase: e.detail ? `${e.phase} — ${e.detail}` : e.phase,
          }),
      });

      await recordGenerationCost({
        kind: 'codegen',
        model: 'claude-sonnet-4-6',
        usage: {},
        demoId,
        ip,
      }).catch(() => {});

      if (!build.success || !build.previewUrl) {
        updateJob(demoId, {
          status: 'failed',
          error: build.error ?? 'live build failed',
        });
        await build.teardown().catch(() => {});
        return;
      }

      updateJob(demoId, {
        status: 'ready',
        previewUrl: build.previewUrl,
        sandboxId: build.sandboxId,
        teardown: build.teardown,
      });
    } catch (e) {
      updateJob(demoId, {
        status: 'failed',
        error: e instanceof Error ? e.message : 'live demo error',
      });
    }
  })();

  return NextResponse.json({ demoId, status: 'building' }, { status: 200 });
}

export async function GET(req: NextRequest) {
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
      previewUrl: job.status === 'ready' ? job.previewUrl : undefined,
      editsUsed: job.editsUsed,
      error: job.status === 'failed' ? job.error : undefined,
    },
    { status: 200 }
  );
}
