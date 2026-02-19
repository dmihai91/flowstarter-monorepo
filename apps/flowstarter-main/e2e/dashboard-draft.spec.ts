import { expect, test } from '@playwright/test';

test.describe('Dashboard draft flow', () => {
  test('can open wizard and see details step, type basic info, and navigate', async ({
    page,
  }) => {
    await page.goto('/dashboard/new');

    // Details step visible
    await expect(page.locator('text=Project Details')).toBeVisible();

    // Fill basic fields
    await page
      .getByPlaceholder('Enter your project name')
      .fill('My Test Project');
    await page
      .getByPlaceholder('Describe your project in one or two sentences')
      .fill('a'.repeat(60));
    await page
      .getByPlaceholder('e.g., entrepreneurs, SMBs, students ')
      .fill('entrepreneurs');

    // Next to template step
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('text=Choose Template')).toBeVisible();

    // Back to details
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('text=Project Details')).toBeVisible();
  });
});
