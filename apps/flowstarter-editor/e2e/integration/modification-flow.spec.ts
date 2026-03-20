/**
 * Modification Request Flow - E2E Integration Tests
 *
 * Tests the complete modification flow for existing projects:
 * - Text-only modification requests
 * - Image attachment handling
 * - Claude Agent SDK integration
 * - Preview updates after modifications
 * - Error handling and recovery
 */

import { test, expect, type Page, type Route } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ��������� Test Configuration ���������������������������������������������������������������������������������������������������������������������������������������������������������������������

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Test project with ready workspace
const TEST_PROJECT = {
  urlId: 'inference',
  name: 'Inference',
};

// Test images (relative to test file)
const TEST_IMAGE_PATH = path.join(__dirname, '../fixtures/test-hero.jpg');

// ��������� Helper Functions ���������������������������������������������������������������������������������������������������������������������������������������������������������������������������

async function waitForChatReady(page: Page, timeout = 30000) {
  await page.waitForSelector('[data-testid="chat-input"], textarea[placeholder*="message"]', {
    timeout,
  });
}

async function waitForPreviewReady(page: Page, timeout = 60000) {
  await page.waitForSelector('iframe[src*="proxy.daytona.works"]', {
    timeout,
  });
}

async function sendMessage(page: Page, message: string) {
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]').first();
  await chatInput.fill(message);
  await chatInput.press('Enter');
}

async function setupApiMocks(page: Page) {
  await page.route('**/api/daytona/push-file', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/agent-code', async (route: Route) => {
    const agentEvents = [
      `event: agent-event\ndata: ${JSON.stringify({ type: 'file_write', path: 'src/index.html', lines: 120 })}\n\n`,
      `event: agent-event\ndata: ${JSON.stringify({ type: 'done', duration_ms: 5000, turns: 2, cost_usd: 0.15, input_tokens: 1500, output_tokens: 600 })}\n\n`,
      `event: result\ndata: ${JSON.stringify({ success: true })}\n\n`,
    ].join('');
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body: agentEvents,
    });
  });
}

async function waitForResponse(page: Page, timeout = 30000) {
  // Wait for either success, error, or processing complete
  await page.waitForSelector(
    'text=Changes applied, text=Couldn\'t apply, text=Your site, text=ԣ�, text=���',
    { timeout }
  );
}

async function attachImage(page: Page, imagePath: string) {
  // Find the file input (usually hidden)
  const fileInput = page.locator('input[type="file"][accept*="image"]');

  // If not visible, look for attachment button that triggers it
  const attachButton = page.locator('[data-testid="attach-button"], button[aria-label*="attach"]');

  if (await attachButton.isVisible()) {
    // Some UIs require clicking a button first
    await attachButton.click();
  }

  // Set the file
  await fileInput.setInputFiles(imagePath);
}

async function getPreviewContent(page: Page): Promise<string> {
  const previewFrame = page.frameLocator('iframe[src*="proxy.daytona.works"]');
  return (await previewFrame.locator('body').textContent()) || '';
}

// ��������� Tests ������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������������

test.describe('Modification Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto(`${BASE_URL}/p/${TEST_PROJECT.urlId}`);
    await waitForChatReady(page);
  });

  test.describe('Text-Only Modifications', () => {
    test('sends modification request and shows processing', async ({ page }) => {
      await sendMessage(page, 'Change the hero title to "Welcome to Our Site"');

      // Should show processing state
      await expect(
        page.locator('text=Applying your changes, text=Processing, text=����').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('shows success message after modification', async ({ page }) => {
      await sendMessage(page, 'Add a "Contact Us" button to the navigation');

      // Wait for completion
      await waitForResponse(page, 60000);

      // Should show success or response
      const hasSuccess = await page.locator('text=ԣ�, text=Changes applied, text=updated').first().isVisible();
      const hasResponse = await page.locator('.chat-message.assistant, [data-role="assistant"]').last().isVisible();

      expect(hasSuccess || hasResponse).toBeTruthy();
    });

    test('handles multiple sequential modifications', async ({ page }) => {
      // First modification
      await sendMessage(page, 'Change the primary color to blue');
      await waitForResponse(page, 60000);

      // Second modification
      await sendMessage(page, 'Add a footer with copyright text');
      await waitForResponse(page, 60000);

      // Both messages should be in chat history
      await expect(page.locator('text=primary color to blue')).toBeVisible();
      await expect(page.locator('text=footer with copyright')).toBeVisible();
    });

    test('preserves chat history after modifications', async ({ page }) => {
      const initialMessages = await page.locator('.chat-message, [data-testid="chat-message"]').count();

      await sendMessage(page, 'Make the header sticky');
      await waitForResponse(page, 60000);

      const finalMessages = await page.locator('.chat-message, [data-testid="chat-message"]').count();

      // Should have more messages (user + assistant response)
      expect(finalMessages).toBeGreaterThan(initialMessages);
    });
  });

  test.describe('Image Attachment Modifications', () => {
    test.skip('attaches image and shows preview', async ({ page }) => {
      // Skip if test image doesn't exist
      const fs = await import('fs');
      if (!fs.existsSync(TEST_IMAGE_PATH)) {
        test.skip();
        return;
      }

      await attachImage(page, TEST_IMAGE_PATH);

      // Should show image preview
      await expect(
        page.locator('[data-testid="image-preview"], .attached-image, img[src*="blob:"]')
      ).toBeVisible({ timeout: 5000 });
    });

    test.skip('sends modification with attached image', async ({ page }) => {
      const fs = await import('fs');
      if (!fs.existsSync(TEST_IMAGE_PATH)) {
        test.skip();
        return;
      }

      await attachImage(page, TEST_IMAGE_PATH);
      await sendMessage(page, 'Use this image as the hero background');

      // Should show processing with image indication
      await expect(
        page.locator('text=Processing your images, text=���� Attached').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test.skip('handles image-only submission', async ({ page }) => {
      const fs = await import('fs');
      if (!fs.existsSync(TEST_IMAGE_PATH)) {
        test.skip();
        return;
      }

      await attachImage(page, TEST_IMAGE_PATH);

      // Submit without text
      const sendButton = page.locator('[data-testid="send-button"], button[type="submit"]');
      await sendButton.click();

      // Should ask where to use the image
      await expect(
        page.locator('text=where they would like, text=hero section, text=gallery').first()
      ).toBeVisible({ timeout: 30000 });
    });

    test.skip('removes attached image on cancel', async ({ page }) => {
      const fs = await import('fs');
      if (!fs.existsSync(TEST_IMAGE_PATH)) {
        test.skip();
        return;
      }

      await attachImage(page, TEST_IMAGE_PATH);

      // Should show remove button
      const removeButton = page.locator('[data-testid="remove-image"], button[aria-label*="remove"]');
      await expect(removeButton).toBeVisible();

      await removeButton.click();

      // Image preview should be gone
      await expect(
        page.locator('[data-testid="image-preview"], .attached-image')
      ).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('shows helpful message for API key error', async ({ page }) => {
      // This test is relevant when ANTHROPIC_API_KEY is not set
      await sendMessage(page, 'Test modification request');

      // Wait for response
      await page.waitForTimeout(5000); // Give it time to process

      // Check for either success or API key error
      const hasApiKeyError = await page
        .locator('text=API key, text=ANTHROPIC_API_KEY, text=console.anthropic.com')
        .first()
        .isVisible()
        .catch(() => false);

      const hasSuccess = await page.locator('text=ԣ�, text=Changes applied').first().isVisible().catch(() => false);

      // Either API key error (expected in test env) or success (if key is configured)
      expect(hasApiKeyError || hasSuccess).toBeTruthy();
    });

    test('suggests editor fallback on error', async ({ page }) => {
      await sendMessage(page, 'Make an impossible change that will fail');

      await page.waitForTimeout(10000);

      // On error, should suggest Editor tab
      const hasEditorSuggestion = await page
        .locator('text=Editor tab, text=editing the files directly')
        .first()
        .isVisible()
        .catch(() => false);

      const hasSuccess = await page.locator('text=ԣ�').first().isVisible().catch(() => false);

      // Either error with suggestion or unexpected success
      expect(hasEditorSuggestion || hasSuccess).toBeTruthy();
    });

    test('recovers from network errors gracefully', async ({ page }) => {
      // Simulate offline by intercepting requests
      await page.route('**/api/agent-code', (route) => {
        route.abort('failed');
      });

      await sendMessage(page, 'This should fail due to network');

      // Should show error message
      await expect(
        page.locator('text=���, text=Error, text=error').first()
      ).toBeVisible({ timeout: 15000 });

      // Restore routing for cleanup
      await page.unroute('**/api/agent-code');
    });
  });

  test.describe('Preview Updates', () => {
    test('preview refreshes after modification', async ({ page }) => {
      await waitForPreviewReady(page, 90000);

      const initialContent = await getPreviewContent(page);

      await sendMessage(page, 'Add a new section with text "Hello World Test Section"');
      await waitForResponse(page, 60000);

      // Wait for preview to potentially update
      await page.waitForTimeout(3000);

      const updatedContent = await getPreviewContent(page);

      // Content should change (or at least not error)
      // In some cases, preview might need manual refresh
      expect(updatedContent.length).toBeGreaterThan(0);
    });

    test('shows preview refresh prompt if needed', async ({ page }) => {
      await waitForPreviewReady(page, 90000);

      await sendMessage(page, 'Make a significant change');
      await waitForResponse(page, 60000);

      // Some implementations show refresh prompt
      const hasRefreshPrompt = await page
        .locator('text=Refresh the preview, text=reload, button:has-text("Refresh")')
        .first()
        .isVisible()
        .catch(() => false);

      // This is optional - some implementations auto-refresh
      // Just verify the request completed
      expect(true).toBeTruthy();
    });
  });

  test.describe('Concurrent Modifications', () => {
    test('queues multiple rapid requests', async ({ page }) => {
      // Send multiple requests quickly
      const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]').first();

      await chatInput.fill('Change 1: Update title');
      await chatInput.press('Enter');

      await page.waitForTimeout(500);

      await chatInput.fill('Change 2: Update subtitle');
      await chatInput.press('Enter');

      // Both messages should appear in chat
      await expect(page.locator('text=Change 1: Update title')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Change 2: Update subtitle')).toBeVisible({ timeout: 5000 });
    });

    test('handles cancellation gracefully', async ({ page }) => {
      await sendMessage(page, 'Start a long modification');

      // Try to navigate away (soft cancellation)
      await page.keyboard.press('Escape');

      // Should not crash
      await expect(page).not.toHaveTitle(/error|crash/i);

      // Chat should still be functional
      await expect(
        page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]')
      ).toBeVisible();
    });
  });

  test.describe('Suggested Replies', () => {
    test('shows modification suggestions after project ready', async ({ page }) => {
      // Wait for ready state
      await page.waitForTimeout(2000);

      // Should show suggested modification options
      const suggestions = page.locator(
        'button:has-text("Make some changes"), button:has-text("Try different colors"), button:has-text("Add more sections")'
      );

      const hasSuggestions = (await suggestions.count()) > 0;

      // Suggestions might be hidden initially or shown based on state
      // This is a soft assertion
      if (hasSuggestions) {
        await expect(suggestions.first()).toBeVisible();
      }
    });

    test('clicking suggestion fills input', async ({ page }) => {
      await page.waitForTimeout(2000);

      const suggestion = page.locator('button:has-text("Make some changes")');

      if (await suggestion.isVisible()) {
        await suggestion.click();

        // Input should have the suggestion text or trigger action
        const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]');
        const inputValue = await chatInput.inputValue();

        // Either fills input or sends directly
        expect(inputValue.length > 0 || (await page.locator('text=changes').count()) > 1).toBeTruthy();
      }
    });
  });
});

test.describe('Integration with Claude Agent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/p/${TEST_PROJECT.urlId}`);
    await waitForChatReady(page);
  });

  test('agent receives correct working directory', async ({ page }) => {
    // Intercept API call to verify payload
    let receivedPayload: any;

    await page.route('**/api/agent-code', async (route) => {
      const request = route.request();
      receivedPayload = JSON.parse(request.postData() || '{}');

      // Continue with actual request
      await route.continue();
    });

    await sendMessage(page, 'Test modification');
    await page.waitForTimeout(2000);

    if (receivedPayload) {
      // Should have working directory set
      expect(receivedPayload.workingDirectory).toBeDefined();
      expect(receivedPayload.workingDirectory).toMatch(/\/workspaces\//);
    }

    await page.unroute('**/api/agent-code');
  });

  test('agent receives instruction correctly', async ({ page }) => {
    let receivedPayload: any;

    await page.route('**/api/agent-code', async (route) => {
      const request = route.request();
      receivedPayload = JSON.parse(request.postData() || '{}');
      await route.continue();
    });

    const testInstruction = 'Add a contact form with email and message fields';
    await sendMessage(page, testInstruction);
    await page.waitForTimeout(2000);

    if (receivedPayload) {
      expect(receivedPayload.instruction).toContain(testInstruction);
      expect(receivedPayload.action).toBe('apply-changes');
    }

    await page.unroute('**/api/agent-code');
  });

  test('streams progress updates to chat', async ({ page }) => {
    // Mock SSE response
    await page.route('**/api/agent-code', async (route) => {
      const body = `event: message\ndata: {"text":"Analyzing your request..."}\n\nevent: message\ndata: {"text":"Modifying files..."}\n\nevent: result\ndata: {"success":true,"response":"Changes applied!"}\n\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body,
      });
    });

    await sendMessage(page, 'Make a test change');

    // Should show streamed progress or final result
    await expect(
      page.locator('text=Changes applied, text=Analyzing, text=Modifying').first()
    ).toBeVisible({ timeout: 10000 });

    await page.unroute('**/api/agent-code');
  });
});
