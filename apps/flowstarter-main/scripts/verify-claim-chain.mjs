#!/usr/bin/env node
/**
 * Proves the claim seam end to end against the LOCAL Supabase stack: an
 * anonymous funnel preview becomes a workspace whose owner can actually pay
 * the deposit.
 *
 * Before this seam existed the two halves of the product could not meet.
 * `/api/discovery/preview/live` generated a real site against a throwaway
 * demo id and persisted nothing, while
 * `/api/flowstarter/projects/[id]/deposit-checkout` requires, in order:
 * a `workspace_memberships` row for the caller, `project_state =
 * PREVIEW_READY`, an unpaid deposit, and a positive `final_value_minor`.
 * Nothing produced that state, so deposit-checkout could never succeed.
 *
 * ── What is simulated, and what is real ────────────────────────────────────
 * The route handler itself needs a Next.js runtime and a Clerk session, which
 * a plain node script cannot mint. So this script replays the exact writes
 * `src/lib/flowstarter/claim.ts` issues — in the same order, with the same
 * columns and the same idempotency rule — as the service role over PostgREST,
 * and then asserts the *real* postconditions by running the same queries
 * deposit-checkout runs. The database, its constraints, its RLS policies and
 * the partial unique index on `workspaces.claimed_preview_id` are all real;
 * only the HTTP hop and Clerk are stood in for.
 *
 * The final checks mint a Clerk-style JWT (as verify-rls-local.mjs does) and
 * read back as the claiming user, so "membership was written" is proven by
 * the client actually being able to see their own project through RLS, not
 * just by a row existing.
 *
 * Usage:  node scripts/verify-claim-chain.mjs   (or: pnpm verify:claim)
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
const asMember = (path, token, options = {}) =>
  rest(path, { ...options, key: ANON_KEY, token });

// ─── Assertions ────────────────────────────────────────────────────────────

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

// ─── Fixture: what the wizard produced ─────────────────────────────────────

const run = randomUUID().slice(0, 8);
const previewId = randomUUID(); // the wizard's demoId
const claimant = `user_claimcheck_${run}`;
const outsider = `user_claimcheck_out_${run}`;
const TEMPLATE_SLUG = 'astro-service';
// The pro tier's published setup fee (€1,199) in minor units. The route maps
// the tier NAME to this figure server-side; the browser never sends money.
const QUOTE_MINOR = 119_900;
/** deposit-checkout charges exactly this: Math.round(final_value_minor * 0.2). */
const EXPECTED_DEPOSIT_MINOR = Math.round(QUOTE_MINOR * 0.2);

const created = { workspaces: [] };

/** The preview manifest the generation pipeline handed back. */
const previewFiles = [
  { path: 'package.json', content: '{"scripts":{"dev":"astro dev"}}' },
  { path: 'src/pages/index.astro', content: '<h1>Acme Bakery</h1>' },
];

// ─── The claim, replayed write for write ───────────────────────────────────

async function createWorkspace() {
  const inserted = await asService('/workspaces', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      slug: `claim-check-${run}`,
      name: `Claim check ${run}`,
      site_kind: 'astro',
      client_name: 'Ada Baker',
      client_email: `ada+${run}@example.com`,
      client_business_name: 'Acme Bakery',
      claimed_preview_id: previewId,
      concierge_stage: 'intake',
      project_state: 'INTAKE',
      final_value_minor: QUOTE_MINOR,
    },
  });
  return inserted;
}

async function saveArtifacts(workspaceId) {
  // Mirrors savePreviewArtifacts(): one row per workspace, intake re-pointed
  // at its new home (the build worker fails the job when they disagree).
  return asService('/flowstarter_project_artifacts', {
    method: 'POST',
    prefer: 'return=representation,resolution=merge-duplicates',
    body: {
      workspace_id: workspaceId,
      intake_payload: {
        projectId: workspaceId,
        business: { name: 'Acme Bakery', niche: 'Bakery' },
      },
      brand_config: { schemaVersion: '1.0' },
      preview_manifest: { files: previewFiles },
      scrape_manifest: {},
      template_slug: TEMPLATE_SLUG,
      template_selection_reason: 'best fit for a service business',
      preview_artifact_url: `daytona://sandbox-${run}`,
    },
  });
}

async function advanceToPreviewReady(workspaceId) {
  // Only from a pre-preview state, exactly as savePreviewArtifacts does.
  return asService(
    `/workspaces?id=eq.${workspaceId}&project_state=in.(INTAKE,PREVIEW_READY)`,
    {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { project_state: 'PREVIEW_READY' },
    }
  );
}

async function cleanup() {
  for (const id of created.workspaces) {
    await asService(`/workspaces?id=eq.${id}`, { method: 'DELETE' });
  }
}

// ─── The run ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Supabase: ${API_URL}`);
  console.log(`preview (demo) id = ${previewId}\n`);

  // 1. The workspace the claim creates.
  const inserted = await createWorkspace();
  if (inserted.status >= 300 || !Array.isArray(inserted.body)) {
    throw new Error(`workspace insert failed: ${JSON.stringify(inserted.body)}`);
  }
  const workspaceId = inserted.body[0].id;
  created.workspaces.push(workspaceId);
  console.log(`workspace = ${workspaceId}\n`);
  check(
    'claim creates a workspace tagged with the preview it came from',
    inserted.body[0].claimed_preview_id === previewId,
    `claimed_preview_id=${inserted.body[0].claimed_preview_id}`
  );

  // 2. Artifacts, then the lifecycle advance.
  const artifacts = await saveArtifacts(workspaceId);
  check(
    'preview manifest is persisted as build artifacts',
    artifacts.status < 300,
    `status=${artifacts.status}`
  );
  const advanced = await advanceToPreviewReady(workspaceId);
  check(
    'workspace advances INTAKE -> PREVIEW_READY',
    advanced.status === 200 && advanced.body.length === 1,
    `status=${advanced.status} rows=${Array.isArray(advanced.body) ? advanced.body.length : '?'}`
  );

  // 3. Membership — without this the client cannot reach their own project.
  const membership = await asService('/workspace_memberships', {
    method: 'POST',
    prefer: 'return=representation,resolution=ignore-duplicates',
    body: { workspace_id: workspaceId, clerk_user_id: claimant, role: 'client' },
  });
  check(
    'claimant is given client membership',
    membership.status < 300,
    `status=${membership.status}`
  );

  // 4. Audit trail + calibration record.
  const event = await asService('/project_events', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      workspace_id: workspaceId,
      kind: 'preview_claimed',
      actor: claimant,
      payload: { previewId, previewReady: true, quoteMinor: QUOTE_MINOR },
    },
  });
  check(
    "a 'preview_claimed' event records who claimed it",
    event.status < 300 && event.body?.[0]?.actor === claimant,
    `status=${event.status}`
  );

  const submission = await asService('/intake_submissions', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      workspace_id: workspaceId,
      payload: { goal: 'bookings', timeline: 'flexible' },
      score: 0,
      routing_decision: 'standard',
      rules_fired: ['bookingOrPortfolioGoal'],
      decided_by: 'rules',
    },
  });
  check(
    'the routing verdict is recorded for calibration',
    submission.status < 300 && submission.body?.[0]?.decided_by === 'rules',
    `status=${submission.status}`
  );

  // ─── Postconditions: the state the rest of the product asks for ──────────

  const membershipRows = await asService(
    `/workspace_memberships?workspace_id=eq.${workspaceId}&select=clerk_user_id,role`
  );
  check(
    'a membership row exists for the claimant',
    membershipRows.status === 200 &&
      membershipRows.body.length === 1 &&
      membershipRows.body[0].clerk_user_id === claimant &&
      membershipRows.body[0].role === 'client',
    `rows=${JSON.stringify(membershipRows.body)}`
  );

  const workspaceRow = await asService(
    `/workspaces?id=eq.${workspaceId}&select=project_state,final_value_minor,billing_currency,deposit_status`
  );
  const workspace = workspaceRow.body?.[0] ?? {};
  check(
    'project_state is PREVIEW_READY',
    workspace.project_state === 'PREVIEW_READY',
    `project_state=${workspace.project_state}`
  );

  const artifactRow = await asService(
    `/flowstarter_project_artifacts?workspace_id=eq.${workspaceId}&select=template_slug,preview_manifest,intake_payload`
  );
  const artifact = artifactRow.body?.[0];
  check(
    'flowstarter_project_artifacts holds the workspace row',
    Boolean(artifact) && artifact.template_slug === TEMPLATE_SLUG,
    `rows=${artifactRow.body?.length ?? 0}`
  );
  check(
    'the stored manifest is non-empty (the worker refuses an empty one)',
    (artifact?.preview_manifest?.files?.length ?? 0) === previewFiles.length,
    `files=${artifact?.preview_manifest?.files?.length ?? 0}`
  );
  check(
    'intake.projectId matches the workspace (the worker cross-checks this)',
    artifact?.intake_payload?.projectId === workspaceId,
    `projectId=${artifact?.intake_payload?.projectId}`
  );

  // ─── deposit-checkout's own preconditions, queried the way it queries ────

  const depositMembership = await asService(
    `/workspace_memberships?workspace_id=eq.${workspaceId}&clerk_user_id=eq.${claimant}&select=workspace_id`
  );
  const hasMembership = depositMembership.body?.length === 1;
  const stateOk = workspace.project_state === 'PREVIEW_READY';
  const notPaid = workspace.deposit_status !== 'paid';
  const quoteOk = Number(workspace.final_value_minor) > 0;
  check(
    'deposit-checkout: caller has a membership row (else 404)',
    hasMembership,
    `rows=${depositMembership.body?.length ?? 0}`
  );
  check(
    'deposit-checkout: project_state is PREVIEW_READY (else 409)',
    stateOk,
    `project_state=${workspace.project_state}`
  );
  check(
    'deposit-checkout: deposit is not already paid (else 409)',
    notPaid,
    `deposit_status=${workspace.deposit_status}`
  );
  check(
    'deposit-checkout: a positive quote exists (else 409)',
    quoteOk,
    `final_value_minor=${workspace.final_value_minor}`
  );
  check(
    'deposit-checkout would charge exactly 20% of the quote',
    quoteOk && Math.round(workspace.final_value_minor * 0.2) === EXPECTED_DEPOSIT_MINOR,
    `${EXPECTED_DEPOSIT_MINOR} ${String(workspace.billing_currency).toUpperCase()}`
  );
  check(
    'ALL deposit-checkout preconditions are now satisfiable',
    hasMembership && stateOk && notPaid && quoteOk
  );

  // ─── Idempotency: the same preview claimed twice ────────────────────────

  const secondClaim = await asService('/workspaces', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      slug: `claim-check-dup-${run}`,
      name: `Claim check dup ${run}`,
      site_kind: 'astro',
      claimed_preview_id: previewId,
    },
  });
  if (secondClaim.status < 300 && Array.isArray(secondClaim.body)) {
    created.workspaces.push(secondClaim.body[0].id);
  }
  check(
    'a second claim of the same preview is rejected by the unique index',
    secondClaim.status === 409 && secondClaim.body?.code === '23505',
    `status=${secondClaim.status} code=${secondClaim.body?.code}`
  );

  const lookup = await asService(
    `/workspaces?claimed_preview_id=eq.${previewId}&select=id`
  );
  check(
    'the retry resolves to the SAME workspace, not a second one',
    lookup.status === 200 &&
      lookup.body.length === 1 &&
      lookup.body[0].id === workspaceId,
    `rows=${lookup.body?.length ?? 0}`
  );

  // ─── The point of membership: the client can actually see their project ──

  const claimantToken = mintClerkStyleJwt(claimant);
  const ownView = await asMember(
    `/workspaces?id=eq.${workspaceId}&select=id,project_state`,
    claimantToken
  );
  check(
    'the claimant can read their own workspace through RLS',
    ownView.status === 200 &&
      ownView.body.length === 1 &&
      ownView.body[0].project_state === 'PREVIEW_READY',
    `status=${ownView.status} rows=${Array.isArray(ownView.body) ? ownView.body.length : JSON.stringify(ownView.body)}`
  );

  const outsiderView = await asMember(
    `/workspaces?id=eq.${workspaceId}&select=id`,
    mintClerkStyleJwt(outsider)
  );
  check(
    'nobody else can read the claimed workspace',
    outsiderView.status === 200 && outsiderView.body.length === 0,
    `status=${outsiderView.status} rows=${Array.isArray(outsiderView.body) ? outsiderView.body.length : JSON.stringify(outsiderView.body)}`
  );
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
