import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

/**
 * Cross-App Playwright Config
 *
 * Runs E2E tests that span BOTH the main platform (localhost:3000) and the
 * editor (localhost:5173). Used for full operator flow: dashboard → handoff → editor.
 *
 * Run: npx playwright test --config=playwright.cross-app.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/cross-app',
  fullyParallel: false, // cross-app tests share state, run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // No fixed baseURL — tests navigate explicitly to localhost:3000 or :5173
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Keep the browser context alive across navigations to both apps
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'cross-app-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Both servers must be running. In CI, start them; locally they're assumed running.
  webServer: process.env.CI
    ? [
        {
          command: 'npx next dev -p 3000',
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          cwd: '../../apps/flowstarter-main',
        },
        {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: false,
          cwd: '../../apps/flowstarter-editor',
        },
      ]
    : undefined, // locally: assume both dev servers are running
});
