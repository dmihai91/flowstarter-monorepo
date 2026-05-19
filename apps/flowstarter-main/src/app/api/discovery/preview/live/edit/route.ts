/**
 * POST /api/discovery/preview/live/edit  — apply one plain-English prompt to
 *   the live sandbox site (the T3-Code-style 15-prompt loop). Detached; the
 *   wizard polls GET. Server-enforced cap.
 * GET  ?demoId=…  — poll the current edit's status/phase.
 *
 * Reuses the demo's already-running Daytona sandbox (agent + astro dev are
 * live); HMR reflects the change in the embedded preview. Node host only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'node:path';
import { z } from 'zod';
import { recordGenerationCost } from '@/lib/ai/funnel-cost';
import { getJob, updateJob, LIVE_EDIT_CAP } from '@/lib/discovery/live-jobs';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const EditSchema = z.object({
  demoId: z.string().min(1),
  instruction: z.string().min(1).max(2000),
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
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const { demoId, instruction } = parsed.data;
  const job = getJob(demoId);

  if (!job || job.status !== 'ready' || !job.sandboxId) {
    return NextResponse.json({ error: 'demo not ready' }, { status: 409 });
  }
  if (job.editStatus === 'editing') {
    return NextResponse.json({ error: 'edit in progress' }, { status: 409 });
  }
  if (job.editsUsed >= LIVE_EDIT_CAP) {
    return NextResponse.json(
      { limitReached: true, editsUsed: job.editsUsed, editsLeft: 0 },
      { status: 200 }
    );
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  updateJob(demoId, {
    editStatus: 'editing',
    editPhase: 'Reading your request',
    editError: undefined,
  });
  const ip = clientIp(req);

  // Detached — wizard polls GET while the agent edits in the sandbox.
  void (async () => {
    try {
      // Classify: structural prompts (new pages/components/layout/interactive
      // code) need the autonomous agent; everything else (copy/palette/section
      // text — the common case) takes the fast single-shot path (~seconds).
      const structural =
        /\b(add|new|create|build|insert)\b[\s\S]*\b(page|route|component|form that|integration|api|backend|animation|carousel|slider|interactive|javascript|script|booking|calendar|map|gallery|video)\b/i.test(
          instruction
        ) ||
        /\b(re-?structure|re-?layout|re-?build|rework the (layout|structure)|new layout|change the layout|add a page|new page)\b/i.test(
          instruction
        );
      const editModel = structural ? 'claude-sonnet-4-6' : 'claude-haiku-4-5';
      const repoRoot = join(process.cwd(), '..', '..');
      const { fastEditInSandbox, editSiteInSandbox } = await import(
        '@flowstarter/daytona-utils'
      );
      updateJob(demoId, {
        editPhase: structural
          ? 'Planning a structural change'
          : 'Applying your change',
      });

      const r = structural
        ? await editSiteInSandbox(job.sandboxId!, instruction, {
            anthropicApiKey,
            model: editModel,
            env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
            onProgress: (e) =>
              updateJob(demoId, {
                editPhase: e.detail ? `${e.phase} — ${e.detail}` : e.phase,
              }),
          })
        : await fastEditInSandbox(job.sandboxId!, instruction, {
            anthropicApiKey,
            runnerPath: join(
              repoRoot,
              'packages/agentic-codegen/sandbox/fast-edit-runner.mjs'
            ),
            model: editModel,
            env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
          });

      await recordGenerationCost({
        kind: 'edit',
        model: editModel,
        usage: {},
        demoId,
        ip,
      }).catch(() => {});

      if (r.ok) {
        const cur = getJob(demoId);
        updateJob(demoId, {
          editStatus: 'done',
          editPhase: 'Applied',
          editsUsed: (cur?.editsUsed ?? job.editsUsed) + 1,
        });
      } else {
        updateJob(demoId, {
          editStatus: 'failed',
          editError: r.error ?? 'edit failed',
        });
      }
    } catch (e) {
      updateJob(demoId, {
        editStatus: 'failed',
        editError: e instanceof Error ? e.message : 'edit failed',
      });
    }
  })();

  return NextResponse.json(
    {
      accepted: true,
      editsUsed: job.editsUsed,
      editsLeft: LIVE_EDIT_CAP - job.editsUsed,
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  const demoId = req.nextUrl.searchParams.get('demoId');
  if (!demoId) {
    return NextResponse.json({ error: 'demoId required' }, { status: 400 });
  }
  const job = getJob(demoId);
  if (!job) {
    return NextResponse.json({ error: 'unknown demo' }, { status: 404 });
  }
  return NextResponse.json(
    {
      editStatus: job.editStatus ?? 'idle',
      editPhase: job.editPhase,
      editError: job.editStatus === 'failed' ? job.editError : undefined,
      editsUsed: job.editsUsed,
      editsLeft: Math.max(0, LIVE_EDIT_CAP - job.editsUsed),
    },
    { status: 200 }
  );
}
