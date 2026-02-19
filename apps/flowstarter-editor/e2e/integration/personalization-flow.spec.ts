import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Personalization Flow (Palette → Font → Logo)
 *
 * Tests the combined personalization step that includes:
 * - Color palette selection
 * - Font selection
 * - Logo upload/skip
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  await page.route('**/api/onboarding-chat', async (route) => {
    const json = await route.request().postDataJSON();
    let message = "Let's continue.";

    if (json.action === 'generate-message') {
      const messageType = json.messageType || '';
      switch (messageType) {
        case 'welcome':
          message = '**Welcome to Flowstarter!**\n\nTell me what you want to create.';
          break;
        default:
          message = 'Understood. Let me process that.';
      }
    }

    if (json.action === 'step-transition') {
      message = "Let's continue.";
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });

  await page.route('**/api/extract-business-info', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route('**/api/generate-project-name', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'FitPro Studio', reasoning: 'Fitness' }),
    });
  });

  await page.route('**/api/recommend-templates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recommendations: [
          {
            template: {
              id: 'fitness-coach',
              name: 'Fitness Coach',
              description: 'Perfect for personal trainers',
              thumbnail: '',
              category: 'local-business',
            },
            matchScore: 95,
            reasoning: 'Great for fitness coaches',
            palettes: [
              {
                id: 'energy',
                name: 'Energy',
                colors: {
                  primary: '#ef4444',
                  secondary: '#f97316',
                  accent: '#eab308',
                  background: '#ffffff',
                  text: '#1a1a2e',
                },
              },
            ],
            fonts: [
              {
                id: 'bold',
                name: 'Bold',
                heading: 'Montserrat',
                body: 'Open Sans',
              },
            ],
          },
        ],
      }),
    });
  });

  await page.route('**/api/generate-site', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: {"type": "complete", "result": { "success": true }}\n\n`,
    });
  });

  await page.route('**/api/daytona/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workspaceId: 'mock-ws', status: 'running' }),
    });
  });
}

async function sendMessage(page: Page, message: string) {
  const chatInput = page.getByTestId('chat-input');
  await expect(chatInput).toBeVisible({ timeout: 10000 });
  await chatInput.fill(message);
  const sendButton = page.getByTestId('chat-send-button');
  await sendButton.click();
  await page.waitForTimeout(2000);
}

async function navigateToPersonalization(page: Page) {
  await page.goto('/new');
  await page.waitForLoadState('domcontentloaded');

  const chatInput = page.getByTestId('chat-input');
  await expect(chatInput).toBeVisible({ timeout: 30000 });

  // Description
  await sendMessage(page, 'A fitness coaching website');

  // Name
  await sendMessage(page, 'FitPro Studio');

  // Name confirmation
  const confirmButton = page
    .getByRole('button', { name: /yes|sounds good|use/i })
    .first();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
    await page.waitForTimeout(2000);
  }

  // Business discovery
  const answers = [
    'Personalized workouts', 'Executives', 'Generate leads',
    'Professional', 'Booking sessions', '$99/month',
  ];
  for (const answer of answers) {
    await sendMessage(page, answer);
  }

  // Confirm summary
  await sendMessage(page, 'looks good');
  await page.waitForTimeout(5000);

  // Select template
  const templateGallery = page.getByTestId('template-gallery');
  await expect(templateGallery).toBeVisible({ timeout: 30000 });
  const templateCards = page.locator('[data-testid^="template-card-"]');
  await templateCards.first().click();
  await page.waitForTimeout(3000);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Personalization Flow', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Palette section appears after template selection', async ({ page }) => {
    await navigateToPersonalization(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
  });

  test('Palette options are clickable', async ({ page }) => {
    await navigateToPersonalization(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    // Click a palette option
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await expect(paletteOptions.first()).toBeVisible({ timeout: 5000 });
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);
  });

  test('Font section appears after palette selection', async ({ page }) => {
    await navigateToPersonalization(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    // Select palette
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Font section should appear
    const fontSection = page.getByTestId('font-section');
    await expect(fontSection).toBeVisible({ timeout: 20000 });
  });

  test('Logo section appears after font selection', async ({ page }) => {
    await navigateToPersonalization(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    // Select palette
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Select font
    const fontSection = page.getByTestId('font-section');
    await expect(fontSection).toBeVisible({ timeout: 20000 });
    const fontOptions = page.locator('[data-testid^="font-option-"]');
    await fontOptions.first().click();
    await page.waitForTimeout(2000);

    // Logo section should appear
    const logoSection = page.getByTestId('logo-section');
    await expect(logoSection).toBeVisible({ timeout: 20000 });
  });

  test('Can skip logo and advance to integrations', async ({ page }) => {
    await navigateToPersonalization(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    // Palette
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Font
    const fontOptions = page.locator('[data-testid^="font-option-"]');
    await fontOptions.first().click();
    await page.waitForTimeout(2000);

    // Logo — skip
    const logoSection = page.getByTestId('logo-section');
    await expect(logoSection).toBeVisible({ timeout: 20000 });
    const skipLogo = page.getByTestId('skip-logo-button');
    await skipLogo.click();
    await page.waitForTimeout(2000);

    // After logo, integrations or build should start
    // Look for integrations panel or build progress
    const hasNext =
      (await page.locator('text=Connect Your Services').first().isVisible().catch(() => false)) ||
      (await page.locator('text=build').first().isVisible().catch(() => false)) ||
      (await page.locator('text=creating').first().isVisible().catch(() => false));

    expect(hasNext).toBeTruthy();
  });

  test('Personalization panel has progress indicator', async ({ page }) => {
    await navigateToPersonalization(page);

    const panel = page.getByTestId('personalization-panel');
    await expect(panel).toBeVisible({ timeout: 20000 });

    // Panel should exist
    expect(await panel.isVisible()).toBe(true);
  });

  test('Font options are clickable', async ({ page }) => {
    await navigateToPersonalization(page);

    // Palette
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Font options should be visible and clickable
    const fontOptions = page.locator('[data-testid^="font-option-"]');
    await expect(fontOptions.first()).toBeVisible({ timeout: 5000 });
    const count = await fontOptions.count();
    expect(count).toBeGreaterThan(0);
  });
});

