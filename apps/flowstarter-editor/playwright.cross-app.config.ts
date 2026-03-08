/**
 * Cross-App Playwright Config — Production Domain
 *
 * Runs E2E tests against the real deployed apps:
 *   Main platform:  https://flowstarter.dev
 *   Editor:         https://editor.flowstarter.dev
 *
 * Auth: Real Clerk session, saved by global setup (login once, reuse).
 * Convex: Real deployment (outstanding-otter-369.convex.cloud).
 * Supabase: Real deployment — tests create/clean up their own data.
 * Daytona + Claude AI: Intercepted at browser level (SSE routes mocked).
 *
 * Run:
 *   npx playwright test --config=playwright.cross-app.config.ts
 *
 * Required env vars (in .env or shell):
 *   E2E_BASE_URL        https://flowstarter.dev
 *   E2E_EDITOR_URL      https://editor.flowstarter.dev
 *   E2E_USER_EMAIL      e2e@flowstarter.dev
 *   E2E_USER_PASSWORD   <secret>
 *   HANDOFF_SECRET      <shared secret>
 */
import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const BASE     = process.env.E2E_BASE_URL    || 'https://flowstarter.dev';
const EDITOR   = process.env.E2E_EDITOR_URL  || 'https://editor.flowstarter.dev';

export default defineConfig({
  testDir: './e2e/cross-app',
  fullyParallel: false,  // sequential — tests share Convex/Supabase state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 300_000, // 5 min — real Claude + Daytona generation
  reporter: process.env.CI ? 'github' : 'list',

  globalSetup: './e2e/cross-app/global-setup.ts',

  use: {
    baseURL: BASE,
    storageState: './e2e/cross-app/.auth/session.json',  // saved by global-setup
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'cross-app-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export { BASE, EDITOR };
