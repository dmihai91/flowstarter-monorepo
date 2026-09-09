/**
 * HTTP surface for the build worker.
 *
 * One caller, one contract: flowstarter-main's `dispatchAgentJob` POSTs
 * `{ jobId }` to `/jobs/full-site` with `Authorization: Bearer <shared secret>`
 * and gives up after 8s. Every response here is immediate: the build runs on
 * the queue behind it.
 *
 * The route carries no kind. A FULL_SITE_BUILD and a SITE_REBUILD arrive the
 * same way and the ledger row says which is which, so the worker branches on
 * what it claimed rather than on which URL somebody posted to.
 */

import { timingSafeEqual } from 'node:crypto';
import type { BuildQueue } from './queue';

export const VERSION = '0.1.0';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface WorkerRequest {
  method: string;
  path: string;
  authorization: string | undefined;
  body: string;
}

export interface WorkerResponse {
  status: number;
  body: Record<string, unknown>;
}

export function authorized(
  header: string | undefined,
  sharedSecret: string,
): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  const presented = Buffer.from(header.slice('Bearer '.length).trim(), 'utf8');
  const expected = Buffer.from(sharedSecret, 'utf8');
  // timingSafeEqual throws on a length mismatch, so the length check has to
  // come first. Secret length is not itself a secret.
  if (presented.length !== expected.length) return false;
  return timingSafeEqual(presented, expected);
}

export function handleRequest(
  request: WorkerRequest,
  deps: { sharedSecret: string; queue: BuildQueue },
): WorkerResponse {
  if (request.method === 'GET' && request.path === '/health') {
    return {
      status: 200,
      body: { ok: true, version: VERSION, ...deps.queue.stats },
    };
  }

  if (!authorized(request.authorization, deps.sharedSecret)) {
    return { status: 401, body: { error: 'unauthorized' } };
  }

  if (request.method !== 'POST' || request.path !== '/jobs/full-site') {
    return { status: 404, body: { error: 'not found' } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(request.body || '{}');
  } catch {
    return { status: 400, body: { error: 'body must be JSON' } };
  }
  const jobId = (parsed as { jobId?: unknown })?.jobId;
  if (typeof jobId !== 'string' || !UUID.test(jobId)) {
    return { status: 400, body: { error: 'jobId must be a canonical UUID' } };
  }

  switch (deps.queue.enqueue(jobId)) {
    case 'accepted':
      return { status: 202, body: { accepted: true, jobId } };
    case 'duplicate':
      // Stripe redelivery or an operator re-dispatch. The ledger claim is the
      // real guard; this just avoids a redundant round trip to Supabase.
      return { status: 202, body: { accepted: true, jobId, duplicate: true } };
    case 'full':
      return { status: 503, body: { error: 'build queue is full', jobId } };
  }
}
