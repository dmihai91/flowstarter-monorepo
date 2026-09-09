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
import { spawnSync } from 'node:child_process';

// ─── Local stack configuration ─────────────────────────────────────────────

/**
 * A short, single-line preview of CLI output that can never carry a key.
 * Anything shaped like a JWT or a Supabase token is blanked first, then the
 * whitespace is folded so the warning stays one line.
 */
function preview(text) {
  return (text ?? '')
    .replace(/eyJ[A-Za-z0-9_.\-]{8,}/g, '[redacted]')
    .replace(/sb[a-z]*_[A-Za-z0-9_\-]{8,}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * The local stack's keys as `supabase status -o json` reports them.
 *
 * A failure here is not fatal, because the environment is consulted first
 * and can supply the same four values, but it must not be silent. CI spent a build
 * failing as "Missing local keys" because this swallowed a non-zero exit and
 * returned an empty object, so every miss now says why, with the exit code
 * and a redacted slice of what the CLI actually printed.
 */
function fromSupabaseStatus() {
  // CI starts the stack with most services excluded, and the CLI then prints
  // "Stopped services: [...]" instead of a payload. `SUPABASE_STATUS=off`
  // skips the call outright so the keys come from the environment.
  if (process.env.SUPABASE_STATUS === 'off') return {};
  const run = spawnSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8' });
  const stdout = run.stdout ?? '';
  const stderr = run.stderr ?? '';
  const warn = (reason) =>
    console.warn(
      `[verify-rls] ${reason} (exit ${run.status ?? 'n/a'}); falling back to the environment. ` +
        `stderr: ${preview(stderr) || '(empty)'} | stdout: ${preview(stdout) || '(empty)'}`
    );

  if (run.error) {
    warn(`could not run \`supabase status\`: ${run.error.message}`);
    return {};
  }
  if (run.status !== 0) {
    warn('`supabase status -o json` exited non-zero');
    return {};
  }
  // Some CLI versions print a human preamble before the payload, so the JSON
  // is taken from the first `{` to the last `}` rather than the whole stream.
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start === -1 || end < start) {
    warn('`supabase status -o json` printed no JSON object');
    return {};
  }
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    warn('`supabase status -o json` output did not parse as JSON');
    return {};
  }
}

const status = fromSupabaseStatus();
const API_URL = process.env.SUPABASE_URL ?? status.API_URL ?? 'http://127.0.0.1:54321';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? status.JWT_SECRET;

const host = new URL(API_URL).hostname;
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
  console.error(`Refusing to run against non-local host: ${host}`);
  process.exit(2);
}
if (!JWT_SECRET) {
  console.error(
    'Missing the local JWT secret. Start the stack with `supabase start`, or set ' +
      'SUPABASE_JWT_SECRET (and, if you have them, SUPABASE_ANON_KEY / ' +
      'SUPABASE_SERVICE_ROLE_KEY).'
  );
  process.exit(2);
}

// ─── Minimal HS256 JWT, no dependencies ────────────────────────────────────

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function signJwt(claims) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claims));
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.${signature}`;
}

function mintClerkStyleJwt(clerkUserId) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: clerkUserId, // Clerk user id, what current_clerk_user_id() reads
    role: 'authenticated', // selects the database role in PostgREST
    aud: 'authenticated',
    iat: now,
    exp: now + 600,
  });
}

/**
 * An `anon` or `service_role` key for the local stack, signed here.
 *
 * The stack's own keys are used when they can be read, but CI starts the
 * stack with most services excluded and `supabase status` then reports no
 * keys at all, in either output format. Those keys are nothing more than
 * HS256 tokens carrying a role claim over the local JWT secret, which is the
 * only thing PostgREST checks, so a runner holding the secret can sign its
 * own rather than depend on the CLI printing them.
 */
function mintRoleKey(role) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({ iss: 'supabase-demo', role, iat: now, exp: now + 3600 });
}

const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? status.ANON_KEY ?? mintRoleKey('anon');
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? status.SERVICE_ROLE_KEY ?? mintRoleKey('service_role');

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
