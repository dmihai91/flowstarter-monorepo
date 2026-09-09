/**
 * Loads Clerk credentials for the authenticated Playwright projects.
 *
 * The app reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` from
 * `apps/flowstarter-main/.env.local`, but `@clerk/testing` expects
 * `CLERK_PUBLISHABLE_KEY`. Rather than make you set the same value twice, this
 * loads the app's env file and maps the names across.
 *
 * Nothing here ever prints a secret. `.env.local` is gitignored, and the
 * authenticated state written to `e2e/.auth/` is already covered by the
 * double-star `.auth` rule in the root .gitignore.
 */

import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Playwright transpiles config and specs to CJS, so `import.meta.url` is not
// available here — `__dirname` is. The cwd fallback covers a stray ESM loader.
const here =
  typeof __dirname === 'string' ? __dirname : resolve(process.cwd(), 'e2e', 'support');
export const repoRoot = resolve(here, '..', '..');

const ENV_FILES = [
  join(repoRoot, 'apps', 'flowstarter-main', '.env.local'),
  join(repoRoot, '.env.shared'),
];

for (const file of ENV_FILES) {
  if (existsSync(file)) config({ path: file, override: false, quiet: true });
}

// @clerk/testing reads the unprefixed names.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export const STORAGE_STATE = join(repoRoot, 'e2e', '.auth', 'operator.json');

/** The operator identity the authenticated specs sign in as. */
export const operatorEmail =
  process.env.E2E_CLERK_OPERATOR_EMAIL?.trim() ||
  'operator+clerk_test@flowstarter.dev';

export const operatorPassword = process.env.E2E_CLERK_OPERATOR_PASSWORD?.trim();

/**
 * Whether authenticated specs can run at all. Without keys they are skipped
 * rather than failed, so the unauthenticated smoke suite stays green on a
 * machine that has no Clerk development instance configured.
 */
export function clerkConfigured(): boolean {
  return Boolean(
    process.env.CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

export function clerkSkipReason(): string {
  const missing = [
    process.env.CLERK_PUBLISHABLE_KEY?.trim()
      ? null
      : 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_…)',
    process.env.CLERK_SECRET_KEY?.trim() ? null : 'CLERK_SECRET_KEY (sk_test_…)',
  ].filter(Boolean);
  return `Clerk development keys missing from apps/flowstarter-main/.env.local: ${missing.join(', ')}`;
}

/**
 * Guard against ever pointing the suite at a live instance — these specs
 * create Stripe invoices and mutate workspace state.
 */
export function assertDevelopmentInstance(): void {
  const publishable = process.env.CLERK_PUBLISHABLE_KEY?.trim() ?? '';
  const secret = process.env.CLERK_SECRET_KEY?.trim() ?? '';
  if (publishable.startsWith('pk_live_') || secret.startsWith('sk_live_')) {
    throw new Error(
      'Refusing to run E2E auth against a Clerk production instance. Use pk_test_/sk_test_ keys.',
    );
  }
}
