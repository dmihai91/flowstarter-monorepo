import { expect, type Page } from '@playwright/test';

export const E2E_ADMIN_EMAIL =
  process.env.E2E_USER_EMAIL || 'test@flowstarter.app';
export const E2E_ADMIN_PASSWORD = process.env.E2E_USER_PASSWORD || '';

/**
 * True when the operator dashboard home is loaded (signed-in admin).
 */
export async function isAdminDashboardHome(page: Page): Promise<boolean> {
  const newProject = page.getByRole('link', { name: /new project/i });
  const dashboardNav = page.getByRole('link', { name: 'Dashboard', exact: true });
  return (
    (await newProject.isVisible().catch(() => false)) ||
    (await dashboardNav.isVisible().catch(() => false))
  );
}

/**
 * Sign in via `/admin/dashboard` if Clerk session is missing.
 * Uses resilient selectors (labels) instead of team-specific placeholders.
 */
export async function signInToAdminDashboardIfNeeded(page: Page) {
  await page.goto('/admin/dashboard');

  const loginHeading = page.getByRole('heading', { name: 'Team Login' });

  await Promise.race([
    page
      .getByRole('link', { name: /new project/i })
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => null),
    loginHeading.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null),
  ]);

  if (await isAdminDashboardHome(page)) {
    return;
  }

  if (!(await loginHeading.isVisible().catch(() => false))) {
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 5000 }).catch(() => {
      /* may already be on a Clerk interstitial */
    });
    if (await isAdminDashboardHome(page)) return;
  }

  if (!E2E_ADMIN_PASSWORD) {
    throw new Error(
      'E2E_USER_PASSWORD is required to sign in the automation account'
    );
  }

  await page.getByLabel(/email address/i).fill(E2E_ADMIN_EMAIL);
  await page.getByLabel(/^password$/i).fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 45000 });
  await expect(page.getByRole('link', { name: /new project/i })).toBeVisible({
    timeout: 20000,
  });
}
