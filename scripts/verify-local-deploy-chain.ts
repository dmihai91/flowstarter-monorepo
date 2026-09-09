/**
 * Drives deposit → build → deploy → served site against the REAL local stack,
 * and leaves a workspace behind that a browser can open.
 *
 * The vitest suite (`full-flow-local-deploy.test.ts`) proves the same chain
 * in-process, which means it never crosses the two boundaries most likely to
 * be wrong on a laptop: Next.js middleware (CSRF, Clerk) in front of the
 * internal deploy route, and the Bun deploy-agent's real tar/serve. This
 * script crosses both. Everything below is a real process talking real HTTP:
 *
 *   this script → POST /api/webhooks/stripe (signed with the local whsec)
 *              → the running Next dev server, through middleware
 *              → dispatch to the build worker on :8787
 *              → worker builds, packs, POSTs /api/internal/build/deploy
 *              → deploySite → the Bun deploy-agent on :8443
 *              → tar -xzf into /tmp/fs-sites/<slug>
 *              → GET http://localhost:8788/<slug>/  ← what the browser opens
 *
 * The one thing it does not do is run a model: the worker is expected to be in
 * FLOWSTARTER_BUILD_STUB_AGENT=true mode, and the fixture manifest is plain
 * HTML with a no-op validate command, so no `pnpm install` or `astro build`
 * runs. Set PI_API_KEY and drop the stub flag to exercise that half for real.
 *
 * Usage:
 *   pnpm verify:local-deploy              # seed, drive, assert, keep the site
 *   pnpm verify:local-deploy --cleanup    # delete the workspace afterwards
 *
 * Prerequisites (all part of `pnpm dev` except the worker):
 *   supabase start · Next on :3000 · deploy-agent · build worker (local mode)
 * Refuses to run against anything but a local Supabase: it writes.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { injectCalComPreviewDemo } from '../packages/agentic-codegen/src/integrations';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAL_URL = 'https://cal.com/flowstarter-demo/intro';
const QUOTE_MINOR = 79_900;
const SERVER_NAME = 'local-dev';
/** deploySite uppercases this to find the secret in env. */
const SECRET_REF = 'deploy_agent_shared_secret_local_dev';

async function loadEnvLocal(): Promise<void> {
  const path = join(REPO_ROOT, 'apps/flowstarter-main/.env.local');
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match as unknown as [string, string, string];
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`${key} is required (apps/flowstarter-main/.env.local)`);
    process.exit(2);
  }
  return value;
}

let failures = 0;
function check(label: string, ok: boolean, detail?: string): void {
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`,
  );
  if (!ok) failures += 1;
}

/** The manifest the funnel approved: blurred Cal tease, no cal.com request. */
function previewFiles(): Array<{
  path: string;
  content: string;
  type: 'file';
}> {
  const pages = injectCalComPreviewDemo({
    'index.html': [
      '<!doctype html><html lang="en"><head><meta charset="utf-8">',
      '<title>Calm Path Therapy</title>',
      '<style>body{font-family:ui-sans-serif,system-ui;margin:0;padding:64px;color:#14261f;background:#f6f8f6}',
      'h1{font-size:44px;margin:0 0 12px}a{color:#1f6f4a}</style></head>',
      '<body><main><h1>Calm Path Therapy</h1>',
      '<p>Trauma-informed counselling in Cluj-Napoca.</p>',
      '<p><a href="./book/">Book a session</a></p>',
      '</main></body></html>',
    ].join(''),
    'book/index.html': [
      '<!doctype html><html lang="en"><head><meta charset="utf-8">',
      '<title>Book — Calm Path Therapy</title>',
      '<style>body{font-family:ui-sans-serif,system-ui;margin:0;padding:64px;color:#14261f;background:#f6f8f6}</style>',
      '</head><body><main><h1>Book a session</h1>',
      '<div class="book-page__calendar">Replace with your booking embed</div>',
      '</main></body></html>',
    ].join(''),
  });
  return Object.entries(pages).map(([path, content]) => ({
    path,
    content,
    type: 'file' as const,
  }));
}

async function main(): Promise<void> {
  await loadEnvLocal();

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const host = new URL(supabaseUrl).hostname;
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    console.error(`Refusing to write to non-local Supabase: ${host}`);
    process.exit(2);
  }
  const supabase = createClient(
    supabaseUrl,
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
  const mainUrl = (
    process.env.FLOWSTARTER_MAIN_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
  const siteBase = (
    process.env.FLOWSTARTER_LOCAL_SITE_BASE_URL ?? 'http://localhost:8788'
  ).replace(/\/$/, '');
  const deployAgentUrl =
    process.env.DEPLOY_AGENT_URL?.trim() || 'http://127.0.0.1:8443';

  // ── Preflight: say which process is missing rather than time out later ────
  for (const [label, url] of [
    // The Next app has no health route; its landing page is the liveness check.
    ['Next dev server', `${mainUrl}/`],
    [
      'build worker',
      `${process.env.FLOWSTARTER_BUILD_WORKER_URL ?? 'http://127.0.0.1:8787'}/health`,
    ],
    ['deploy-agent', `${deployAgentUrl}/health`],
  ] as const) {
    const reachable = await fetch(url, { signal: AbortSignal.timeout(4000) })
      .then((r) => r.ok)
      .catch(() => false);
    if (!reachable) {
      console.error(`${label} is not answering at ${url}`);
      process.exit(2);
    }
  }

  const run = randomUUID().slice(0, 8);
  const slug = `local-deploy-${run}`;

  // ── The host the deploy lands on ──────────────────────────────────────────
  // `name` carries no unique constraint (real hosts are keyed by id), so this
  // is a read-then-write rather than an upsert.
  const hostRow = {
    name: SERVER_NAME,
    provider: 'hetzner',
    location: 'local',
    server_type: 'laptop',
    status: 'active',
    status_detail: 'Local deploy-agent; not a real host.',
    ipv4: '127.0.0.1',
    deploy_agent_url: deployAgentUrl,
    deploy_agent_secret_ref: SECRET_REF,
    site_capacity: 50,
  };
  const { data: existingServer, error: serverReadError } = await supabase
    .from('hosting_servers')
    .select('id')
    .eq('name', SERVER_NAME)
    .maybeSingle();
  if (serverReadError) throw serverReadError;
  let serverId: string;
  if (existingServer) {
    const { error } = await supabase
      .from('hosting_servers')
      .update(hostRow)
      .eq('id', existingServer.id);
    if (error) throw error;
    serverId = existingServer.id;
  } else {
    const { data, error } = await supabase
      .from('hosting_servers')
      .insert(hostRow)
      .select('id')
      .single();
    if (error) throw error;
    serverId = data.id;
  }

  // ── A workspace that has been previewed, claimed and quoted ───────────────
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      slug,
      name: `Calm Path Therapy ${run}`,
      site_kind: 'astro',
      client_name: 'Ada Ionescu',
      client_email: `ada+${run}@example.com`,
      client_business_name: 'Calm Path Therapy',
      project_state: 'PREVIEW_READY',
      concierge_stage: 'brief',
      final_value_minor: QUOTE_MINOR,
      billing_currency: 'eur',
      deposit_status: 'sent',
      outstanding_payment: true,
      cal_com_url: CAL_URL,
      hosting_server_id: serverId,
      site_directory: `/tmp/fs-sites/${slug}`,
    })
    .select('id, slug')
    .single();
  if (workspaceError) throw workspaceError;
  console.log(`workspace ${workspace.slug} (${workspace.id})\n`);

  const { error: artifactError } = await supabase
    .from('flowstarter_project_artifacts')
    .upsert(
      {
        workspace_id: workspace.id,
        intake_payload: {
          projectId: workspace.id,
          business: {
            name: 'Calm Path Therapy',
            niche: 'Therapy practice',
            location: 'Cluj-Napoca, Romania',
          },
          socialMedia: [],
          locale: 'en-RO',
          submittedAt: new Date().toISOString(),
          consent: {
            publicProfileAnalysis: true,
            acceptedAt: new Date().toISOString(),
          },
        },
        brand_config: { schemaVersion: '1.0' },
        preview_manifest: { files: previewFiles() },
        template_slug: 'astro-service',
      },
      { onConflict: 'workspace_id' },
    );
  if (artifactError) throw artifactError;

  // ── The deposit, signed exactly as Stripe signs it ────────────────────────
  const paymentIntentId = `pi_local_${run}`;
  const payload = JSON.stringify({
    id: `evt_local_${run}`,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        status: 'succeeded',
        currency: 'eur',
        amount_received: Math.round(QUOTE_MINOR * 0.2),
        metadata: { kind: 'flowstarter_deposit', workspaceId: workspace.id },
      },
    },
  });
  const signature = new Stripe(
    'sk_test_verify_local',
  ).webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  const webhookResponse = await fetch(`${mainUrl}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
      'content-type': 'application/json',
    },
    body: payload,
  });
  check(
    'Stripe deposit webhook is accepted',
    webhookResponse.ok,
    `status=${webhookResponse.status} ${(await webhookResponse.text()).slice(0, 160)}`,
  );

  // ── Wait for the worker to finish the job the webhook enqueued ────────────
  const deadline = Date.now() + 180_000;
  let job: Record<string, unknown> | null = null;
  for (;;) {
    const { data, error: queryError } = await supabase
      .from('flowstarter_agent_jobs')
      .select(
        'id, status, error_code, error_detail, pull_request_url, payload, attempt_count',
      )
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    // A rejected query must not read as "the worker has not started": that
    // is how a renamed column once hid a chain that had already succeeded.
    if (queryError) {
      check(
        'build job settles',
        false,
        `job query failed: ${queryError.message}`,
      );
      break;
    }
    job = data as Record<string, unknown> | null;
    const status = job?.['status'];
    if (status && status !== 'queued' && status !== 'running') break;
    if (Date.now() > deadline) {
      check(
        'build job settles',
        false,
        `stuck at ${String(status ?? 'no job')}`,
      );
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  check(
    'build job succeeds',
    job?.['status'] === 'succeeded',
    `status=${String(job?.['status'])}${
      job?.['error_code']
        ? ` error=${String(job['error_code'])}: ${String(job['error_detail'] ?? '')}`
        : ''
    }`,
  );
  check(
    'the job records the artifact it produced',
    /\/artifacts\/.+\.tar\.gz$/.test(String(job?.['pull_request_url'] ?? '')),
    String(job?.['pull_request_url'] ?? 'none'),
  );

  // ── The ledger the operator reads ─────────────────────────────────────────
  const { data: after } = await supabase
    .from('workspaces')
    .select('project_state, deposit_status, deploy_status, last_deploy_id')
    .eq('id', workspace.id)
    .single();
  check(
    'workspace reaches HUMAN_QA',
    after?.project_state === 'HUMAN_QA',
    String(after?.project_state),
  );
  check(
    'deposit is recorded paid',
    after?.deposit_status === 'paid',
    String(after?.deposit_status),
  );
  check(
    'deploy_status is live',
    after?.deploy_status === 'live',
    String(after?.deploy_status),
  );

  const { data: deployment } = await supabase
    .from('deployments')
    .select('status, version, artifact_sha256, artifact_bytes')
    .eq('workspace_id', workspace.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  check(
    'a deployments row records the artifact',
    deployment?.status === 'live' &&
      /^[0-9a-f]{64}$/.test(String(deployment?.artifact_sha256)),
    `v${deployment?.version} ${deployment?.artifact_bytes} bytes`,
  );

  // ── The point of all of it: the site opens ────────────────────────────────
  const siteUrl = `${siteBase}/${workspace.slug}/`;
  const home = await fetch(siteUrl);
  const homeHtml = home.ok ? await home.text() : '';
  check(
    `the deployed site answers at ${siteUrl}`,
    home.ok && homeHtml.includes('Calm Path Therapy'),
    `status=${home.status}`,
  );

  const bookingUrl = `${siteUrl}book/`;
  const booking = await fetch(bookingUrl);
  const bookingHtml = booking.ok ? await booking.text() : '';
  check(
    'the booking page carries the tenant live Cal.com embed',
    bookingHtml.includes('data-flowstarter-cal-embed="true"') &&
      bookingHtml.includes('cal.com/flowstarter-demo/intro/embed'),
    `status=${booking.status}`,
  );
  check(
    'the blurred preview demo is gone from the paid build',
    bookingHtml.length > 0 &&
      !bookingHtml.includes('data-flowstarter-cal-preview'),
    bookingHtml.includes('data-flowstarter-cal-preview')
      ? 'demo still present'
      : 'replaced',
  );

  console.log(`\nOpen it:  ${siteUrl}\n          ${bookingUrl}`);

  if (process.argv.includes('--cleanup')) {
    await supabase.from('workspaces').delete().eq('id', workspace.id);
    console.log('workspace deleted (--cleanup)');
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
