import { expect, test, type Page, type TestInfo } from '@playwright/test';

const TEAM_EMAIL = process.env.E2E_USER_EMAIL || 'test@flowstarter.app';
const TEAM_PASSWORD = process.env.E2E_USER_PASSWORD || '';

async function signInToTeamDashboard(page: Page) {
  await page.goto('/team/dashboard');

  const dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
  const loginHeading = page.getByRole('heading', { name: 'Team Login' });

  await Promise.race([
    dashboardHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
    loginHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
  ]);

  if (await dashboardHeading.isVisible().catch(() => false)) {
    return;
  }

  if (!TEAM_PASSWORD) {
    throw new Error('E2E_USER_PASSWORD is required to sign in the automation account');
  }

  await page.getByPlaceholder('you@flowstarter.app').fill(TEAM_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(TEAM_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/team\/dashboard/, { timeout: 30000 });
  await expect(dashboardHeading).toBeVisible();
}

test.describe('Dashboard navigation shell', () => {
  test('shows the supported dashboard actions without legacy draft prompts', async ({ page }, testInfo: TestInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'Dashboard shell assertions are covered by the desktop layout only.');
    await signInToTeamDashboard(page);

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Continue draft');
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
    await expect(page.getByRole('link', { name: /templates/i })).toBeVisible();
  });

  test('keeps public help available from the supported surface', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('body')).toContainText(/help/i);
  });
});
