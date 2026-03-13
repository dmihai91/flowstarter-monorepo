/**
 * Global Setup — Clerk testing environment for E2E tests.
 * Uses @clerk/testing official Playwright integration.
 */
import { clerkSetup } from '@clerk/testing/playwright';
import type { FullConfig } from '@playwright/test';
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

export default async function globalSetup(_config: FullConfig) {
  if (!process.env.E2E_SECRET) throw new Error('E2E_SECRET must be set');
  if (!process.env.CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY must be set');

  // Ensure publishable key is available (might be under different env var names)
  if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }

  await clerkSetup();
  console.log('[global-setup] Clerk testing environment ready');
  console.log('[global-setup] CLERK_TESTING_TOKEN:', process.env.CLERK_TESTING_TOKEN ? 'set ✅' : 'missing ❌');
}
