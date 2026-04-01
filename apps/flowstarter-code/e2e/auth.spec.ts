import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────
const LOGIN_URL = '/login';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('renders login page with all key elements', async ({ page }) => {
    // Title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // SSO button
    const ssoBtn = page.getByTestId('sso-button');
    await expect(ssoBtn).toBeVisible();
    await expect(ssoBtn).toContainText('Continue with Flowstarter SSO');

    // Email and password inputs
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();

    // Submit button
    await expect(page.getByTestId('submit-button')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toContainText('Sign in');
  });

  test('submit button is disabled when fields are empty', async ({ page }) => {
    const submitBtn = page.getByTestId('submit-button');
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button enables when both fields are filled', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@flowstarter.app');
    await page.getByTestId('password-input').fill('somepassword');
    const submitBtn = page.getByTestId('submit-button');
    await expect(submitBtn).toBeEnabled();
  });

  test('shows SSO loading state when SSO button is clicked', async ({ page }) => {
    const ssoBtn = page.getByTestId('sso-button');
    // Don't await the navigation so we can observe the loading state
    await ssoBtn.click();
    // Should show loading text immediately
    await expect(ssoBtn).toContainText('Redirecting to SSO', { timeout: 2000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    const pwInput = page.getByTestId('password-input');
    await pwInput.fill('mypassword');

    // Should start as type=password
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Toggle button appears after typing
    const toggleBtn = page.getByRole('button', { name: /show password/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    await expect(pwInput).toHaveAttribute('type', 'text');

    // Toggle back
    const hideBtn = page.getByRole('button', { name: /hide password/i });
    await hideBtn.click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('SSO button is disabled while credentials form is submitting', async ({ page }) => {
    // Fill form to enable submit
    await page.getByTestId('email-input').fill('test@flowstarter.app');
    await page.getByTestId('password-input').fill('wrongpassword');

    const submitBtn = page.getByTestId('submit-button');
    const ssoBtn    = page.getByTestId('sso-button');

    // Click submit and quickly check SSO button
    await submitBtn.click();
    // During the credentials call, SSO button should be disabled
    await expect(ssoBtn).toBeDisabled();
  });
});

test.describe('Theme — light mode', () => {
  test.use({ colorScheme: 'light' });

  test('page renders without flash of dark content', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');

    // html element should either have no class or have .dark removed
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    // In light mode, should NOT have 'dark' class
    expect(htmlClass).not.toContain('dark');
  });

  test('body background is light-themed', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');

    const bg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Light bg should not be #0a0810 (10,8,16)
    expect(bg).not.toBe('rgb(10, 8, 16)');
  });
});

test.describe('Theme — dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('html element gets .dark class in dark mode', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');

    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });
});

test.describe('Unauthenticated access protection', () => {
  test('visiting / without session redirects to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/login**', { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test('all form fields have labels', async ({ page }) => {
    const emailInput = page.getByTestId('email-input');
    const pwInput    = page.getByTestId('password-input');

    // Each input should have an associated label (by id)
    const emailId = await emailInput.getAttribute('id');
    const pwId    = await pwInput.getAttribute('id');

    expect(emailId).toBeTruthy();
    expect(pwId).toBeTruthy();

    await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
    await expect(page.locator(`label[for="${pwId}"]`)).toBeVisible();
  });

  test('error message has role=alert', async ({ page }) => {
    await page.getByTestId('email-input').fill('bad@test.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('submit-button').click();

    // Wait for error (credentials won't work without a real server — that's expected)
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 8000 });
  });

  test('page title is set correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Flowstarter Code/i);
  });
});
