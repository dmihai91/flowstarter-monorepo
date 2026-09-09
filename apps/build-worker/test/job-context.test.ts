/**
 * The job-scoped machine log.
 *
 * The point of this seam is that a validator or publisher several frames down
 * an async chain can say what it is doing without being told which build it is
 * inside. Two properties matter: a line written inside a scope reaches that
 * scope's sink and no other, and a line written before the sink exists is not
 * lost — the queue announces a job before the worker has claimed it.
 */
import { describe, expect, it } from 'vitest';
import type { JobLogWriter } from '@flowstarter/agentic-codegen';
import {
  attachMachineLog,
  currentJobId,
  detachMachineLog,
  machineLog,
  machineLogWriter,
  runWithJob,
} from '../src/job-context';

function fakeWriter(): JobLogWriter & { lines: string[]; flushes: number } {
  const lines: string[] = [];
  const writer = {
    lines,
    flushes: 0,
    write: (line: { source: string; text: string }) => {
      lines.push(`${line.source}:${line.text}`);
    },
    flush: async () => {
      writer.flushes += 1;
    },
  };
  return writer as JobLogWriter & { lines: string[]; flushes: number };
}

describe('runWithJob', () => {
  it('names the ambient job for everything the scope awaits', async () => {
    expect(currentJobId()).toBeUndefined();
    const seen = await runWithJob('job-a', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentJobId();
    });
    expect(seen).toBe('job-a');
    expect(currentJobId()).toBeUndefined();
  });

  it('keeps two concurrent builds apart', async () => {
    const a = fakeWriter();
    const b = fakeWriter();
    attachMachineLog('job-a', a);
    attachMachineLog('job-b', b);
    try {
      await Promise.all([
        runWithJob('job-a', async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          machineLog('building a');
        }),
        runWithJob('job-b', async () => {
          machineLog('building b');
        }),
      ]);
      expect(a.lines).toEqual(['machine:building a']);
      expect(b.lines).toEqual(['machine:building b']);
    } finally {
      detachMachineLog('job-a');
      detachMachineLog('job-b');
    }
  });
});

describe('machineLog', () => {
  it('replays what was said before the sink was attached', async () => {
    const writer = fakeWriter();
    await runWithJob('job-c', async () => {
      machineLog('job job-c started');
      expect(writer.lines).toEqual([]);
      attachMachineLog('job-c', writer);
      machineLog('Running pnpm run build');
    });
    expect(writer.lines).toEqual([
      'machine:job job-c started',
      'machine:Running pnpm run build',
    ]);
    detachMachineLog('job-c');
  });

  it('is a no-op outside a job scope, and after the sink is detached', () => {
    const writer = fakeWriter();
    machineLog('nobody is listening');
    attachMachineLog('job-d', writer);
    detachMachineLog('job-d');
    expect(machineLogWriter('job-d')).toBeUndefined();
    expect(writer.lines).toEqual([]);
  });

  it('exposes the writer so the host can flush a finished job', async () => {
    const writer = fakeWriter();
    attachMachineLog('job-e', writer);
    await machineLogWriter('job-e')?.flush();
    expect(writer.flushes).toBe(1);
    detachMachineLog('job-e');
  });
});
