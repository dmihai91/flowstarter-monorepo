import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Test Structure:
 * - e2e/full-site-build.spec.ts  - PRIMARY: Complete site creation flow (default)
 * - e2e/smoke/                   - Quick smoke tests for CI
 * - e2e/integration/             - Detailed integration tests
 * - e2e/debug/                   - Debug/inspection utilities
 *
 * Run commands:
 * - pnpm test:e2e                - Run primary full flow test only
 * - pnpm test:e2e:all            - Run all tests
 * - pnpm test:e2e:smoke          - Run smoke tests only
 * - pnpm test:e2e:integration    - Run integration tests only
 */
export default defineConfig({
  testDir: './e2e',
  /* Only run the main full-site-build test by default */
  testMatch: '*.spec.ts',
  /* Global teardown - cleanup Daytona sandboxes after all tests */
  globalTeardown: './e2e/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use multiple workers for parallel execution */
  workers: process.env.CI ? 2 : 4,
  /* Test timeout - extended for full site build flow */
  timeout: 120000, // 2 minutes default, individual tests can override
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure for debugging */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Note: Use 'npm run dev' for Vite (UI testing) or start Remix server manually for API routes */
  /* Windows Node 22 has ESM path issues with tsx - use Node 20 for full server or test UI-only */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

