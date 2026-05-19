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
  // PROGRESSIVE path: show the matched industry template LIVE first (~15-40s),
  // then single-shot personalize and hot-swap the content into the running
  // sandbox via HMR — the visitor watches a real site become theirs instead
  // of waiting on a blank screen.
  void (async () => {
    try {
      const { selectBaseTemplateSmart, createWorkspace, generateSiteContent } =
        await import('@flowstarter/agentic-codegen');
      const { previewInSandbox, pushFileToSandbox } = await import(
        '@flowstarter/daytona-utils'
      );

      if (!process.env.ANTHROPIC_API_KEY) {
        updateJob(demoId, { status: 'failed', error: 'ANTHROPIC_API_KEY missing' });
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

      updateJob(demoId, { phase: 'Choosing the best template for you' });
      const base = await selectBaseTemplateSmart(codegenSpec);
      const ws = await createWorkspace(base);
      const cleanupAll = (extra?: () => Promise<void>) => async () => {
        if (extra) await extra().catch(() => {});
        await ws.cleanup().catch(() => {});
      };

      // 1) Bring the BASE template up live, fast.
      updateJob(demoId, { phase: 'Building your live preview' });
      const preview = await previewInSandbox(ws.buildDir, {
        projectId: demoId,
        env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
        onProgress: (_s, message) =>
          updateJob(demoId, { phase: message ?? 'Building your live preview' }),
      });
      if (!preview.success || !preview.previewUrl) {
        updateJob(demoId, {
          status: 'failed',
          error: preview.error ?? 'preview unavailable',
        });
        await cleanupAll(preview.teardown)();
        return;
      }

      // Visitor now sees a real, on-vertical site immediately.
      updateJob(demoId, {
        status: 'ready',
        previewUrl: preview.previewUrl,
        sandboxId: preview.sandboxId,
        contentFile: ws.contentFile,
        personalized: false,
        phase: 'Personalizing it for your business…',
        teardown: cleanupAll(preview.teardown),
      });

      // 2) Personalize, then hot-swap into the running sandbox (HMR).
      const gen = await generateSiteContent(codegenSpec, ws.contentBefore);
      await recordGenerationCost({
        kind: 'codegen',
        model: 'claude-haiku-4-5',
        usage: {},
        demoId,
        ip,
      }).catch(() => {});

      if (gen.ok && gen.content && preview.sandboxId) {
        const pushed = await pushFileToSandbox(
          preview.sandboxId,
          base.contentFileRel,
          gen.content,
          { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY }
        );
        updateJob(demoId, {
          personalized: pushed,
          phase: pushed
            ? 'Done — your site is ready'
            : 'Showing the starting template (personalization unavailable)',
        });
      } else {
        // Fail-soft: the base template is still a real, relevant site.
        updateJob(demoId, {
          personalized: false,
          phase: 'Showing the starting template (personalization unavailable)',
        });
      }
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
      personalized: job.personalized ?? false,
      previewUrl: job.status === 'ready' ? job.previewUrl : undefined,
      editsUsed: job.editsUsed,
      error: job.status === 'failed' ? job.error : undefined,
    },
    { status: 200 }
  );
}
