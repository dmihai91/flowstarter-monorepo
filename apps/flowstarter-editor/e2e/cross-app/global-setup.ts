/**
 * Global Setup — Establishes a Clerk session for the E2E test user.
 *
 * Uses Clerk's signInTokens API (backend SDK) to issue a magic-link token,
 * then navigates the browser to a protected page to consume it.
 * Avoids the /login page which has Next.js redirect logic that fights
 * with Clerk's ticket handling.
 */
import { chromium, type FullConfig } from '@playwright/test';
import { createClerkClient } from '@clerk/backend';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

const BASE         = process.env.E2E_BASE_URL   || 'https://flowstarter.dev';
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || '';
const TEST_USER_ID = process.env.E2E_USER_ID || 'user_3AeSkinjvy9jZkCFvkupD9I06PG';
const STATE        = path.resolve(__dirname, '.auth/session.json');

export default async function globalSetup(_config: FullConfig) {
  if (!CLERK_SECRET) throw new Error('CLERK_SECRET_KEY must be set');

  // Reuse recent session (< 15 min old)
  if (fs.existsSync(STATE)) {
    const age = Date.now() - fs.statSync(STATE).mtimeMs;
    if (age < 15 * 60 * 1000) {
      console.log('[global-setup] Reusing session (age:', Math.round(age / 60000), 'min)');
      return;
    }
  }

  console.log('[global-setup] Creating Clerk sign-in token for', TEST_USER_ID);
  const clerk = createClerkClient({ secretKey: CLERK_SECRET });
  const { token } = await clerk.signInTokens.createSignInToken({
    userId: TEST_USER_ID,
    expiresInSeconds: 300,
  });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Navigate to a protected app page with the ticket.
  // /team/dashboard works because Clerk's JS SDK processes __clerk_ticket
  // on ANY page — we just need to avoid /login which has conflicting redirects.
  const ticketUrl = `${BASE}/team/dashboard?__clerk_ticket=${token}`;
  console.log('[global-setup] Consuming ticket at /team/dashboard...');

  await page.goto(ticketUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Wait for Clerk JS to fully process the ticket and set __client_uat
  await page.waitForFunction(
    () => {
      const uat = document.cookie.split(';')
        .find(c => c.trim().startsWith('__client_uat='));
      const val = uat?.split('=')[1]?.trim();
      return val && val !== '0';
    },
    { timeout: 20_000 }
  ).catch(() => console.log('[global-setup] __client_uat still 0 — session may not be active'));

  const finalUrl = page.url();
  const cookies  = await context.cookies(BASE);
  const uat      = cookies.find(c => c.name === '__client_uat')?.value;
  console.log('[global-setup] Final URL:', finalUrl);
  console.log('[global-setup] __client_uat:', uat, uat !== '0' ? '✅ active' : '❌ not active');

  if (uat === '0' || !uat) {
    throw new Error(
      '[global-setup] Clerk session not established — __client_uat=0.\n' +
      'Ensure the E2E Supabase dev project has the Clerk JWT template configured.\n' +
      'See: https://clerk.com/docs/integrations/databases/supabase'
    );
  }

  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE });
  console.log('[global-setup] Session saved ✅');

  await browser.close();
}
