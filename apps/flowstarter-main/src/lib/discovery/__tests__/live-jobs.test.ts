/**
 * `reapStaleJobs` existed but nothing ever called it — every local `astro
 * dev` child (and every Daytona sandbox) a demo opened stayed up until the
 * process restarted (~12 zombies found squatting ports on 2026-08-31, per
 * project-infra-state-2026-08 memory). This covers both halves of the fix:
 * the sweep itself, and that the module now actually schedules it exactly
 * once even when `next dev` re-executes this file as a second route bundle.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type GlobalJobStore = typeof globalThis & {
  __flowstarterLiveJobs?: Map<string, unknown>;
  __flowstarterLiveJobsReaperStarted?: boolean;
};

function resetGlobalState(): void {
  const g = globalThis as GlobalJobStore;
  g.__flowstarterLiveJobs?.clear();
  delete g.__flowstarterLiveJobsReaperStarted;
}

describe('live-jobs', () => {
  beforeEach(() => {
    vi.resetModules();
    resetGlobalState();
  });

  afterEach(() => {
    resetGlobalState();
  });

  it('reapStaleJobs tears down and drops jobs past the ttl, leaving fresh ones alone', async () => {
    const { createJob, updateJob, getJob, reapStaleJobs } = await import(
      '../live-jobs'
    );
    const staleId = 'stale-demo';
    const freshId = 'fresh-demo';
    createJob(staleId);
    createJob(freshId);

    const teardown = vi.fn(async () => undefined);
    updateJob(staleId, { createdAt: Date.now() - 60 * 60_000, teardown });

    await reapStaleJobs(45 * 60_000);

    expect(teardown).toHaveBeenCalledTimes(1);
    expect(getJob(staleId)).toBeUndefined();
    expect(getJob(freshId)).toBeDefined();
  });

  it('does not let one failing teardown stop the rest of the sweep', async () => {
    const { createJob, updateJob, getJob, reapStaleJobs } = await import(
      '../live-jobs'
    );
    const failingId = 'stale-failing';
    const okId = 'stale-ok';
    createJob(failingId);
    createJob(okId);
    const old = Date.now() - 60 * 60_000;
    updateJob(failingId, {
      createdAt: old,
      teardown: vi.fn(async () => {
        throw new Error('teardown boom');
      }),
    });
    updateJob(okId, { createdAt: old, teardown: vi.fn(async () => undefined) });

    await reapStaleJobs(45 * 60_000);

    expect(getJob(failingId)).toBeUndefined();
    expect(getJob(okId)).toBeUndefined();
  });

  it('schedules exactly one reap interval even when a second bundle re-executes the module', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    try {
      await import('../live-jobs');
      // `next dev` bundles this module once per route handler; simulate a
      // second bundle re-running the same top-level code in this process.
      vi.resetModules();
      await import('../live-jobs');
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    } finally {
      setIntervalSpy.mockRestore();
    }
  });
});
