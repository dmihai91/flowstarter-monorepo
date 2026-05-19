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
      const { editSiteInSandbox } = await import('@flowstarter/daytona-utils');
      const r = await editSiteInSandbox(job.sandboxId!, instruction, {
        anthropicApiKey,
        model: 'claude-sonnet-4-6',
        env: { DAYTONA_API_KEY: process.env.DAYTONA_API_KEY },
        onProgress: (e) =>
          updateJob(demoId, {
            editPhase: e.detail ? `${e.phase} — ${e.detail}` : e.phase,
          }),
      });

      await recordGenerationCost({
        kind: 'edit',
        model: 'claude-sonnet-4-6',
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
