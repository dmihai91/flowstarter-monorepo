/**
 * Removes what seed-e2e-tenants.mjs left behind.
 *
 *   node e2e/support/cleanup-e2e-tenants.mjs                 # older than 24h
 *   node e2e/support/cleanup-e2e-tenants.mjs --older-than 2  # older than 2h
 *   node e2e/support/cleanup-e2e-tenants.mjs --run e2e-2026...-a1b2c3
 *   node e2e/support/cleanup-e2e-tenants.mjs --all
 *   node e2e/support/cleanup-e2e-tenants.mjs --all --dry-run
 *
 * It only ever touches rows carrying a marker the seed wrote: a workspace
 * qualifies when its slug starts with `e2e-` AND it either carries an
 * `e2e_seed` event or is one of the two fixed fixture slugs. Both halves are
 * needed. The prefix alone is too broad: a local stack accumulates
 * hand-made `e2e-something` workspaces from demo scripts, and this is a
 * delete script, not a housekeeper for anything that looks vaguely like a
 * test. Placeholder profiles are matched by their `user_e2e_` Clerk id.
 *
 * The age it filters on is the `created_at` of the workspace's `e2e_seed`
 * event, which the seed pins to the run that wrote it, so a reseeded tenant
 * reads as young rather than as whatever it was a week ago. A fixture-slug
 * workspace with no event at all (a seed that died halfway) ages off its own
 * created_at.
 *
 * Deletes walk children before parents. Most of the child tables cascade, but
 * ai_audit_logs does not, and discovery_leads and funnel_previews hold NO
 * ACTION references that have to be cleared rather than deleted, so the order
 * in WORKSPACE_CHILD_TABLES is a requirement and not a preference.
 *
 * WHERE THIS REFUSES TO RUN
 * This is a delete script pointed at whatever SUPABASE_URL says, so the
 * target is checked before anything is read:
 *   - a URL containing the project ref in SUPABASE_PROJECT_REF is refused
 *     outright, and no override lifts that;
 *   - anything that is not 127.0.0.1/localhost and does not mention
 *     `staging` is refused unless E2E_ALLOW_PROD=1 is set.
 * The ref check is skipped for local and staging URLs on purpose: on a
 * preview build SUPABASE_PROJECT_REF names the staging project, and a guard
 * that fired there would block the only environment this is meant to run in.
 */
import { pathToFileURL } from 'node:url';
import {
  PLACEHOLDER_CLERK_PREFIX,
  SEED_EVENT_KIND,
  TENANTS,
  WORKSPACE_CHILD_TABLES,
  WORKSPACE_REFERRERS,
  WORKSPACE_SLUG_PREFIX,
  connection,
  rest,
  tenantRowCounts,
  uuidv5,
} from './seed-e2e-tenants.mjs';

// ─── Target guard ──────────────────────────────────────────────────────────

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/** Throws unless `url` is a database this script is allowed to delete from. */
export function assertSafeTarget(url) {
  const host = new URL(url).hostname;
  const isLocal = LOCAL_HOSTS.has(host);
  const isStaging = /staging/i.test(url);

  const productionRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (!isLocal && !isStaging && productionRef && url.includes(productionRef)) {
    throw new Error(
      `Refusing to run: ${host} carries the project ref named by ` +
        'SUPABASE_PROJECT_REF. This script deletes rows; point it at the ' +
        'staging project or the local stack.',
    );
  }

  if (isLocal || isStaging) return;

  if (process.env.E2E_ALLOW_PROD === '1') {
    console.warn(
      `Warning: ${host} is neither local nor named "staging", and ` +
        'E2E_ALLOW_PROD=1 is set. Proceeding under that override.',
    );
    return;
  }

  throw new Error(
    `Refusing to run against ${host}: it is not 127.0.0.1/localhost and its ` +
      'URL does not mention "staging". Set E2E_ALLOW_PROD=1 only if you are ' +
      'certain this is not production.',
  );
}

// ─── Arguments ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const options = {
    olderThanHours: 24,
    runId: null,
    all: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--run') options.runId = argv[++i];
    else if (arg.startsWith('--run='))
      options.runId = arg.slice('--run='.length);
    else if (arg === '--older-than') options.olderThanHours = Number(argv[++i]);
    else if (arg.startsWith('--older-than='))
      options.olderThanHours = Number(arg.slice('--older-than='.length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(options.olderThanHours) || options.olderThanHours < 0) {
    throw new Error('--older-than expects a non-negative number of hours');
  }
  return options;
}

// ─── Selection ─────────────────────────────────────────────────────────────

/**
 * Every marked workspace, with the run that last seeded it and the moment it
 * did. `PostgREST` `like` uses `*` for `%`.
 */
async function markedWorkspaces(conn) {
  const workspaces = await rest(
    conn,
    `workspaces?slug=like.${WORKSPACE_SLUG_PREFIX}*&select=id,slug,created_at`,
  );
  if (!Array.isArray(workspaces) || workspaces.length === 0) return [];

  const ids = `(${workspaces.map((w) => w.id).join(',')})`;
  const events = await rest(
    conn,
    `project_events?workspace_id=in.${ids}&kind=eq.${SEED_EVENT_KIND}` +
      '&select=workspace_id,payload,created_at&order=created_at.desc',
  );
  const latest = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    if (!latest.has(event.workspace_id)) latest.set(event.workspace_id, event);
  }

  const fixtureSlugs = new Set(TENANTS.map((t) => t.slug));
  return workspaces
    .filter(
      (workspace) =>
        latest.has(workspace.id) || fixtureSlugs.has(workspace.slug),
    )
    .map((workspace) => {
      const event = latest.get(workspace.id);
      return {
        ...workspace,
        runId: event?.payload?.e2e_run ?? null,
        seededAt: event?.created_at ?? workspace.created_at,
      };
    });
}

function select(candidates, options) {
  if (options.all) return candidates;
  if (options.runId) return candidates.filter((c) => c.runId === options.runId);
  const cutoff = Date.now() - options.olderThanHours * 3600_000;
  return candidates.filter((c) => Date.parse(c.seededAt) < cutoff);
}

// ─── Deletion ──────────────────────────────────────────────────────────────

async function deleteWorkspaces(conn, workspaces) {
  const ids = `(${workspaces.map((w) => w.id).join(',')})`;
  const deleted = {};

  // Children first, in the order the schema allows.
  for (const table of WORKSPACE_CHILD_TABLES) {
    const rows = await rest(conn, `${table}?workspace_id=in.${ids}`, {
      method: 'DELETE',
      prefer: 'return=representation',
    });
    if (Array.isArray(rows) && rows.length > 0) deleted[table] = rows.length;
  }

  // Rows that merely point at the tenant keep their own life; the reference
  // is cleared so the workspace delete is not blocked.
  for (const { table, column } of WORKSPACE_REFERRERS) {
    const rows = await rest(conn, `${table}?${column}=in.${ids}`, {
      method: 'PATCH',
      body: { [column]: null },
      prefer: 'return=representation',
    });
    if (Array.isArray(rows) && rows.length > 0)
      deleted[`${table}.${column} cleared`] = rows.length;
  }

  const removed = await rest(conn, `workspaces?id=in.${ids}`, {
    method: 'DELETE',
    prefer: 'return=representation',
  });
  deleted.workspaces = Array.isArray(removed) ? removed.length : 0;
  return deleted;
}

/**
 * The placeholder profiles the seed invents when an address has no mirrored
 * Clerk user. They belong to no workspace, so nothing cascades them; they are
 * removed by their own deterministic ids, and only when their tenant is going
 * too.
 */
async function deletePlaceholderProfiles(conn, tenantKeys) {
  if (tenantKeys.length === 0) return 0;
  const ids = tenantKeys.map((key) => uuidv5(`profile:${key}`));
  const rows = await rest(
    conn,
    `profiles?id=in.(${ids.join(',')})&clerk_user_id=like.${PLACEHOLDER_CLERK_PREFIX}*`,
    { method: 'DELETE', prefer: 'return=representation' },
  );
  return Array.isArray(rows) ? rows.length : 0;
}

// ─── The run ───────────────────────────────────────────────────────────────

export async function cleanup(options) {
  const conn = connection();
  assertSafeTarget(conn.url);
  console.log(`Supabase: ${conn.url}`);
  console.log(
    options.all
      ? 'scope:    every marked workspace'
      : options.runId
        ? `scope:    run ${options.runId}`
        : `scope:    seeded more than ${options.olderThanHours}h ago`,
  );

  const candidates = await markedWorkspaces(conn);
  const doomed = select(candidates, options);
  console.log(`marked:   ${candidates.length}   matching: ${doomed.length}\n`);

  for (const workspace of doomed) {
    console.log(
      `  ${workspace.slug}  ${workspace.id}  seeded ${workspace.seededAt}`,
    );
  }
  if (doomed.length === 0) {
    console.log('Nothing to do.');
    return { deleted: {}, profiles: 0, workspaces: [] };
  }
  if (options.dryRun) {
    console.log('\nDry run: nothing was deleted.');
    return { deleted: {}, profiles: 0, workspaces: doomed };
  }

  const deleted = await deleteWorkspaces(conn, doomed);
  const doomedSlugs = new Set(doomed.map((w) => w.slug));
  const profiles = await deletePlaceholderProfiles(
    conn,
    TENANTS.filter((t) => doomedSlugs.has(t.slug)).map((t) => t.key),
  );

  console.log('\ndeleted:');
  for (const [table, count] of Object.entries(deleted)) {
    console.log(`  ${table.padEnd(32)} ${count}`);
  }
  console.log(`  ${'profiles (placeholder)'.padEnd(32)} ${profiles}`);

  const counts = await tenantRowCounts(
    conn,
    doomed.map((w) => w.id),
  );
  console.log('\nrows remaining for those workspaces:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(32)} ${count}`);
  }

  return { deleted, profiles, workspaces: doomed, counts };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  cleanup(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
