#!/usr/bin/env node
/**
 * Proves per-tenant isolation against the LOCAL Supabase stack, for real:
 * two workspaces, an asset in each, and three callers asking for them.
 *
 *   service role  -> sees both (it bypasses RLS by design)
 *   member of A   -> sees A's asset, zero rows of B's
 *   anon          -> zero rows, no table access at all
 *
 * The member's identity is a JWT minted here with the local JWT secret,
 * carrying the Clerk user id in `sub` and `role: authenticated` — the same
 * shape Clerk's session token has when it reaches PostgREST in production.
 * That is exactly what public.current_clerk_user_id() reads.
 *
 * Usage:  node scripts/verify-rls-local.mjs
 * Exits non-zero on the first failed assertion. Cleans up after itself.
 *
 * Refuses to talk to anything but 127.0.0.1/localhost. Never point this at a
 * hosted project: it writes.
 */
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// ─── Local stack configuration ─────────────────────────────────────────────

function fromSupabaseStatus() {
  try {
    const raw = execFileSync('supabase', ['status', '-o', 'json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const status = fromSupabaseStatus();
const API_URL = process.env.SUPABASE_URL ?? status.API_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? status.ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? status.SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? status.JWT_SECRET;

const host = new URL(API_URL).hostname;
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
  console.error(`Refusing to run against non-local host: ${host}`);
  process.exit(2);
}
if (!ANON_KEY || !SERVICE_KEY || !JWT_SECRET) {
  console.error(
    'Missing local keys. Start the stack with `supabase start`, or set ' +
      'SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_JWT_SECRET.'
  );
  process.exit(2);
}

// ─── Minimal HS256 JWT, no dependencies ────────────────────────────────────

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function mintClerkStyleJwt(clerkUserId) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      sub: clerkUserId, // Clerk user id — what current_clerk_user_id() reads
      role: 'authenticated', // selects the database role in PostgREST
      aud: 'authenticated',
      iat: now,
      exp: now + 600,
    })
  );
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.${signature}`;
}

// ─── REST helpers ──────────────────────────────────────────────────────────

async function rest(path, { key, token, method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers['Prefer'] = prefer;
  const response = await fetch(`${API_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: response.status, body: parsed };
}

const asService = (path, options = {}) => rest(path, { ...options, key: SERVICE_KEY });
const asAnon = (path, options = {}) => rest(path, { ...options, key: ANON_KEY });
const asMember = (path, token, options = {}) =>
  rest(path, { ...options, key: ANON_KEY, token });

// ─── Assertions ────────────────────────────────────────────────────────────

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

// ─── Fixture ───────────────────────────────────────────────────────────────

const run = randomUUID().slice(0, 8);
const userA = `user_rlscheck_a_${run}`;
const userOutsider = `user_rlscheck_out_${run}`;
const created = { workspaces: [] };

async function seed() {
  const workspaces = await asService('/workspaces', {
    method: 'POST',
    prefer: 'return=representation',
    body: [
      { slug: `rls-check-a-${run}`, name: `RLS check A ${run}`, site_kind: 'astro' },
      { slug: `rls-check-b-${run}`, name: `RLS check B ${run}`, site_kind: 'astro' },
    ],
  });
  if (workspaces.status >= 300) {
    throw new Error(`workspace insert failed: ${JSON.stringify(workspaces.body)}`);
  }
  const [a, b] = workspaces.body;
  created.workspaces.push(a.id, b.id);

  const membership = await asService('/workspace_memberships', {
    method: 'POST',
    prefer: 'return=representation',
    body: { workspace_id: a.id, clerk_user_id: userA, role: 'client' },
  });
  if (membership.status >= 300) {
    throw new Error(`membership insert failed: ${JSON.stringify(membership.body)}`);
  }

  const assets = await asService('/assets', {
    method: 'POST',
    prefer: 'return=representation',
    body: [
      { workspace_id: a.id, source: 'upload', kind: 'image', sha256: `sha-a-${run}` },
      { workspace_id: b.id, source: 'upload', kind: 'image', sha256: `sha-b-${run}` },
    ],
  });
  if (assets.status >= 300) {
    throw new Error(`asset insert failed: ${JSON.stringify(assets.body)}`);
  }
  return { a, b, assetA: assets.body[0], assetB: assets.body[1] };
}

async function cleanup() {
  for (const id of created.workspaces) {
    await asService(`/workspaces?id=eq.${id}`, { method: 'DELETE' });
  }
}

// ─── The run ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Supabase: ${API_URL}`);
  const { a, b, assetA, assetB } = await seed();
  console.log(`workspace A = ${a.id}\nworkspace B = ${b.id}\n`);

  // (a) service role sees both.
  const svc = await asService(`/assets?id=in.(${assetA.id},${assetB.id})&select=id`);
  check('service role reads both assets', svc.status === 200 && svc.body.length === 2,
    `status=${svc.status} rows=${Array.isArray(svc.body) ? svc.body.length : '?'}`);

  // (b) a member of A sees A and nothing of B.
  const tokenA = mintClerkStyleJwt(userA);
  const memberA = await asMember(`/assets?workspace_id=eq.${a.id}&select=id,sha256`, tokenA);
  check("member of A reads A's asset", memberA.status === 200 && memberA.body.length === 1,
    `status=${memberA.status} rows=${Array.isArray(memberA.body) ? memberA.body.length : JSON.stringify(memberA.body)}`);

  const memberACrossTenant = await asMember(`/assets?workspace_id=eq.${b.id}&select=id`, tokenA);
  check("member of A reads ZERO of B's assets",
    memberACrossTenant.status === 200 && memberACrossTenant.body.length === 0,
    `status=${memberACrossTenant.status} rows=${Array.isArray(memberACrossTenant.body) ? memberACrossTenant.body.length : JSON.stringify(memberACrossTenant.body)}`);

  const memberAAll = await asMember(`/assets?id=in.(${assetA.id},${assetB.id})&select=id`, tokenA);
  check('unfiltered select leaks nothing across tenants',
    memberAAll.status === 200 && memberAAll.body.length === 1 && memberAAll.body[0].id === assetA.id,
    `status=${memberAAll.status} rows=${Array.isArray(memberAAll.body) ? memberAAll.body.length : JSON.stringify(memberAAll.body)}`);

  // A signed-in user with no membership at all sees nothing.
  const tokenOutsider = mintClerkStyleJwt(userOutsider);
  const outsider = await asMember(`/assets?id=in.(${assetA.id},${assetB.id})&select=id`, tokenOutsider);
  check('authenticated non-member reads zero assets',
    outsider.status === 200 && outsider.body.length === 0,
    `status=${outsider.status} rows=${Array.isArray(outsider.body) ? outsider.body.length : JSON.stringify(outsider.body)}`);

  // (c) anon gets nothing.
  const anon = await asAnon(`/assets?id=in.(${assetA.id},${assetB.id})&select=id`);
  check('anon reads zero assets',
    anon.status === 401 || anon.status === 403 || (anon.status === 200 && anon.body.length === 0),
    `status=${anon.status} body=${JSON.stringify(anon.body)}`);

  // Workspace row visibility follows membership.
  const wsA = await asMember(`/workspaces?id=eq.${a.id}&select=id`, tokenA);
  check('member of A reads workspace A', wsA.status === 200 && wsA.body.length === 1,
    `status=${wsA.status} rows=${Array.isArray(wsA.body) ? wsA.body.length : JSON.stringify(wsA.body)}`);
  const wsB = await asMember(`/workspaces?id=eq.${b.id}&select=id`, tokenA);
  check('member of A reads ZERO of workspace B', wsB.status === 200 && wsB.body.length === 0,
    `status=${wsB.status} rows=${Array.isArray(wsB.body) ? wsB.body.length : JSON.stringify(wsB.body)}`);

  // Writes a client is not allowed to make.
  const forgedInsert = await asMember(`/assets`, tokenA, {
    method: 'POST',
    body: { workspace_id: a.id, source: 'upload', sha256: `sha-forged-${run}` },
  });
  check('member cannot insert assets (server-owned)',
    forgedInsert.status === 401 || forgedInsert.status === 403,
    `status=${forgedInsert.status}`);

  const crossTenantUpdate = await asMember(`/assets?id=eq.${assetB.id}`, tokenA, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: { selected: true },
  });
  check("member of A cannot flip B's asset",
    crossTenantUpdate.status === 200 && Array.isArray(crossTenantUpdate.body) && crossTenantUpdate.body.length === 0,
    `status=${crossTenantUpdate.status} rows=${Array.isArray(crossTenantUpdate.body) ? crossTenantUpdate.body.length : JSON.stringify(crossTenantUpdate.body)}`);

  const ownUpdate = await asMember(`/assets?id=eq.${assetA.id}`, tokenA, {
    method: 'PATCH',
    prefer: 'return=representation',
    body: { selected: true },
  });
  check('member of A may select their own asset',
    ownUpdate.status === 200 && Array.isArray(ownUpdate.body) && ownUpdate.body.length === 1,
    `status=${ownUpdate.status} rows=${Array.isArray(ownUpdate.body) ? ownUpdate.body.length : JSON.stringify(ownUpdate.body)}`);

  const captionUpdate = await asMember(`/assets?id=eq.${assetA.id}`, tokenA, {
    method: 'PATCH',
    body: { caption: 'rewritten by the client' },
  });
  check('member cannot edit columns outside selected/rights_confirmed_at',
    captionUpdate.status === 401 || captionUpdate.status === 403,
    `status=${captionUpdate.status}`);

  // Server-only tables stay server-only.
  const usage = await asMember(`/llm_usage?select=id`, tokenA);
  check('member has no access to llm_usage',
    usage.status === 401 || usage.status === 403,
    `status=${usage.status}`);
  const jobs = await asMember(`/flowstarter_agent_jobs?select=id`, tokenA);
  check('member has no access to flowstarter_agent_jobs',
    jobs.status === 401 || jobs.status === 403,
    `status=${jobs.status}`);
}

main()
  .then(cleanup, async (error) => {
    await cleanup();
    throw error;
  })
  .then(() => {
    console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
