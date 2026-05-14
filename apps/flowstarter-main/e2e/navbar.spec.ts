import { expect, test, type TestInfo } from '@playwright/test';
import { signInToAdminDashboardIfNeeded } from './helpers/adminSignIn';

test.describe('Admin dashboard chrome', () => {
  test('shows masthead actions without legacy draft prompts', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'Dashboard shell assertions target the desktop layout.'
    );

    await signInToAdminDashboardIfNeeded(page);

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Continue draft');
    await expect(page.getByRole('link', { name: /new project/i })).toBeVisible();
    // Templates link is hidden on `/admin/*` app chrome (library is external).
    await expect(
      page.getByRole('link', { name: 'Projects' }).first()
    ).toBeVisible();
  });

  test('keeps public help available from the marketing surface', async ({
    page,
  }) => {
    await page.goto('/help');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('body')).toContainText(/help/i);
  });
});
