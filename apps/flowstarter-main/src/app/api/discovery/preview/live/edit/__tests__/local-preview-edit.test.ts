/**
 * Regression: a ready local-preview job (localRoot set, no Daytona sandbox)
 * must accept prompt edits. Before the fix the route demanded job.sandboxId
 * and every prompt in FLOWSTARTER_LOCAL_PREVIEW mode got 409 "demo not ready"
 * — filmed live in showcase clip 04.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createJob, updateJob, getJob } from '@/lib/discovery/live-jobs';
import { POST } from '../route';

vi.mock('server-only', () => ({}));

const fastEditLocal = vi.fn(async () => ({
  ok: true,
  costUsd: 0.01,
  tokensIn: 100,
  tokensOut: 50,
}));
vi.mock('@/lib/discovery/local-fast-edit', () => ({
  fastEditLocal: (...args: unknown[]) => fastEditLocal(...(args as [])),
}));
vi.mock('@flowstarter/daytona-utils', () => ({
  fastEditInSandbox: vi.fn(async () => ({ ok: false, error: 'not local' })),
  editSiteInSandbox: vi.fn(async () => ({ ok: false, error: 'not local' })),
}));
vi.mock('@/lib/ai/funnel-cost', () => ({
  recordGenerationCost: vi.fn(async () => undefined),
}));

function editRequest(demoId: string, instruction: string): NextRequest {
  return new NextRequest('http://localhost/api/discovery/preview/live/edit', {
    method: 'POST',
    body: JSON.stringify({ demoId, instruction }),
    headers: { 'Content-Type': 'application/json' },
  });
}

async function editSettled(demoId: string): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const status = getJob(demoId)?.editStatus;
    if (status === 'done' || status === 'failed') return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('edit never settled');
}

describe('POST /api/discovery/preview/live/edit — local preview mode', () => {
  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    fastEditLocal.mockClear();
  });

  it('accepts a content edit for a job backed only by a local workspace', async () => {
    const demoId = `local-${Date.now()}`;
    createJob(demoId);
    updateJob(demoId, {
      status: 'ready',
      localRoot: '/tmp/flowstarter-local-previews/test',
    });

    const res = await POST(
      editRequest(demoId, 'Make the headline warmer and mention the free call.')
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accepted?: boolean };
    expect(body.accepted).toBe(true);

    await editSettled(demoId);
    expect(getJob(demoId)?.editStatus).toBe('done');
    expect(fastEditLocal).toHaveBeenCalledTimes(1);
  });

  it('still refuses a job with neither sandbox nor local workspace', async () => {
    const demoId = `none-${Date.now()}`;
    createJob(demoId);
    updateJob(demoId, { status: 'ready' });

    const res = await POST(editRequest(demoId, 'Anything at all.'));
    expect(res.status).toBe(409);
  });

  it('fails a structural prompt honestly when there is no sandbox', async () => {
    const demoId = `struct-${Date.now()}`;
    createJob(demoId);
    updateJob(demoId, {
      status: 'ready',
      localRoot: '/tmp/flowstarter-local-previews/test',
    });

    const res = await POST(editRequest(demoId, 'Add a new page for bookings'));
    expect(res.status).toBe(200);

    await editSettled(demoId);
    const job = getJob(demoId);
    expect(job?.editStatus).toBe('failed');
    expect(job?.editError).toBe('structural edits unavailable');
    expect(fastEditLocal).not.toHaveBeenCalled();
  });
});
