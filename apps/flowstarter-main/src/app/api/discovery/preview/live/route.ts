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
  // FAST path: single-shot personalization (~60-95s) of the industry-routed
  // template, then push the built site into a Daytona sandbox for the live
  // preview (~14s). Autonomous in-sandbox agent is reserved for structural
  // edits (the 15-prompt loop), not the initial build.
  void (async () => {
    try {
      const { runCodegen } = await import('@flowstarter/agentic-codegen');
      const { previewInSandbox } = await import('@flowstarter/daytona-utils');

      if (!process.env.ANTHROPIC_API_KEY) {
        updateJob(demoId, {
          status: 'failed',
          error: 'ANTHROPIC_API_KEY missing',
        });
        return;
      }

      const gen = await runCodegen(
        {
          businessName: spec.businessName,
          industry: spec.industry,
          description: spec.description,
          targetAudience: spec.targetAudience,
          goal: spec.goal,
          brandTone: spec.brandTone,
        },
        {
          verifyBuild: false,
          keepWorkspace: true,
          onEvent: (e) =>
            updateJob(demoId, {
              phase: e.detail ? `${e.phase} — ${e.detail}` : e.phase,
            }),
        }
      );

      await recordGenerationCost({
        kind: 'codegen',
        model: 'claude-haiku-4-5',
        usage: {},
        demoId,
        ip,
      }).catch(() => {});

      if (!gen.contentChanged) {
        updateJob(demoId, {
          status: 'failed',
          error: gen.failure?.log ?? 'generation produced no changes',
        });
        await gen.cleanup().catch(() => {});
        return;
      }

      updateJob(demoId, { phase: 'Publishing your live preview' });
      const preview = await previewInSandbox(gen.buildDir, {
        projectId: demoId,
        env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
        onProgress: (_step, message) =>
          updateJob(demoId, {
            phase: message ?? 'Publishing your live preview',
          }),
      });

      if (!preview.success || !preview.previewUrl) {
        updateJob(demoId, {
          status: 'failed',
          error: preview.error ?? 'preview unavailable',
        });
        await preview.teardown().catch(() => {});
        await gen.cleanup().catch(() => {});
        return;
      }

      updateJob(demoId, {
        status: 'ready',
        previewUrl: preview.previewUrl,
        sandboxId: preview.sandboxId,
        contentFile: gen.contentFile,
        teardown: async () => {
          await preview.teardown().catch(() => {});
          await gen.cleanup().catch(() => {});
        },
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
