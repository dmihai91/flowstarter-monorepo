import { expect, test } from '@playwright/test';

test.describe('Navbar', () => {
  test('should not show continue draft button when signed in', async ({
    page,
  }) => {
    // Navigate to dashboard (assumes user is signed in or mocked)
    await page.goto('/dashboard');

    // Wait for navbar to load
    await page.waitForSelector('header', { timeout: 5000 });

    // Verify Continue draft button is not present
    const continueDraftButton = page.locator('text=Continue draft');
    await expect(continueDraftButton).not.toBeVisible();

    // Verify Create button IS present
    const createButton = page.locator('text=Create').first();
    await expect(createButton).toBeVisible();
  });

  test('should not show continue draft button on other pages', async ({
    page,
  }) => {
    // Navigate to help page
    await page.goto('/help');

    // Wait for navbar to load
    await page.waitForSelector('header', { timeout: 5000 });

    // Verify Continue draft button is not present
    const continueDraftButton = page.locator('text=Continue draft');
    await expect(continueDraftButton).not.toBeVisible();

    // Verify Create button IS present
    const createButton = page.locator('text=Create').first();
    await expect(createButton).toBeVisible();
  });

  test('should not show continue draft button in mobile dropdown', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for navbar to load
    await page.waitForSelector('header', { timeout: 5000 });

    // Try to find and click mobile menu button (typically a hamburger or dots icon)
    const mobileMenuButton = page
      .locator('button[aria-label="More actions"]')
      .first();

    // If mobile menu exists, open it
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Wait a bit for menu to open
      await page.waitForTimeout(300);

      // Verify Continue draft is not in the dropdown
      const continueDraftInDropdown = page.locator('text=Continue draft');
      await expect(continueDraftInDropdown).not.toBeVisible();
    }
  });

  test('should show Create button in navbar', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for navbar to load
    await page.waitForSelector('header', { timeout: 5000 });

    // Verify Create button exists
    const createButton = page.locator('text=Create');
    await expect(createButton.first()).toBeVisible();
  });

  test('should show Help button in navbar', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for navbar to load
    await page.waitForSelector('header', { timeout: 5000 });

    // Verify Help button exists
    const helpButton = page.locator('text=Help');
    await expect(helpButton.first()).toBeVisible();
  });
});
