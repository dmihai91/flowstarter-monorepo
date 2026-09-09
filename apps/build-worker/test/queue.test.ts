import { describe, expect, it } from 'vitest';
import { BuildQueue } from '../src/queue';

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('BuildQueue', () => {
  it('never runs more builds at once than the host was sized for', async () => {
    const gates = [deferred(), deferred(), deferred()];
    let started = 0;
    let peak = 0;
    let active = 0;

    const queue = new BuildQueue({
      concurrency: 1,
      queueLimit: 8,
      run: async () => {
        active++;
        peak = Math.max(peak, active);
        await gates[started++]!.promise;
        active--;
      },
    });

    queue.enqueue('a');
    queue.enqueue('b');
    queue.enqueue('c');
    expect(queue.stats).toEqual({ active: 1, waiting: 2 });

    for (const gate of gates) {
      gate.resolve();
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    await queue.drain();

    expect(peak).toBe(1);
    expect(started).toBe(3);
  });

  it('collapses a duplicate dispatch of a job that is already in flight', async () => {
    const gate = deferred();
    let runs = 0;
    const queue = new BuildQueue({
      concurrency: 2,
      queueLimit: 8,
      run: async () => {
        runs++;
        await gate.promise;
      },
    });

    expect(queue.enqueue('job-1')).toBe('accepted');
    expect(queue.enqueue('job-1')).toBe('duplicate');

    gate.resolve();
    await queue.drain();
    expect(runs).toBe(1);
  });

  it('re-accepts a job once its previous run has settled', async () => {
    const queue = new BuildQueue({
      concurrency: 1,
      queueLimit: 8,
      run: async () => undefined,
    });

    expect(queue.enqueue('job-1')).toBe('accepted');
    await queue.drain();
    expect(queue.enqueue('job-1')).toBe('accepted');
    await queue.drain();
  });

  it('rejects new work past the queue limit instead of unbounded buffering', async () => {
    const gate = deferred();
    const queue = new BuildQueue({
      concurrency: 1,
      queueLimit: 2,
      run: async () => {
        await gate.promise;
      },
    });

    expect(queue.enqueue('a')).toBe('accepted');
    expect(queue.enqueue('b')).toBe('accepted');
    expect(queue.enqueue('c')).toBe('accepted');
    expect(queue.enqueue('d')).toBe('full');

    gate.resolve();
    await queue.drain();
  });

  it('keeps draining after a build throws', async () => {
    const seen: string[] = [];
    const failures: string[] = [];
    const queue = new BuildQueue({
      concurrency: 1,
      queueLimit: 8,
      run: async (jobId) => {
        seen.push(jobId);
        if (jobId === 'a') throw new Error('boom');
      },
      onError: (jobId) => failures.push(jobId),
    });

    queue.enqueue('a');
    queue.enqueue('b');
    await queue.drain();

    expect(seen).toEqual(['a', 'b']);
    expect(failures).toEqual(['a']);
  });
});
