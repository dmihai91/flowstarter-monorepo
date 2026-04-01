import { expect, test, type Page } from '@playwright/test';

const TEAM_EMAIL = process.env.E2E_USER_EMAIL || 'test@flowstarter.app';
const TEAM_PASSWORD = process.env.E2E_USER_PASSWORD || '';

async function signInIfNeeded(page: Page) {
  const dashboardHeading = page.getByText('New client project');
  const loginHeading = page.getByRole('heading', { name: 'Team Login' });

  await Promise.race([
    dashboardHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
    loginHeading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null),
  ]);

  if (await dashboardHeading.isVisible().catch(() => false)) {
    return;
  }

  const needsLogin = await loginHeading.isVisible().catch(() => false);

  if (!needsLogin) {
    await page.waitForURL(/\/team\/dashboard\/new/, { timeout: 15000 });
    return;
  }

  if (!TEAM_PASSWORD) {
    throw new Error('E2E_USER_PASSWORD is required to sign in the automation account');
  }

  const emailInput = page.getByPlaceholder('you@flowstarter.app');
  const passwordInput = page.getByPlaceholder('Enter your password');
  const signInButton = page.getByRole('button', { name: 'Sign in' });

  await emailInput.fill(TEAM_EMAIL);
  await passwordInput.fill(TEAM_PASSWORD);
  await expect(signInButton).toBeEnabled({ timeout: 10000 });
  await signInButton.click();
  await Promise.race([
    page.waitForURL(/\/team\/dashboard\/new/, { timeout: 30000 }).catch(() => null),
    page.waitForURL(/\/team\/dashboard(?:\?.*)?$/, { timeout: 30000 }).catch(() => null),
  ]);

  if (!/\/team\/dashboard\/new(?:\?.*)?$/.test(page.url())) {
    await page.goto('/team/dashboard/new');
    await page.waitForURL(/\/team\/dashboard\/new/, { timeout: 15000 });
  }
}

test.describe('Dashboard draft flow', () => {
  test('supports the new dashboard project flow without wizard routes', async ({ page }) => {
    await page.goto('/team/dashboard/new');
    await signInIfNeeded(page);

    await expect(page.getByText('New client project')).toBeVisible();

    await page.getByLabel(/name/i).fill('My Test Project');
    await page.getByLabel(/email/i).fill('operator@example.com');
    await page.getByLabel(/phone/i).fill('+40 722 000 111');
    await page.locator('select').selectOption({ label: 'Technology & SaaS' });

    await page.getByRole('button', { name: 'Fill in manually' }).click();
    await page.getByRole('button', { name: 'Continue to brief editor' }).click();

    await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible();
    await page.getByPlaceholder('e.g. Milano Bistro').fill('My Test Project');
    await page.getByPlaceholder('What does this business do and who does it serve?').fill(
      'A SaaS landing page for small teams that need lightweight workflow automation.'
    );
    await page.getByPlaceholder('e.g. Young professionals in urban areas').fill('Operations managers at small software companies');

    await page.getByRole('button', { name: /^Next$/ }).click();
    await expect(page.getByRole('heading', { name: 'Offer' })).toBeVisible();
    await page.getByPlaceholder('What makes this business stand out?').fill('Automate repetitive operations work in minutes');
    await page.getByRole('button', { name: /Generate leads/i }).click();
    await page.getByRole('button', { name: 'Professional' }).click();
    await page.getByPlaceholder('e.g. Book more consultations').fill('Book more demos');
    await page.getByPlaceholder('e.g. Schedule a discovery call').fill('Schedule a demo');

    await page.getByRole('button', { name: /^Next$/ }).click();
    await expect(page.getByRole('heading', { name: 'Structure' })).toBeVisible();
    await page.getByRole('button', { name: /Single page/i }).click();

    await page.getByRole('button', { name: /^Next$/ }).click();
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await page.getByPlaceholder('hello@business.com').fill('hello@example.com');

    await page.getByRole('button', { name: /Done — pick template/i }).click();
    await expect(page.getByText('Choose a template, palette, and font')).toBeVisible();

    await expect(page).toHaveURL(/\/team\/dashboard\/new/);
    await expect(page).not.toHaveURL(/\/wizard/);
  });
});
