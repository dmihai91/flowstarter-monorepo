/**
 * Stands in for github.com's pull-request API.
 *
 * The `git push` half of the publisher is NOT faked — the E2E pushes to a real
 * bare repository on disk, so branch naming, the commit-message policy and the
 * push itself are exercised for real. Only the REST call is intercepted.
 */

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface RecordedPullRequest {
  method: string;
  path: string;
  body: Record<string, unknown>;
  authorization: string | undefined;
}

export interface FakeGitHub {
  url: string;
  requests: RecordedPullRequest[];
  /** Force the next POST /pulls to answer 422, as GitHub does for a re-push. */
  failNextCreateWith422(): void;
  close(): Promise<void>;
}

export async function startFakeGitHub(): Promise<FakeGitHub> {
  const requests: RecordedPullRequest[] = [];
  let pullNumber = 41;
  let next422 = false;

  const server: Server = createServer((req, res) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString('utf8');
      const path = req.url ?? '/';
      const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

      requests.push({
        method: req.method ?? 'GET',
        path,
        body,
        authorization: req.headers.authorization,
      });

      const send = (status: number, payload: unknown) => {
        const text = JSON.stringify(payload);
        res.writeHead(status, {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(text),
        });
        res.end(text);
      };

      if (req.method === 'POST' && path.endsWith('/pulls')) {
        if (next422) {
          next422 = false;
          return send(422, {
            message: 'Validation Failed',
            errors: [{ message: 'A pull request already exists' }],
          });
        }
        pullNumber += 1;
        return send(201, {
          number: pullNumber,
          html_url: `https://github.com/flowstarter/sites/pull/${pullNumber}`,
        });
      }

      if (req.method === 'GET' && path.includes('/pulls?')) {
        return send(200, [
          {
            number: pullNumber,
            html_url: `https://github.com/flowstarter/sites/pull/${pullNumber}`,
          },
        ]);
      }

      return send(404, { message: 'fake-github: not found' });
    })().catch(() => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'fake-github error' }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    failNextCreateWith422: () => {
      next422 = true;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
