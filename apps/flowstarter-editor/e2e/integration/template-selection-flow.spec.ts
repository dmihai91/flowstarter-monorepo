import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Integration Tests: Template Selection Flow
 *
 * Tests the template recommendation and selection step of the onboarding flow.
 * Validates gallery display, template selection, and progression to personalization.
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

  // Mock template recommendations with multiple templates
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
            reasoning: 'Perfect for personal trainers',
            palettes: [],
            fonts: [],
          },
          {
            template: {
              id: 'personal-trainer',
              name: 'Personal Trainer',
              category: 'local-business',
            },
            matchScore: 0.88,
            reasoning: 'Great for fitness businesses',
            palettes: [],
            fonts: [],
          },
          {
            template: {
              id: 'wellness-studio',
              name: 'Wellness Studio',
              category: 'local-business',
            },
            matchScore: 0.82,
            reasoning: 'Modern wellness aesthetic',
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

async function navigateToTemplateStep(page: Page) {
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
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Template Selection Flow', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Template gallery appears after business summary confirmation', async ({
    page,
  }) => {
    await navigateToTemplateStep(page);

    // Template gallery should be visible
    const templateGallery = page.getByTestId('template-gallery');
    await expect(templateGallery).toBeVisible({ timeout: 30000 });
  });

  test('Gallery shows at least 1 template recommendation', async ({ page }) => {
    await navigateToTemplateStep(page);

    const templateGallery = page.getByTestId('template-gallery');
    await expect(templateGallery).toBeVisible({ timeout: 30000 });

    // Should have template cards
    const templateCards = page.locator('[data-testid^="template-card-"]');
    const count = await templateCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Clicking a template selects it', async ({ page }) => {
    await navigateToTemplateStep(page);

    const templateGallery = page.getByTestId('template-gallery');
    await expect(templateGallery).toBeVisible({ timeout: 30000 });

    // Click the first template
    const templateCards = page.locator('[data-testid^="template-card-"]');
    await templateCards.first().click();
    await page.waitForTimeout(3000);

    // Should proceed to personalization or show selection indicator
    const hasPersonalization =
      (await page
        .getByTestId('palette-section')
        .isVisible({ timeout: 10000 })
        .catch(() => false)) ||
      (await page
        .locator('text=/color|palette|personalize|customize/i')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false));

    expect(hasPersonalization).toBeTruthy();
  });

  test('Personalization step appears after template selection', async ({
    page,
  }) => {
    await navigateToTemplateStep(page);

    const templateGallery = page.getByTestId('template-gallery');
    await expect(templateGallery).toBeVisible({ timeout: 30000 });

    // Select template
    const templateCards = page.locator('[data-testid^="template-card-"]');
    await templateCards.first().click();
    await page.waitForTimeout(3000);

    // Palette section should appear (first personalization step)
    const paletteSection = page.getByTestId('palette-section');
    await expect(paletteSection).toBeVisible({ timeout: 20000 });
  });

  test('Template cards show template names', async ({ page }) => {
    await navigateToTemplateStep(page);

    const templateGallery = page.getByTestId('template-gallery');
    await expect(templateGallery).toBeVisible({ timeout: 30000 });

    // Check that at least one template name is visible
    const hasTemplateName =
      (await page
        .locator('text=Fitness Coach')
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=Personal Trainer')
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=Wellness Studio')
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasTemplateName).toBeTruthy();
  });
});

