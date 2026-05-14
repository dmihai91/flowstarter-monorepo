import { expect, test } from '@playwright/test';
import { signInToAdminDashboardIfNeeded } from './helpers/adminSignIn';

test.describe('Admin new-project wizard', () => {
  test('walks the discovery → client → brief → setup flow (no /wizard routes)', async ({
    page,
  }) => {
    await signInToAdminDashboardIfNeeded(page);
    await page.goto('/admin/dashboard/new');

    await expect(
      page.getByRole('heading', { name: 'New project' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Discovery notes' })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await page.getByRole('textbox').fill(
      'E2E discovery: local bakery wants online orders, friendly tone, budget mid-range, prefers minimal admin, and simple checkout with email receipts for regulars.'
    );

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(
      page.getByRole('heading', { name: 'Client details' })
    ).toBeVisible();

    await page.getByLabel(/full name/i).fill('E2E Test Client');
    await page.getByLabel(/^email \*$/i).fill('client-e2e@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(
      page.getByRole('heading', { name: 'Business brief' })
    ).toBeVisible();
    await page
      .getByLabel(/business description/i)
      .fill(
        'A concierge web presence for a local service business; needs clear CTAs and booking.'
      );
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(
      page.getByRole('heading', { name: 'Tier & commerce' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Essential' }).click();

    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard\/projects\/[^/]+/, {
      timeout: 60000,
    });
    await expect(page).not.toHaveURL(/\/wizard/);
  });

  test('reuses dashboard auth when starting from home', async ({ page }) => {
    await signInToAdminDashboardIfNeeded(page);
    await page.goto('/admin/dashboard/new');
    await expect(
      page.getByRole('heading', { name: 'New project' })
    ).toBeVisible();
  });
});
