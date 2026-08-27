import { defineConfig, devices } from '@playwright/test';
// Side effect: loads apps/flowstarter-main/.env.local so Clerk keys reach both
// this config and the test workers.
import { STORAGE_STATE } from './e2e/support/clerk-env';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    // The library pages reveal content via scroll animations gated behind
    // `@media (prefers-reduced-motion: no-preference)` (see library.css). Under
    // reduced-motion those `.reveal` elements render immediately (no opacity:0
    // start state), so headings are visible without waiting on an animation /
    // IntersectionObserver that fires unreliably in headless. Emulating reduced
    // motion makes the templates-audit deterministic instead of flaky.
    reducedMotion: 'reduce',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Authenticated specs run in `chromium-auth`; the setup project is not a
      // test suite. Everything else stays unauthenticated, as it was.
      testIgnore: [/\.auth\.spec\.ts$/, /global\.setup\.ts$/],
    },
    {
      name: 'setup',
      testMatch: /global\.setup\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-auth',
      testMatch: /\.auth\.spec\.ts$/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Written by the setup project after a real Clerk sign-in.
        storageState: STORAGE_STATE,
      },
    },
  ],

  // In CI: PLAYWRIGHT_BASE_URL points at staging — no local server needed.
  // Locally: spin up the dev server.
  ...(process.env.CI
    ? {}
    : {
        webServer: [
          {
            command: 'cd apps/flowstarter-main && npx next dev -p 3000',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 120000,
          },
        ],
      }),
});
