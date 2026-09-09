import { describe, expect, it } from 'vitest';
import { authorized, handleRequest } from '../src/http';
import { BuildQueue } from '../src/queue';

const SECRET = 'x'.repeat(48);

function queueOf(outcomes: Array<'accepted' | 'duplicate' | 'full'>): BuildQueue {
  const queue = new BuildQueue({
    concurrency: 1,
    queueLimit: 4,
    run: async () => undefined,
  });
  const remaining = [...outcomes];
  queue.enqueue = () => remaining.shift() ?? 'accepted';
  return queue;
}

const JOB_ID = '4f9d5bf2-1c4a-4a2f-9d4a-4c0f0a7c2f11';

describe('build worker HTTP surface', () => {
  it('accepts a dispatch from flowstarter-main and returns before the build runs', () => {
    const response = handleRequest(
      {
        method: 'POST',
        path: '/jobs/full-site',
        authorization: `Bearer ${SECRET}`,
        body: JSON.stringify({ jobId: JOB_ID }),
      },
      { sharedSecret: SECRET, queue: queueOf(['accepted']) },
    );

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ accepted: true, jobId: JOB_ID });
  });

  it('serves health without a bearer token so the host can probe liveness', () => {
    const response = handleRequest(
      { method: 'GET', path: '/health', authorization: undefined, body: '' },
      { sharedSecret: SECRET, queue: queueOf([]) },
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, active: 0, waiting: 0 });
  });

  it('rejects a wrong, short, or missing bearer token', () => {
    for (const authorization of [
      undefined,
      'Bearer ',
      'Bearer short',
      `Bearer ${'y'.repeat(48)}`,
      SECRET,
    ]) {
      const response = handleRequest(
        {
          method: 'POST',
          path: '/jobs/full-site',
          authorization,
          body: JSON.stringify({ jobId: JOB_ID }),
        },
        { sharedSecret: SECRET, queue: queueOf(['accepted']) },
      );
      expect(response.status).toBe(401);
    }
  });

  it('refuses a job id that is not a canonical UUID', () => {
    for (const jobId of ['', 'not-a-uuid', '../../etc/passwd', 42]) {
      const response = handleRequest(
        {
          method: 'POST',
          path: '/jobs/full-site',
          authorization: `Bearer ${SECRET}`,
          body: JSON.stringify({ jobId }),
        },
        { sharedSecret: SECRET, queue: queueOf(['accepted']) },
      );
      expect(response.status).toBe(400);
    }
  });

  it('reports a full queue as 503 so the dispatcher can retry', () => {
    const response = handleRequest(
      {
        method: 'POST',
        path: '/jobs/full-site',
        authorization: `Bearer ${SECRET}`,
        body: JSON.stringify({ jobId: JOB_ID }),
      },
      { sharedSecret: SECRET, queue: queueOf(['full']) },
    );
    expect(response.status).toBe(503);
  });

  it('treats a redelivered dispatch as accepted, not as an error', () => {
    const response = handleRequest(
      {
        method: 'POST',
        path: '/jobs/full-site',
        authorization: `Bearer ${SECRET}`,
        body: JSON.stringify({ jobId: JOB_ID }),
      },
      { sharedSecret: SECRET, queue: queueOf(['duplicate']) },
    );
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ duplicate: true });
  });

  it('does not authorize a token that only shares a prefix with the secret', () => {
    expect(authorized(`Bearer ${SECRET.slice(0, 40)}`, SECRET)).toBe(false);
    expect(authorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });
});
