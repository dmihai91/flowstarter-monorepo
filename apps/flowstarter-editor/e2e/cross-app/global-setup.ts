/**
 * Global Setup — logs in as the E2E test user and saves Clerk session state.
 * Runs once before all cross-app tests; all tests reuse the saved session.
 *
 * Uses Clerk's standard email/password sign-in on flowstarter.dev/login.
 * The saved storageState includes the Clerk session cookies that are valid
 * across both flowstarter.dev AND editor.flowstarter.dev (satellite domain).
 */
import { chromium, type FullConfig } from '@playwright/test';
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as fs from 'fs';

config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

const BASE   = process.env.E2E_BASE_URL   || 'https://flowstarter.dev';
const EMAIL  = process.env.E2E_USER_EMAIL || '';
const PASS   = process.env.E2E_USER_PASSWORD || '';
const STATE  = path.resolve(__dirname, '.auth/session.json');

export default async function globalSetup(_config: FullConfig) {
  if (!EMAIL || !PASS) {
    throw new Error(
      'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set.\n' +
      'Add them to apps/flowstarter-editor/.env.local'
    );
  }

  // If session file is recent (< 30 min), reuse it
  if (fs.existsSync(STATE)) {
    const age = Date.now() - fs.statSync(STATE).mtimeMs;
    if (age < 30 * 60 * 1000) {
      console.log('[global-setup] Reusing recent session (age:', Math.round(age / 60000), 'min)');
      return;
    }
  }

  console.log('[global-setup] Logging in as', EMAIL, '...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  // Navigate to the main platform login
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');

  // Clerk sign-in flow — email first, then password
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(EMAIL);

  // Click Continue (Clerk's multi-step flow)
  const continueBtn = page.getByRole('button', { name: /continue|next/i }).first();
  if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await continueBtn.click();
    await page.waitForTimeout(1000);
  }

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 10_000 });
  await passwordInput.fill(PASS);

  await page.getByRole('button', { name: /sign in|log in|continue/i }).last().click();

  // Wait for successful redirect (away from /login)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  console.log('[global-setup] Logged in. URL:', page.url());

  // Save the full session state (cookies + localStorage — includes Clerk JWT)
  await context.storageState({ path: STATE });
  console.log('[global-setup] Session saved to', STATE);

  await browser.close();
}
