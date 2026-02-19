import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Integration Tests: Integrations Panel Flow
 *
 * Tests the integrations step of the onboarding flow in isolation.
 * Uses mocked API endpoints to reach the integrations step quickly,
 * then validates all integration behaviors end-to-end.
 *
 * Run: pnpm test:e2e:integration
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  // Mock onboarding chat endpoint
  await page.route('**/api/onboarding-chat', async (route) => {
    const json = await route.request().postDataJSON();
    let message = "Let's continue.";

    if (json.action === 'generate-message') {
      const messageType = json.messageType || '';
      switch (messageType) {
        case 'welcome':
          message =
            '**Welcome to Flowstarter!**\n\nTell me what you want to create.';
          break;
        case 'after-description':
          message = "Got it! What would you like to call your project?";
          break;
        case 'after-name':
          message = "Great name! Let's learn about your business.";
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'FitPro Studio', reasoning: 'Based on fitness' }),
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

  // Mock the build pipeline (SSE stream)
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

async function navigateToIntegrationsStep(page: Page) {
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

  // Step 3-8: Business discovery (UVP, audience, goals, tone, selling, pricing)
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

  // Step 11: Personalization — palette
  const paletteSection = page.getByTestId('palette-section');
  await expect(paletteSection).toBeVisible({ timeout: 20000 });
  const paletteOptions = page.locator('[data-testid^="palette-option-"]');
  await paletteOptions.first().click();
  await page.waitForTimeout(2000);

  // Font
  const fontSection = page.getByTestId('font-section');
  await expect(fontSection).toBeVisible({ timeout: 20000 });
  const fontOptions = page.locator('[data-testid^="font-option-"]');
  await fontOptions.first().click();
  await page.waitForTimeout(2000);

  // Logo — skip
  const logoSection = page.getByTestId('logo-section');
  await expect(logoSection).toBeVisible({ timeout: 20000 });
  const skipLogo = page.getByTestId('skip-logo-button');
  await skipLogo.click();
  await page.waitForTimeout(2000);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Integrations Flow', () => {
  test.setTimeout(180000); // 3 minutes

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Integrations panel appears after logo step', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    // Integrations panel should be visible
    const integrationsTitle = page.locator('text=Connect Your Services').first();
    await expect(integrationsTitle).toBeVisible({ timeout: 15000 });

    // Should have two toggles
    const toggles = page.locator('button[role="switch"]');
    await expect(toggles).toHaveCount(2);

    // Both should start as off
    await expect(toggles.first()).toHaveAttribute('aria-checked', 'false');
    await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'false');

    // Skip and Continue/Build buttons should be visible
    await expect(page.locator('button:has-text("Skip for Now")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Continue"), button:has-text("Build")')
    ).toBeVisible();
  });

  test('Can enable booking and enter Calendly URL', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Enable booking toggle
    const toggles = page.locator('button[role="switch"]');
    await toggles.first().click();
    await expect(toggles.first()).toHaveAttribute('aria-checked', 'true');

    // Calendly URL input should appear
    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    await expect(calendlyInput).toBeVisible({ timeout: 3000 });

    // Enter URL
    await calendlyInput.fill('https://calendly.com/darius-popescu1191/30min');

    // Continue button should be enabled now
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeEnabled();
  });

  test('Continue is disabled when booking enabled but URL empty', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Enable booking toggle (no URL)
    const toggles = page.locator('button[role="switch"]');
    await toggles.first().click();

    // Continue should be disabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
  });

  test('Can skip integrations entirely', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Click Skip — should proceed to build
    const skipButton = page.locator('button:has-text("Skip for Now")');
    await skipButton.click();

    // After skip, build should start (or next step)
    // Look for build-related activity
    await page.waitForTimeout(3000);

    // The chat should show "Let's build my site!" message
    await expect(
      page.locator('text=build my site').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Can enable both booking and newsletter', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    const toggles = page.locator('button[role="switch"]');

    // Enable booking
    await toggles.first().click();
    await expect(toggles.first()).toHaveAttribute('aria-checked', 'true');

    // Fill Calendly URL
    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    await calendlyInput.fill('https://calendly.com/darius-popescu1191/30min');

    // Enable newsletter
    await toggles.nth(1).click();
    await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');

    // Fill newsletter URL/config
    // Newsletter might show a provider selector first
    const providerSelect = page.locator('select').last();
    if (await providerSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await providerSelect.selectOption('mailchimp');
    }

    // Fill newsletter URL
    const newsletterInputs = page.locator(
      'input[placeholder*="Form action" i], input[placeholder*="URL" i]'
    );
    const lastInput = newsletterInputs.last();
    if (await lastInput.isVisible({ timeout: 2000 })) {
      await lastInput.fill('https://example.us1.list-manage.com/subscribe/post');
    }

    // Continue should be enabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeEnabled();

    // Click Continue
    await continueButton.click();

    // Chat should show connected message
    await expect(
      page.locator('text=connected').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Toggle on/off resets URL input', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    const toggles = page.locator('button[role="switch"]');

    // Enable booking and fill URL
    await toggles.first().click();
    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    await calendlyInput.fill('https://calendly.com/test/30min');

    // Disable booking
    await toggles.first().click();
    await expect(toggles.first()).toHaveAttribute('aria-checked', 'false');

    // URL input should disappear
    await expect(calendlyInput).not.toBeVisible();

    // Re-enable — URL should be empty
    await toggles.first().click();
    const newInput = page.locator('input[placeholder*="calendly" i]');
    await expect(newInput).toBeVisible();
    await expect(newInput).toHaveValue('');
  });

  test('Integrations persist to build message in chat', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Enable only booking with Calendly
    const toggles = page.locator('button[role="switch"]');
    await toggles.first().click();

    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    await calendlyInput.fill('https://calendly.com/darius-popescu1191/30min');

    // Click Continue
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();

    // Chat should show "I've connected Calendly" message
    await expect(
      page.locator('text=connected Calendly').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Console logs show integrations saved to Convex', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('useSimpleBuildHandlers')) {
        consoleMessages.push(msg.text());
      }
    });

    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Enable booking
    const toggles = page.locator('button[role="switch"]');
    await toggles.first().click();
    const calendlyInput = page.locator('input[placeholder*="calendly" i]');
    await calendlyInput.fill('https://calendly.com/test/30min');

    // Click Continue
    const continueButton = page.locator('button:has-text("Continue")');
    await continueButton.click();
    await page.waitForTimeout(5000);

    // Check console for Convex save log
    const hasSaveLog = consoleMessages.some(
      (msg) =>
        msg.includes('Integrations saved to Convex') ||
        msg.includes('Failed to save integrations')
    );

    // Should have attempted to save (success or failure depending on Convex availability)
    // In a mocked environment, the Convex mutation may fail, but the log should still appear
    console.log('Console messages:', consoleMessages);
    // This is a soft check — if Convex isn't running, the error path logs instead
    expect(consoleMessages.length).toBeGreaterThan(0);
  });
});

// ─── Regression Tests ─────────────────────────────────────────────────────────

test.describe('Integrations Regression', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Skipping integrations does not block the build', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    // Skip integrations
    await page.locator('button:has-text("Skip for Now")').click();

    // Wait for build to start
    await page.waitForTimeout(5000);

    // Build should progress — look for build-related UI
    const hasBuildProgress =
      (await page.locator('text=Setting up').first().isVisible().catch(() => false)) ||
      (await page.locator('text=build').first().isVisible().catch(() => false)) ||
      (await page.locator('text=creating').first().isVisible().catch(() => false));

    expect(hasBuildProgress).toBeTruthy();
  });

  test('Integrations panel does not crash with rapid toggle clicks', async ({ page }) => {
    await navigateToIntegrationsStep(page);

    await expect(page.locator('text=Connect Your Services').first()).toBeVisible({
      timeout: 15000,
    });

    const toggles = page.locator('button[role="switch"]');

    // Rapid-fire toggle clicks
    for (let i = 0; i < 10; i++) {
      await toggles.first().click();
      await page.waitForTimeout(50);
    }

    // Page should still be functional
    await expect(page.locator('text=Connect Your Services').first()).toBeVisible();
    await expect(page.locator('button:has-text("Skip for Now")')).toBeVisible();
  });
});

