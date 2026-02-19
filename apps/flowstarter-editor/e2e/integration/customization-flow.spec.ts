import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Integration Tests: Customization (Personalization) Flow
 *
 * Tests the personalization step: palette selection, font selection,
 * logo upload/skip, and progression to integrations or build.
 *
 * Run: pnpm test:e2e:integration
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  await page.route('**/api/onboarding-chat', async (route) => {
    const json = await route.request().postDataJSON();
    let message = "Let's continue.";

    if (json.action === 'generate-message') {
      const messageType = json.messageType || '';
      const context = json.context || {};

      switch (messageType) {
        case 'welcome':
          message =
            '**Welcome to Flowstarter!**\n\nTell me what you want to create.';
          break;
        case 'after-description':
          message = "Got it! What would you like to call your project?";
          break;
        case 'after-name':
          message = `**${context.projectName || 'Your Project'}** - great name!\n\nNow let's learn about your business.`;
          break;
        default:
          message = 'Understood. Let me process that.';
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });

  // Mock project name generation
  await page.route('**/api/generate-project-name', async (route) => {
    const json = await route.request().postDataJSON();
    if (json.action === 'extract') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ projectName: json.userInput || 'FitPro Studio' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ projectName: 'FitPro Studio' }),
    });
  });

  // Mock template recommendations
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
              category: 'local-business',
            },
            matchScore: 0.95,
            reasoning: 'Great for fitness coaches',
            palettes: [],
            fonts: [],
          },
        ],
      }),
    });
  });

  // Mock build pipeline (SSE)
  await page.route('**/api/generate-site', async (route) => {
    const streamBody = [
      `data: {"type": "progress", "phase": "cloning", "message": "Setting up..."}\n\n`,
      `data: {"type": "progress", "phase": "syncing", "message": "Syncing content..."}\n\n`,
      `data: {"type": "complete", "result": { "success": true }}\n\n`,
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: streamBody,
    });
  });

  // Mock Daytona workspace
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

async function navigateToPersonalizationStep(page: Page) {
  await page.goto('/new');
  await page.waitForLoadState('domcontentloaded');

  const chatInput = page.getByTestId('chat-input');
  await expect(chatInput).toBeVisible({ timeout: 30000 });

  // Step 1: Enter project description
  await sendMessage(page, 'A fitness coaching website with workout programs and online booking');

  // Step 2: Enter project name
  await sendMessage(page, 'FitPro Studio');

  // Handle optional name confirmation
  const confirmButton = page
    .getByRole('button', { name: /yes|sounds good|use/i })
    .first();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
    await page.waitForTimeout(2000);
  }

  // Step 3-8: Business discovery
  const businessAnswers = [
    'Personalized 15-minute workouts for busy professionals',
    'Executives aged 30-50',
    'Generate leads and book consultations',
    'Professional yet motivating',
    'Online booking for sessions',
    'Monthly packages from $99',
  ];

  for (const answer of businessAnswers) {
    await sendMessage(page, answer);
  }

  // Step 9: Confirm business summary
  await sendMessage(page, 'looks good');
  await page.waitForTimeout(5000);

  // Step 10: Select template
  const templateGallery = page.getByTestId('template-gallery');
  await expect(templateGallery).toBeVisible({ timeout: 30000 });
  const templateCards = page.locator('[data-testid^="template-card-"]');
  await templateCards.first().click();
  await page.waitForTimeout(3000);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Customization (Personalization) Flow', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Palette section appears after template selection', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    // Should have palette options
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    const count = await paletteOptions.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Selecting palette reveals font section', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    // Select palette
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Font section should appear
    const fontSection = page.getByTestId('font-section');
    await expect(fontSection).toBeVisible({ timeout: 20000 });
  });

  test('Selecting font reveals logo section', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    // Select palette
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
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

  test('Skipping logo progresses to integrations or build', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    // Select palette
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Select font
    const fontSection = page.getByTestId('font-section');
    await expect(fontSection).toBeVisible({ timeout: 20000 });
    const fontOptions = page.locator('[data-testid^="font-option-"]');
    await fontOptions.first().click();
    await page.waitForTimeout(2000);

    // Skip logo
    const logoSection = page.getByTestId('logo-section');
    await expect(logoSection).toBeVisible({ timeout: 20000 });
    const skipLogoButton = page.getByTestId('skip-logo-button');
    await skipLogoButton.click();
    await page.waitForTimeout(3000);

    // Should progress to integrations panel or build
    const hasIntegrations = await page
      .locator('text=Connect Your Services')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    const hasBuildActivity = await page
      .locator('text=/build|creating|setting up/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasIntegrations || hasBuildActivity).toBeTruthy();
  });

  test('Multiple palette options are selectable', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });

    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    const count = await paletteOptions.count();

    if (count >= 2) {
      // Click second option
      await paletteOptions.nth(1).click();
      await page.waitForTimeout(1000);

      // Click first option (change selection)
      await paletteOptions.first().click();
      await page.waitForTimeout(1000);

      // Font section should still be reachable
      const fontSection = page.getByTestId('font-section');
      await expect(fontSection).toBeVisible({ timeout: 20000 });
    }
  });

  test('Font options are available and selectable', async ({ page }) => {
    await navigateToPersonalizationStep(page);

    // Select palette
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
    const paletteOptions = page.locator('[data-testid^="palette-option-"]');
    await paletteOptions.first().click();
    await page.waitForTimeout(2000);

    // Check font options
    const fontSection = page.getByTestId('font-section');
    await expect(fontSection).toBeVisible({ timeout: 20000 });

    const fontOptions = page.locator('[data-testid^="font-option-"]');
    const fontCount = await fontOptions.count();
    expect(fontCount).toBeGreaterThanOrEqual(1);
  });
});

