/**
 * Flowstarter build worker.
 *
 * The private Pi worker named in `docs/FLOWSTARTER_AGENT_ARCHITECTURE.md`.
 * It closes the DEPOSIT_PAID -> AGENTS_WORKING -> HUMAN_QA leg of the
 * lifecycle: flowstarter-main enqueues one FULL_SITE_BUILD row per paid
 * deposit and dispatches it here, and this service drives
 * `FullSiteBuildWorker` — isolated git worktree, bounded Pi full-site session,
 * trusted validation, atomic commit, internal PR.
 *
 * It runs on the Hetzner compute host, never on Netlify: builds take minutes
 * and need a real filesystem and git.
 *
 *   POST /jobs/full-site   { "jobId": "<uuid>" }   -> 202, build runs detached
 *   GET  /health                                   -> liveness + queue depth
 *
 * Auth: `Authorization: Bearer <FLOWSTARTER_BUILD_WORKER_SECRET>`, the same
 * secret flowstarter-main signs its dispatch with.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import {
  FullSiteBuildWorker,
  PiSdkFlowstarterAgents,
  SafeGitWorktreeManager,
} from '@flowstarter/agentic-codegen';
import { ConfigError, loadConfig } from './config';
import { handleRequest, VERSION } from './http';
import { SupabaseFullSiteBuildJobStore } from './job-store';
import { GitHubPullRequestPublisher } from './pull-requests';
import { BuildQueue } from './queue';
import { CommandSiteValidator } from './validator';

const MAX_BODY_BYTES = 64 * 1024;

function loadConfigOrExit(): ReturnType<typeof loadConfig> {
  try {
    return loadConfig();
  } catch (error) {
    const detail =
      error instanceof ConfigError || error instanceof Error
        ? error.message
        : 'unknown configuration failure';
    console.error(`[build-worker] refusing to start: ${detail}`);
    process.exit(1);
  }
}

const config = loadConfigOrExit();

// SafeGitWorktreeManager.commit() shells out to `git commit`, which needs an
// identity. Setting it on the process env keeps it out of the repository's
// own config, so a worktree can never inherit a stale author.
process.env.GIT_AUTHOR_NAME ||= 'Flowstarter Build Agent';
process.env.GIT_AUTHOR_EMAIL ||= 'build-agent@flowstarter.net';
process.env.GIT_COMMITTER_NAME ||= process.env.GIT_AUTHOR_NAME;
process.env.GIT_COMMITTER_EMAIL ||= process.env.GIT_AUTHOR_EMAIL;

const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const store = new SupabaseFullSiteBuildJobStore(supabase, {
  maxAttempts: config.maxAttempts,
});
const worktrees = new SafeGitWorktreeManager({
  repositoryRoot: config.git.repositoryRoot,
  worktreesRoot: config.git.worktreesRoot,
  baseRef: config.git.baseRef,
});
const agents = new PiSdkFlowstarterAgents({
  provider: config.pi.provider,
  modelId: config.pi.modelId,
  apiKey: config.pi.apiKey,
  thinkingLevel: config.pi.thinkingLevel,
  timeoutMs: config.pi.timeoutMs,
});
const validator = new CommandSiteValidator({
  commands: config.validateCommands,
  timeoutMs: config.buildTimeoutMs,
  onProgress: (message) => console.info(`[build-worker] ${message}`),
});
const pullRequests = new GitHubPullRequestPublisher({
  apiBaseUrl: config.github.apiBaseUrl,
  owner: config.github.owner,
  repo: config.github.repo,
  token: config.github.token,
  remote: config.git.remote,
  baseRef: config.git.baseRef,
  stagingUrlTemplate: config.stagingUrlTemplate,
});

const worker = new FullSiteBuildWorker(
  store,
  worktrees,
  agents,
  validator,
  pullRequests,
);

const queue = new BuildQueue({
  concurrency: config.concurrency,
  queueLimit: config.queueLimit,
  run: async (jobId) => {
    console.info(`[build-worker] job ${jobId} started`);
    await worker.run(jobId);
    console.info(`[build-worker] job ${jobId} finished`);
  },
  // FullSiteBuildWorker has already recorded the failure on the ledger and
  // rethrown; this is the operator-facing log, not the client-facing state.
  onError: (jobId, error) =>
    console.error(
      `[build-worker] job ${jobId} failed:`,
      error instanceof Error ? error.message : error,
    ),
});

async function readBody(req: IncomingMessage): Promise<string | null> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  void (async () => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const body = await readBody(req);
    const result =
      body === null
        ? { status: 413, body: { error: 'request body is too large' } }
        : handleRequest(
            {
              method: req.method ?? 'GET',
              path,
              authorization: req.headers.authorization,
              body,
            },
            { sharedSecret: config.sharedSecret, queue },
          );
    const payload = JSON.stringify(result.body);
    res.writeHead(result.status, {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
      'cache-control': 'no-store',
    });
    res.end(payload);
  })().catch((error: unknown) => {
    console.error('[build-worker] request failed:', error);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'internal error' }));
  });
});

server.listen(config.port, config.hostname, () => {
  console.info(
    `[build-worker] v${VERSION} listening on ${config.hostname}:${config.port} ` +
      `(model ${config.pi.modelId}, concurrency ${config.concurrency}, ` +
      `repo ${config.github.owner}/${config.github.repo})`,
  );
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.info(`[build-worker] ${signal} received; finishing in-flight builds`);
    server.close();
    void queue.drain().then(() => process.exit(0));
  });
}
