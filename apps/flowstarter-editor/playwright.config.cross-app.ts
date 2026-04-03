/**
 * Playwright config for cross-app E2E scenarios.
 *
 * These tests hit REAL APIs (Supabase, Convex) but use mocked AI/Daytona
 * for scenarios 1-3. Scenario 4 is gated behind RUN_REAL_BUILD_E2E=1.
 *
 * Required env vars:
 *   E2E_SECRET          — bypass token for requireAuth() middleware
 *   E2E_BASE_URL        — flowstarter-main URL (default: https://flowstarter.dev)
 *   PLAYWRIGHT_E2E_EDITOR_URL — editor URL (default: http://localhost:5173)
 *   CLERK_SECRET_KEY    — for global-setup Clerk token
 *   HANDOFF_SECRET      — HMAC signing key for handoff tokens
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/cross-app',
  testMatch: '*.spec.ts',

  globalSetup: './e2e/cross-app/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  fullyParallel: false, // cross-app tests share real DB state — keep sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  timeout: 300_000, // 5 min default; scenario 4 overrides to 10 min

  reporter: process.env.CI
    ? [['github'], ['json', { outputFile: 'test-results/cross-app-results.json' }]]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_E2E_EDITOR_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'pnpm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
