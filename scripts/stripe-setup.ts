#!/usr/bin/env tsx
/**
 * Idempotent Stripe environment setup.
 *
 * Reads STRIPE_SECRET_KEY from apps/flowstarter-main/.env.local, ensures the
 * Stripe resources we need exist (creating them if missing), and writes the
 * resulting IDs back to that .env.local file.
 *
 * Resources managed:
 *   1. Concierge Product — single Stripe Product all client subscriptions
 *      attach to (per-client price is created inline at subscription time).
 *      Searched/created by metadata.flowstarter_role = 'concierge_product'.
 *
 *   2. (Future) Webhook endpoint — uncomment + set WEBHOOK_URL when live.
 *
 * Usage:
 *   pnpm stripe:setup           # uses whatever mode the secret key is in
 *   pnpm stripe:setup --dry-run # show what would happen, change nothing
 *
 * Safe to re-run: searches first, only creates when missing, never duplicates.
 */
import Stripe from 'stripe';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const STRIPE_API_VERSION = '2026-02-25.clover' as const;
const ENV_PATH_DEFAULT = 'apps/flowstarter-main/.env.local';

const FLOWSTARTER_ROLE_PRODUCT = 'concierge_product';
const PRODUCT_NAME = 'Flowstarter Concierge';
const PRODUCT_DESCRIPTION =
  'Concierge subscription for managed websites and stores. Per-client monthly amount is set on each Subscription Price.';

interface SetupResult {
  productId: string;
  created: boolean;
  livemode: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..');
  const envPath = resolve(repoRoot, ENV_PATH_DEFAULT);

  const env = loadEnvFile(envPath);
  const secretKey = env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error(
      `[stripe-setup] STRIPE_SECRET_KEY not found in ${envPath} or process.env`
    );
    process.exit(1);
  }

  const livemode = secretKey.startsWith('sk_live_');
  const mode = livemode ? 'LIVE' : 'TEST';
  console.info(`[stripe-setup] mode = ${mode}`);
  if (livemode && !dryRun) {
    console.warn(
      '[stripe-setup] using a LIVE Stripe key. Press Ctrl-C in 3s to abort.'
    );
    await sleep(3000);
  }

  const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });

  // ─── 1. Concierge Product ────────────────────────────────────────────────
  const result = await ensureConciergeProduct(stripe, dryRun);

  console.info(
    `[stripe-setup] product ${result.created ? 'created' : 'reused'}: ${result.productId}`
  );

  if (dryRun) {
    console.info('[stripe-setup] --dry-run: not writing to env file');
    return;
  }

  // ─── 2. Persist back to .env.local ───────────────────────────────────────
  const targetVar = livemode
    ? 'STRIPE_CONCIERGE_PRODUCT_ID_LIVE'
    : 'STRIPE_CONCIERGE_PRODUCT_ID';

  // Always write the unsuffixed var when in test mode (it's what code reads)
  // and a _LIVE-suffixed copy when in live mode so both can coexist.
  upsertEnvVar(envPath, targetVar, result.productId);
  if (!livemode) {
    // Test-mode also explicitly mirrors to STRIPE_CONCIERGE_PRODUCT_ID
    upsertEnvVar(envPath, 'STRIPE_CONCIERGE_PRODUCT_ID', result.productId);
  }

  console.info(
    `[stripe-setup] wrote ${targetVar}=${result.productId} to ${envPath}`
  );
  console.info('[stripe-setup] done.');
}

async function ensureConciergeProduct(
  stripe: Stripe,
  dryRun: boolean
): Promise<SetupResult> {
  // Search by metadata for the canonical Flowstarter product. Stripe Search
  // is supported in test + live mode and is the right primitive here.
  const search = await stripe.products.search({
    query: `metadata['flowstarter_role']:'${FLOWSTARTER_ROLE_PRODUCT}'`,
    limit: 5,
  });

  const existing = search.data.find((p) => p.active !== false);
  if (existing) {
    return {
      productId: existing.id,
      created: false,
      livemode: existing.livemode,
    };
  }

  if (dryRun) {
    return {
      productId: '(would-create)',
      created: true,
      livemode: false,
    };
  }

  const created = await stripe.products.create({
    name: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    metadata: {
      flowstarter_role: FLOWSTARTER_ROLE_PRODUCT,
      flowstarter_managed_at: new Date().toISOString(),
    },
  });

  return {
    productId: created.id,
    created: true,
    livemode: created.livemode,
  };
}

// ─── Env file helpers ──────────────────────────────────────────────────────

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const text = readFileSync(path, 'utf8');
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out[key] = value.replace(/^["']|["']$/g, '');
  }
  return out;
}

function upsertEnvVar(path: string, key: string, value: string): void {
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const lines = text.split(/\r?\n/);
  const re = new RegExp(`^${escapeRegExp(key)}=`);
  let replaced = false;
  const out = lines.map((line) => {
    if (re.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!replaced) {
    if (out.length > 0 && out[out.length - 1] !== '') out.push('');
    out.push(`${key}=${value}`);
  }
  writeFileSync(path, out.join('\n'));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('[stripe-setup] fatal:', err);
  process.exit(1);
});
