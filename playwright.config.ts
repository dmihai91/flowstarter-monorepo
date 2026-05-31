import { defineConfig, devices } from '@playwright/test';

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
