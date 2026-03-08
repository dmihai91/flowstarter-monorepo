import { test, expect, type Page } from '@playwright/test';

/**
 * Legacy onboarding flow test - redirects to comprehensive site-creation-flow.spec.ts
 *
 * This file contains basic smoke tests to verify the onboarding flow works.
 * For comprehensive E2E testing, see site-creation-flow.spec.ts
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────

async function setupMocks(page: Page) {
  // Mock the onboarding chat endpoint
  await page.route('**/api/onboarding-chat', async (route) => {
    const json = await route.request().postDataJSON();
    let message = "I understand.";

    if (json.action === 'generate-message') {
      const messageType = json.messageType || '';
      const context = json.context || {};

      switch (messageType) {
        case 'welcome':
          message = '**Welcome to Flowstarter!**\n\nTell me what you want to create - a landing page, portfolio, business site, or something else entirely.';
          break;
        case 'after-description':
          message = `Got it - I'll help you build your website.\n\nWhat would you like to call it?`;
          break;
        case 'after-name':
          message = `**${context.projectName || 'Your Project'}** - great name!\n\nNow let's learn about your business.`;
          break;
        default:
          message = "Let's continue with your website.";
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
      body: JSON.stringify({ name: "FitPro Coach", reasoning: "Based on fitness" }),
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
            template: { id: 'trainer', name: 'Personal Trainer', category: 'local-business' },
            matchScore: 0.95,
            reasoning: 'Great for fitness coaches',
            palettes: [],
            fonts: [],
          },
        ],
      }),
    });
  });

  // Mock the build pipeline
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


  // Mock agent-code streaming (new pipeline)
  await page.route('**/api/agent-code', async (route) => {
    const body = [
      `event: agent-event\ndata: ${JSON.stringify({ type: 'file_write', path: 'src/index.html', lines: 100 })}\n\n`,
      `event: result\ndata: ${JSON.stringify({ success: true, files: [] })}\n\n`,
    ].join('');
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    });
  });

  // Mock push-file (streaming preview)
  await page.route('**/api/daytona/push-file', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock Daytona workspace
  await page.route('**/api/daytona/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workspaceId: 'mock', status: 'running' }),
    });
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Flowstarter Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('Initial page load shows welcome message', async ({ page }) => {
    await page.goto('/new');

    // Wait for welcome message to appear (new text pattern)
    await expect(
      page.getByText(/welcome|what would you like|describe|create/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('Can enter project description', async ({ page }) => {
    await page.goto('/new');

    // Wait for page to load
    await expect(
      page.getByText(/welcome|describe|create/i).first()
    ).toBeVisible({ timeout: 15000 });

    // Find textarea and enter description
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('A fitness coaching website for busy professionals');
    await textarea.press('Enter');

    // Should receive response
    await page.waitForTimeout(1000);

    // Message should appear in chat
    await expect(
      page.getByText(/fitness coaching/i).first()
    ).toBeVisible();
  });

  test('Full onboarding smoke test', async ({ page }) => {
    await page.goto('/new');

    // 1. Welcome
    await expect(
      page.getByText(/welcome|describe|create/i).first()
    ).toBeVisible({ timeout: 15000 });

    // 2. Enter description
    const textarea = page.locator('textarea').first();
    await textarea.fill('A fitness coaching website');
    await textarea.press('Enter');

    // 3. Wait for response
    await page.waitForTimeout(1500);

    // 4. Verify we've progressed (check for our message or next step)
    const hasProgress =
      await page.getByText(/fitness coaching/i).first().isVisible() ||
      await page.getByText(/name|call/i).first().isVisible().catch(() => false);

    expect(hasProgress).toBeTruthy();
  });
});

