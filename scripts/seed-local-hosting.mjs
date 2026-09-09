#!/usr/bin/env node
/**
 * Register the local deploy-agent as a hosting server, and optionally allocate
 * a workspace to it.
 *
 * `deploySite` refuses to run for a workspace with no `hosting_server_id`, and
 * on a laptop nothing has ever provisioned one — WS-D (Hetzner) is a separate,
 * money-gated workstream. This inserts the row the deploy path needs so the
 * ledger → build → deploy → serve chain can be driven locally against the
 * deploy-agent mprocs already starts.
 *
 * Usage:
 *   node scripts/seed-local-hosting.mjs                       # server row only
 *   node scripts/seed-local-hosting.mjs --workspace <uuid>    # + allocate
 *   node scripts/seed-local-hosting.mjs --slug <workspace-slug>
 *
 * Env (read from apps/flowstarter-main/.env.local when present):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DEPLOY_AGENT_URL        default http://127.0.0.1:8443
 *   DEPLOY_AGENT_SITES_ROOT default /tmp/fs-sites
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVER_NAME = 'local-dev';
/** deploySite uppercases this to find the secret in env. */
const SECRET_REF = 'deploy_agent_shared_secret_local_dev';

async function loadEnvLocal() {
  const path = join(REPO_ROOT, 'apps/flowstarter-main/.env.local');
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  await loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const deployAgentUrl =
    process.env.DEPLOY_AGENT_URL?.trim() || 'http://127.0.0.1:8443';
  const sitesRoot =
    process.env.DEPLOY_AGENT_SITES_ROOT?.trim() || '/tmp/fs-sites';

  const { data: existing, error: readError } = await supabase
    .from('hosting_servers')
    .select('id, status, deploy_agent_url')
    .eq('name', SERVER_NAME)
    .maybeSingle();
  if (readError) throw readError;

  const row = {
    name: SERVER_NAME,
    provider: 'hetzner',
    location: 'local',
    server_type: 'laptop',
    status: 'active',
    status_detail: 'Local deploy-agent started by mprocs; not a real host.',
    ipv4: '127.0.0.1',
    deploy_agent_url: deployAgentUrl,
    deploy_agent_secret_ref: SECRET_REF,
    site_capacity: 50,
  };

  let serverId;
  if (existing) {
    const { error } = await supabase
      .from('hosting_servers')
      .update(row)
      .eq('id', existing.id);
    if (error) throw error;
    serverId = existing.id;
    console.log(`updated hosting_servers "${SERVER_NAME}" (${serverId})`);
  } else {
    const { data, error } = await supabase
      .from('hosting_servers')
      .insert(row)
      .select('id')
      .single();
    if (error) throw error;
    serverId = data.id;
    console.log(`created hosting_servers "${SERVER_NAME}" (${serverId})`);
  }

  const workspaceId = arg('workspace');
  const slug = arg('slug');
  if (!workspaceId && !slug) {
    console.log('\nNo --workspace/--slug given; server row only.');
    printNextSteps(deployAgentUrl, sitesRoot);
    return;
  }

  const query = supabase.from('workspaces').select('id, slug');
  const { data: workspace, error: wsError } = await (workspaceId
    ? query.eq('id', workspaceId)
    : query.eq('slug', slug)
  ).maybeSingle();
  if (wsError) throw wsError;
  if (!workspace) {
    console.error(`workspace ${workspaceId ?? slug} not found`);
    process.exit(1);
  }

  const { error: allocError } = await supabase
    .from('workspaces')
    .update({
      hosting_server_id: serverId,
      site_directory: `${sitesRoot}/${workspace.slug}`,
    })
    .eq('id', workspace.id);
  if (allocError) throw allocError;
  console.log(
    `allocated workspace ${workspace.slug} (${workspace.id}) to ${SERVER_NAME}`
  );
  printNextSteps(deployAgentUrl, sitesRoot, workspace.slug);
}

function printNextSteps(deployAgentUrl, sitesRoot, slug) {
  console.log(
    [
      '',
      'Local hosting is wired. Required env in apps/flowstarter-main/.env.local:',
      `  DEPLOY_AGENT_SHARED_SECRET=dev-secret     # must match the deploy-agent proc`,
      `  FLOWSTARTER_LOCAL_SITE_BASE_URL=http://localhost:8788`,
      '',
      `deploy-agent API:   ${deployAgentUrl}`,
      `extracted sites:    ${sitesRoot}/{slug}/`,
      `served at:          http://localhost:8788/{slug}/`,
      ...(slug ? ['', `this workspace:     http://localhost:8788/${slug}/`] : []),
    ].join('\n')
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
