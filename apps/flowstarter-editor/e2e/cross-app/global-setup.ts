/**
 * Global Setup — establishes a real Clerk browser session for E2E tests.
 *
 * Flow:
 * 1. Issue a sign-in token via Clerk backend SDK
 * 2. Navigate browser to /?__clerk_ticket=TOKEN  (middleware now passes this through)
 * 3. Clerk JS processes the ticket and sets __client_uat cookie
 * 4. Save storageState — all tests get a real session
 *
 * API-level tests (1.1–1.4, 2.1–2.3) also send X-E2E-Secret for direct node-fetch calls.
 * Browser tests (1.5+) use the real Clerk session from storageState for Convex auth.
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
const EDITOR_BASE  = process.env.E2E_EDITOR_URL  || 'https://editor.flowstarter.dev';
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || '';
const TEST_USER_ID = process.env.E2E_USER_ID || 'user_3AeSkinjvy9jZkCFvkupD9I06PG';
const STATE        = path.resolve(__dirname, '.auth/session.json');
const MAX_AGE_MS   = 20 * 60 * 1000; // 20 minutes

export default async function globalSetup(_config: FullConfig) {
  if (!process.env.E2E_SECRET) throw new Error('E2E_SECRET must be set');
  if (!CLERK_SECRET)            throw new Error('CLERK_SECRET_KEY must be set');

  // Reuse if session is recent enough
  if (fs.existsSync(STATE)) {
    const age = Date.now() - fs.statSync(STATE).mtimeMs;
    if (age < MAX_AGE_MS) {
      console.log('[global-setup] Reusing session (age:', Math.round(age / 60000), 'min)');
      return;
    }
  }

  // Issue a sign-in ticket
  console.log('[global-setup] Creating Clerk sign-in token for', TEST_USER_ID);
  const clerk = createClerkClient({ secretKey: CLERK_SECRET });
  const { token } = await clerk.signInTokens.createSignInToken({
    userId: TEST_USER_ID,
    expiresInSeconds: 300,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Session cookies MUST be on flowstarter.dev (the Clerk primary domain),
  // not localhost. Only then does Clerk satellite sync work for editor.flowstarter.dev.
  // We always use the live domain for ticket consumption, regardless of E2E_BASE_URL.
  const CLERK_PRIMARY = 'https://flowstarter.dev';
  const ticketUrl = `${CLERK_PRIMARY}/?__clerk_ticket=${token}`;
  console.log('[global-setup] Navigating to establish Clerk session...');
  await page.goto(ticketUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Wait for Clerk JS to process the ticket (__client_uat becomes non-zero)
  await page.waitForFunction(
    () => {
      const match = document.cookie.split(';')
        .find(c => c.trim().startsWith('__client_uat='));
      const val = match?.split('=')[1]?.trim();
      return !!val && val !== '0';
    },
    { timeout: 20_000 }
  ).catch(() => console.warn('[global-setup] __client_uat still 0 after 20s'));

  const cookies = await context.cookies();
  const uat = cookies.find(c => c.name === '__client_uat')?.value;
  console.log('[global-setup] __client_uat:', uat, uat && uat !== '0' ? '✅' : '❌');
  console.log('[global-setup] Final URL:', page.url());

  if (!uat || uat === '0') {
    // Session didn't establish — tests will fall back to E2E_SECRET for API calls.
    // Browser tests requiring Convex auth will be skipped or will fail gracefully.
    console.warn('[global-setup] ⚠️  Clerk session not established — browser tests may fail');
  }

  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE });
  console.log('[global-setup] Session saved to', STATE);
  await browser.close();
}
