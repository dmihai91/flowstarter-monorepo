/**
 * Which job the current async call chain belongs to, and where its log goes.
 *
 * The validator and the publisher are trusted machine steps several frames
 * below the queue: they print what they are doing but have no idea which build
 * they are printing for. Threading a job id through every constructor would
 * mean rebuilding them per job. An AsyncLocalStorage keeps the wiring where it
 * belongs — the queue enters the scope once, and anything running underneath
 * can ask.
 *
 * `machineLog` is the deliberate seam between "printed to the console" and
 * "on the build's record". Lines written before the worker has claimed the job
 * (the queue's own "started" line) are held in a small buffer and replayed
 * when the sink arrives, so the log starts where the job did.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { JobLogWriter } from '@flowstarter/agentic-codegen';

const storage = new AsyncLocalStorage<{ jobId: string }>();

/** Lines held for a job whose log sink does not exist yet. */
const PENDING_LINE_LIMIT = 100;

const writers = new Map<string, JobLogWriter>();
const pending = new Map<string, string[]>();

/** Runs `fn` with `jobId` as the ambient job for everything it awaits. */
export function runWithJob<T>(jobId: string, fn: () => Promise<T>): Promise<T> {
  return storage.run({ jobId }, fn);
}

/** The job the current call chain belongs to, if it belongs to one. */
export function currentJobId(): string | undefined {
  return storage.getStore()?.jobId;
}

/**
 * Points this job's machine log at `writer` and replays whatever was said
 * before it existed. The caller unregisters with {@link detachMachineLog}.
 */
export function attachMachineLog(jobId: string, writer: JobLogWriter): void {
  writers.set(jobId, writer);
  const held = pending.get(jobId);
  pending.delete(jobId);
  for (const text of held ?? []) writer.write({ source: 'machine', text });
}

/** Forgets this job's log sink and anything still buffered for it. */
export function detachMachineLog(jobId: string): void {
  writers.delete(jobId);
  pending.delete(jobId);
}

/** The registered writer for a job, for a caller that has to flush it. */
export function machineLogWriter(jobId: string): JobLogWriter | undefined {
  return writers.get(jobId);
}

/**
 * Records one machine line against the ambient job. Outside a job scope this
 * is a no-op: the console already has it, and there is no build to attach it
 * to.
 */
export function machineLog(text: string): void {
  const jobId = currentJobId();
  if (!jobId) return;
  const writer = writers.get(jobId);
  if (writer) {
    writer.write({ source: 'machine', text });
    return;
  }
  const held = pending.get(jobId) ?? [];
  if (held.length >= PENDING_LINE_LIMIT) return;
  held.push(text);
  pending.set(jobId, held);
}
