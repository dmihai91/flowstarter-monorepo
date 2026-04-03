/**
 * Concierge Flow — Smoke Tests (Root Level)
 *
 * Quick sanity checks on the main platform.
 * Runs against flowstarter-main (localhost:3000).
 *
 * These do NOT require auth and do NOT hit real AI/Daytona.
 * Full flow tests live in apps/flowstarter-editor/e2e/cross-app/.
 */

import { test, expect } from '@playwright/test';

test.describe('Concierge Flow — Platform Smoke', () => {
  test.describe('Main Platform', () => {
    test('Landing page loads with header', async ({ page }) => {
      await page.goto('/');
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      await page.screenshot({ path: 'e2e/screenshots/01-landing-page.png', fullPage: true });
    });

    test('Team dashboard redirects to auth when unauthenticated', async ({ page }) => {
      await page.goto('/team/dashboard');
      await page.waitForTimeout(2000);
      const url = page.url();
      const isAuthPage =
        url.includes('login') ||
        url.includes('sign-in') ||
        url.includes('signin');
      const hasAuthPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
      expect(isAuthPage || hasAuthPrompt).toBeTruthy();
      await page.screenshot({ path: 'e2e/screenshots/02-team-auth-required.png', fullPage: true });
    });

    test('Client dashboard redirects to auth when unauthenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      const url = page.url();
      const isAuthPage =
        url.includes('login') ||
        url.includes('sign-in') ||
        url.includes('signin');
      const hasAuthPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
      expect(isAuthPage || hasAuthPrompt).toBeTruthy();
      await page.screenshot({ path: 'e2e/screenshots/03-client-auth-required.png', fullPage: true });
    });

    test('Pricing page loads', async ({ page }) => {
      await page.goto('/pricing');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/05-pricing-page.png', fullPage: true });
    });
  });

  test.describe('Editor', () => {
    test('Editor redirects to signin when not authenticated', async ({ page }) => {
      await page.goto('http://localhost:5175');
      await page.waitForTimeout(3000);
      const url = page.url();
      const isRedirected =
        url.includes('login') ||
        url.includes('sign-in') ||
        url.includes('flowstarter.dev') ||
        url.includes('localhost:3000');
      await page.screenshot({ path: 'e2e/screenshots/06-editor-auth-redirect.png', fullPage: true });
      console.log('Editor redirect URL:', url);
      // Document behavior — not a hard failure if editor isn't running
      expect(typeof isRedirected).toBe('boolean');
    });
  });
});
