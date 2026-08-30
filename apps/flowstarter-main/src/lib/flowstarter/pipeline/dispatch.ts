/**
 * The one place that knows how to nudge the build worker.
 *
 * The ledger row is the commitment; this HTTP call is only a nudge. Callers
 * differ on whether a failed nudge matters: the Stripe webhook swallows it,
 * because failing the webhook over an unreachable worker would make Stripe
 * retry for days over something a retry cannot fix — leaving a job `queued`
 * with nothing running it, which is precisely what an operator needs to be
 * able to fix by hand. The operator path lets the error surface instead.
 *
 * So this throws on every failure and lets each caller choose. It never
 * creates or mutates a job row; enqueueing stays in deposit-workflow.ts,
 * behind its unique indexes.
 */

export class DispatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DispatchError';
  }
}

/**
 * POSTs an existing job id to the build worker. Throws on any failure so the
 * caller can decide whether that is fatal — for a re-dispatch it is not: the
 * row is queued either way and a poller will still reach it.
 */
export async function dispatchAgentJob(jobId: string): Promise<void> {
  const endpoint = process.env.FLOWSTARTER_BUILD_WORKER_URL;
  const secret = process.env.FLOWSTARTER_BUILD_WORKER_SECRET;
  if (!endpoint || !secret) {
    throw new DispatchError('Flowstarter build worker is not configured');
  }
  if (secret.length < 32) {
    throw new DispatchError(
      'FLOWSTARTER_BUILD_WORKER_SECRET must be at least 32 characters'
    );
  }

  const url = new URL('/jobs/full-site', endpoint);
  if (
    url.protocol !== 'https:' &&
    url.hostname !== '127.0.0.1' &&
    url.hostname !== 'localhost'
  ) {
    throw new DispatchError('Flowstarter build worker must use HTTPS');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ jobId }),
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new DispatchError(
      `Flowstarter build worker rejected job with ${response.status}`
    );
  }
}
