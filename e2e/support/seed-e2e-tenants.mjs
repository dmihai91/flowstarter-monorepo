/**
 * Seeds the two fixed tenants the E2E suite signs into.
 *
 *   node e2e/support/seed-e2e-tenants.mjs
 *
 * Idempotent by construction. Every id is a UUIDv5 derived from one fixed
 * namespace and a stable name, so a second run upserts the same rows onto
 * themselves and creates nothing new. That matters more than it sounds: a
 * preview environment reseeds on every pull request, and a seed that
 * accumulated a workspace per run would bury the real data within a week.
 *
 * The Clerk side is read, never written. `E2E_CLERK_OPERATOR_EMAIL` and
 * `E2E_CLERK_CLIENT_EMAIL` are resolved to Clerk user ids through the app's
 * own mirror table, public.profiles, the same table the Clerk webhook keeps
 * in sync, so this script needs no Clerk secret and cannot mint a real
 * account. When an address has no profile yet (a fresh local stack, before
 * anyone has signed in), a placeholder profile is written with a
 * deterministic `user_e2e_` clerk id and the run says so out loud: the
 * authenticated Playwright projects will not see these workspaces until the
 * real Clerk users have signed in once and the webhook has mirrored them.
 *
 * Marking. Nothing here is anonymous. Workspaces carry the `e2e-` slug
 * prefix (public.workspaces has no metadata column, so the prefix is the
 * marker the schema supports), placeholder profiles carry a `user_e2e_`
 * clerk id, and the artifact and event rows carry `e2e_run` in their JSON.
 * cleanup-e2e-tenants.mjs finds every one of them from those markers alone.
 *
 * Environment:
 *   SUPABASE_URL                (default: the app's NEXT_PUBLIC_SUPABASE_URL,
 *                               else http://127.0.0.1:54321)
 *   SUPABASE_SERVICE_ROLE_KEY   (falls back to apps/flowstarter-main/.env.local
 *                               through local-env.mjs)
 *   E2E_CLERK_OPERATOR_EMAIL    (default operator+clerk_test@flowstarter.dev)
 *   E2E_CLERK_CLIENT_EMAIL      (default client+clerk_test@example.com)
 *   E2E_RUN_ID                  (default: a fresh timestamped id, printed)
 */
import { createHash, randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadEnv, requireServiceRoleKey } from './local-env.mjs';

// ─── Identity of the fixture ───────────────────────────────────────────────

/**
 * The namespace every deterministic id in this fixture hangs off. A literal,
 * not a derivation: it is the one value that must never change, because
 * changing it orphans every tenant a previous run seeded.
 */
export const E2E_NAMESPACE = '6f9d3c1a-2b47-4e58-9c10-5d7a8f2e4b63';

/** Slug prefix that marks a workspace as ours, and nothing else as ours. */
export const WORKSPACE_SLUG_PREFIX = 'e2e-';

/** Clerk id prefix for a profile this script invented rather than mirrored. */
export const PLACEHOLDER_CLERK_PREFIX = 'user_e2e_';

/** `kind` of the project_events row that records a seed run. */
export const SEED_EVENT_KIND = 'e2e_seed';

/**
 * Child tables of public.workspaces, ordered so a delete pass can walk them
 * front to back without tripping a foreign key. Most cascade, but
 * ai_audit_logs does not (NO ACTION), so the order is load-bearing for
 * cleanup rather than decorative. Generated from the schema: every public
 * table with a `workspace_id` column.
 */
export const WORKSPACE_CHILD_TABLES = [
  'flowstarter_agent_job_events',
  'flowstarter_agent_jobs',
  'flowstarter_change_requests',
  'flowstarter_project_artifacts',
  'project_messages',
  'project_events',
  'intake_submissions',
  'asset_rights_confirmations',
  'assets',
  'brand_signals',
  'llm_usage',
  'site_versions',
  'deployments',
  'editor_sessions',
  'commerce_products',
  'setup_payment_milestones',
  'client_constraint_profiles',
  'workspace_billing_profiles',
  'workspace_hosts',
  'workspace_memberships',
  'leads',
  'vault_encrypted_secrets',
  'ai_audit_logs',
];

/**
 * Rows that point at a workspace but are not owned by it: a lead and a funnel
 * preview outlive the tenant they were claimed into. Their reference is
 * cleared, not deleted, and they block the workspace delete until it is.
 */
export const WORKSPACE_REFERRERS = [
  { table: 'discovery_leads', column: 'project_id' },
  { table: 'funnel_previews', column: 'claimed_workspace_id' },
];

/** The two tenants, and the shape each one is left in. */
export const TENANTS = [
  {
    key: 'operator',
    slug: 'e2e-operator-workspace',
    name: 'e2e Operator Workspace',
    emailVar: 'E2E_CLERK_OPERATOR_EMAIL',
    defaultEmail: 'operator+clerk_test@flowstarter.dev',
    role: 'admin',
    // Mid-build: the operator's board has something to show.
    projectState: 'AGENTS_WORKING',
    businessName: 'e2e Operator Fixture',
    templateSlug: 'e2e-fixture',
  },
  {
    key: 'client',
    slug: 'e2e-client-workspace',
    name: 'e2e Client Workspace',
    emailVar: 'E2E_CLERK_CLIENT_EMAIL',
    defaultEmail: 'client+clerk_test@example.com',
    role: 'client',
    // Preview ready and unpaid: the client-side deposit flow starts here.
    projectState: 'PREVIEW_READY',
    businessName: 'e2e Client Fixture',
    templateSlug: 'e2e-fixture',
  },
];

// ─── Deterministic ids ─────────────────────────────────────────────────────

/**
 * RFC 4122 name-based UUID (version 5, SHA-1). Written out rather than
 * pulled in as a dependency: it is nine lines, and the seed has to run from
 * a bare `node` with no install step.
 *
 * Version 5 also satisfies the canonical-UUID check `withTenant` applies in
 * apps/flowstarter-main/src/lib/tenancy.ts, which accepts versions 1 to 8.
 */
export function uuidv5(name, namespace = E2E_NAMESPACE) {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const digest = createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(name, 'utf8')]))
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

// ─── Connection ────────────────────────────────────────────────────────────

/**
 * The Supabase REST endpoint and service-role key, environment first, the
 * app's own env files second (the same precedence every other support script
 * uses through local-env.mjs).
 */
export function connection() {
  const env = loadEnv();
  const url = (
    process.env.SUPABASE_URL?.trim() ||
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'http://127.0.0.1:54321'
  ).replace(/\/+$/, '');
  return { url, key: requireServiceRoleKey(env), env };
}

/** One PostgREST call. Throws with the server's own message on a non-2xx. */
export async function rest(conn, path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: conn.key,
    Authorization: `Bearer ${conn.key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${conn.url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${method} ${path} -> ${response.status} ${text.slice(0, 400)}`,
    );
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const upsert = (conn, path, body) =>
  rest(conn, path, {
    method: 'POST',
    body,
    prefer: 'resolution=merge-duplicates,return=representation',
  });

// ─── The seed ──────────────────────────────────────────────────────────────

function freshRunId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  return `e2e-${stamp}-${randomBytes(3).toString('hex')}`;
}

/**
 * The Clerk user id behind an address, read from the app's mirror table.
 *
 * Returns `{ clerkUserId, placeholder }`. A placeholder means no webhook has
 * ever mirrored this address, so one is invented deterministically and
 * marked; the caller warns about it.
 */
async function resolveClerkUser(conn, { email, key }) {
  const found = await rest(
    conn,
    `profiles?email=eq.${encodeURIComponent(email)}` +
      '&select=id,clerk_user_id&order=created_at.asc&limit=1',
  );
  if (Array.isArray(found) && found.length > 0 && found[0].clerk_user_id) {
    return { clerkUserId: found[0].clerk_user_id, placeholder: false };
  }

  const profileId = uuidv5(`profile:${key}`);
  const clerkUserId =
    PLACEHOLDER_CLERK_PREFIX + uuidv5(`clerk:${key}`).replace(/-/g, '');
  await upsert(conn, 'profiles?on_conflict=clerk_user_id', {
    id: profileId,
    clerk_user_id: clerkUserId,
    email,
    full_name: `e2e ${key}`,
  });
  return { clerkUserId, placeholder: true };
}

/** Creates or refreshes one tenant. Returns a summary of what it touched. */
async function seedTenant(conn, tenant, runId, seededAt) {
  const email = process.env[tenant.emailVar]?.trim() || tenant.defaultEmail;
  const { clerkUserId, placeholder } = await resolveClerkUser(conn, {
    email,
    key: tenant.key,
  });

  const workspaceId = uuidv5(`workspace:${tenant.slug}`);

  await upsert(conn, 'workspaces', {
    id: workspaceId,
    slug: tenant.slug,
    name: tenant.name,
    site_kind: 'astro',
    project_state: tenant.projectState,
    client_business_name: tenant.businessName,
    client_email: email,
  });

  await upsert(conn, 'workspace_memberships', {
    workspace_id: workspaceId,
    clerk_user_id: clerkUserId,
    role: tenant.role,
  });

  // The project itself. One artifact row per workspace (workspace_id is the
  // primary key), holding the intake the rest of the pipeline reads.
  await upsert(conn, 'flowstarter_project_artifacts', {
    workspace_id: workspaceId,
    intake_payload: {
      e2e_run: runId,
      e2e_tenant: tenant.key,
      business_name: tenant.businessName,
      goal: 'e2e fixture',
    },
    template_slug: tenant.templateSlug,
    template_selection_reason: `e2e fixture (${tenant.key})`,
  });

  // The marker cleanup reads: one event per tenant, deterministic id, with
  // created_at pinned to this run so "older than N hours" measures the last
  // seed rather than the first.
  await upsert(conn, 'project_events', {
    id: uuidv5(`seed-event:${tenant.slug}`),
    workspace_id: workspaceId,
    kind: SEED_EVENT_KIND,
    actor: 'e2e',
    payload: { e2e_run: runId, e2e_tenant: tenant.key, seeded_at: seededAt },
    created_at: seededAt,
  });

  return {
    key: tenant.key,
    slug: tenant.slug,
    workspaceId,
    email,
    clerkUserId,
    placeholder,
  };
}

export async function seed({
  runId = process.env.E2E_RUN_ID?.trim() || freshRunId(),
} = {}) {
  const conn = connection();
  const seededAt = new Date().toISOString();
  console.log(`Supabase: ${conn.url}`);
  console.log(`run id:   ${runId}\n`);

  const results = [];
  for (const tenant of TENANTS) {
    results.push(await seedTenant(conn, tenant, runId, seededAt));
  }

  for (const r of results) {
    console.log(`${r.key.padEnd(8)} ${r.slug}`);
    console.log(`         workspace ${r.workspaceId}`);
    console.log(
      `         clerk     ${r.clerkUserId}${r.placeholder ? '  (placeholder)' : ''}`,
    );
  }

  const placeholders = results.filter((r) => r.placeholder);
  if (placeholders.length > 0) {
    console.warn(
      `\nWarning: ${placeholders.length} of ${results.length} addresses have no row in ` +
        'public.profiles, so a placeholder clerk id was used. The authenticated ' +
        'Playwright projects will not see these workspaces until the real Clerk ' +
        'users have signed in once and the webhook has mirrored them.',
    );
  }

  // Counts, so two runs in a row can be compared without reading rows out.
  const ids = results.map((r) => r.workspaceId);
  const counts = await tenantRowCounts(conn, ids);
  console.log('\nrows for the seeded workspaces:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(32)} ${count}`);
  }

  return { runId, tenants: results, counts };
}

/**
 * How many rows each seeded table holds for these workspaces. Used by the
 * seed to show a second run changed nothing, and by cleanup to show the rows
 * are gone.
 */
export async function tenantRowCounts(conn, workspaceIds) {
  const counts = {};
  const list = `(${workspaceIds.join(',')})`;
  const tables = [
    'workspaces',
    'workspace_memberships',
    'flowstarter_project_artifacts',
    'project_events',
  ];
  for (const table of tables) {
    const column = table === 'workspaces' ? 'id' : 'workspace_id';
    const rows = await rest(
      conn,
      `${table}?${column}=in.${list}&select=${column}`,
    );
    counts[table] = Array.isArray(rows) ? rows.length : 0;
  }
  const placeholderProfiles = await rest(
    conn,
    `profiles?clerk_user_id=like.${PLACEHOLDER_CLERK_PREFIX}*&select=id`,
  );
  counts['profiles (placeholder)'] = Array.isArray(placeholderProfiles)
    ? placeholderProfiles.length
    : 0;
  return counts;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  seed().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
