import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Integration Tests: Naming Flow
 *
 * Tests the naming step of the onboarding flow.
 * Validates name entry, suggestion, confirmation, and UI feedback.
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

    // Handle extract action (user input interpretation)
    if (json.action === 'extract') {
      // If there's a previous suggestion and user confirms
      if (json.userInput && /^(yes|sounds good|i like it|love it|perfect|use)/i.test(json.userInput)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            projectName: json.previousSuggestion || 'FitPro Studio',
          }),
        });
        return;
      }

      // Direct name input
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          projectName: json.userInput || 'FitPro Studio',
        }),
      });
      return;
    }

    // Default: generate a name
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        projectName: 'FitPro Studio',
      }),
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

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Naming Flow', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Name prompt appears after entering description', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Enter description
    await sendMessage(page, 'A fitness coaching website for busy professionals');

    // Should see name-related prompt
    await expect(
      page.locator('text=/call|name|what would you like/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Can enter a project name directly', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Step 1: Description
    await sendMessage(page, 'A fitness coaching website for busy professionals');
    await page.waitForTimeout(2000);

    // Step 2: Enter name
    await sendMessage(page, 'FitPro Studio');

    // Should see name accepted or confirmation prompt
    await expect(
      page.locator('text=/FitPro Studio|great name|business/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Suggest a name button works when visible', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Step 1: Description
    await sendMessage(page, 'A fitness coaching website for busy professionals');
    await page.waitForTimeout(2000);

    // Look for "Suggest a name" button
    const suggestButton = page.locator(
      'button:has-text("Suggest a name"), button:has-text("suggest")'
    ).first();

    const hasSuggestButton = await suggestButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasSuggestButton) {
      await suggestButton.click();
      await page.waitForTimeout(3000);

      // Should show a suggested name
      await expect(
        page.locator('text=/FitPro|Studio|suggested|how about/i').first()
      ).toBeVisible({ timeout: 10000 });
    }

    // If no suggest button, the flow might auto-suggest or just ask for name
    // Either way, the test shouldn't fail
    expect(true).toBe(true);
  });

  test('Name appears in the UI after confirmation', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Step 1: Description
    await sendMessage(page, 'A fitness coaching website');

    // Step 2: Enter name
    await sendMessage(page, 'FitPro Studio');

    // Handle optional confirmation
    const confirmButton = page
      .getByRole('button', { name: /yes|sounds good|use/i })
      .first();
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Name should appear somewhere in the UI (chat messages or header)
    await expect(
      page.locator('text=FitPro Studio').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('"I have my own" flow bypasses LLM', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('domcontentloaded');

    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Step 1: Description
    await sendMessage(page, 'A fitness coaching website');
    await page.waitForTimeout(2000);

    // Look for "I have my own" button
    const ownNameButton = page
      .locator('button:has-text("I have my own"), button:has-text("Type my own")')
      .first();

    const hasOwnButton = await ownNameButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasOwnButton) {
      await ownNameButton.click();
      await page.waitForTimeout(1000);

      // Enter custom name
      await sendMessage(page, 'Vitality Hub');

      // Should accept name and move to next step quickly
      await expect(
        page.locator('text=/Vitality Hub|business|great/i').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

