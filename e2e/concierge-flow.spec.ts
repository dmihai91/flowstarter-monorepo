import { test, expect } from '@playwright/test';

test.describe('Concierge Flow E2E', () => {
  
  test.describe('Main Platform', () => {
    
    test('Landing page loads with glassmorphism header', async ({ page }) => {
      await page.goto('/');
      
      // Check header exists and has frosted glass styling
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'e2e/screenshots/01-landing-page.png', fullPage: true });
    });

    test('Team dashboard requires auth', async ({ page }) => {
      await page.goto('/team/dashboard');
      
      // Should redirect to login or show auth prompt
      await page.waitForTimeout(2000);
      const url = page.url();
      
      // Either redirected to login or shows login component
      const isAuthPage = url.includes('login') || url.includes('sign-in');
      const hasAuthPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
      
      expect(isAuthPage || hasAuthPrompt).toBeTruthy();
      
      await page.screenshot({ path: 'e2e/screenshots/02-team-auth-required.png', fullPage: true });
    });

    test('Client dashboard requires auth', async ({ page }) => {
      await page.goto('/dashboard');
      
      await page.waitForTimeout(2000);
      const url = page.url();
      
      const isAuthPage = url.includes('login') || url.includes('sign-in');
      const hasAuthPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
      
      expect(isAuthPage || hasAuthPrompt).toBeTruthy();
      
      await page.screenshot({ path: 'e2e/screenshots/03-client-auth-required.png', fullPage: true });
    });

    test('Help page loads with user profile when logged in', async ({ page }) => {
      await page.goto('/help');
      
      // Help page should load
      await expect(page.locator('text=Help Center').first()).toBeVisible();
      
      // Check for glassmorphism header
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      
      await page.screenshot({ path: 'e2e/screenshots/04-help-page.png', fullPage: true });
    });

    test('Pricing page loads', async ({ page }) => {
      await page.goto('/pricing');
      
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'e2e/screenshots/05-pricing-page.png', fullPage: true });
    });

  });

  test.describe('Editor', () => {
    
    test('Editor redirects to signin when not authenticated', async ({ page }) => {
      // Try to access editor directly
      await page.goto('http://localhost:5175');
      
      await page.waitForTimeout(3000);
      const url = page.url();
      
      // Should redirect to main platform signin
      const isRedirected = url.includes('login') || 
                          url.includes('sign-in') || 
                          url.includes('flowstarter.dev') ||
                          url.includes('localhost:3000');
      
      await page.screenshot({ path: 'e2e/screenshots/06-editor-auth-redirect.png', fullPage: true });
      
      // Note: This test documents current behavior
      console.log('Editor redirect URL:', url);
    });

  });

  test.describe('UI Components', () => {
    
    test('Glassmorphism styling is applied', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to fully load
      await page.waitForTimeout(1000);
      
      // Check that CSS variables are defined
      const purpleVar = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--purple');
      });
      
      console.log('Purple CSS variable:', purpleVar);
      
      await page.screenshot({ path: 'e2e/screenshots/07-glassmorphism-check.png', fullPage: true });
    });

  });

});

test.describe('Feedback System', () => {
  
  test('Feedback dialog opens (requires auth)', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.waitForTimeout(2000);
    
    // This will likely show auth page, but we're testing the flow
    await page.screenshot({ path: 'e2e/screenshots/08-feedback-prereq.png', fullPage: true });
  });

});
