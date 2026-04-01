import { expect, test } from '@playwright/test';

test('help page is reachable from the supported public surface', async ({ page }) => {
  await page.goto('/help');
  await expect(page.getByRole('heading', { name: /help/i }).first()).toBeVisible();
  await expect(page.locator('body')).toContainText(/question|support|help/i);
});
