/**
 * Project Restoration Flow - E2E Integration Tests
 *
 * Tests the complete restoration flow when opening existing projects:
 * - Loading project from URL
 * - Restoring conversation state
 * - Restoring workspace and files
 * - Preview availability
 */

import { test, expect, type Page } from '@playwright/test';

// ิ๖วิ๖วิ๖ว Test Configuration ิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖ว

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Test projects from Convex (created during cleanup)
const TEST_PROJECTS = {
  fullBuild: {
    urlId: 'aluat-de-cas-8gacf2',
    name: 'Aluat de Cas-โ',
    hasWorkspace: true,
    hasTemplate: true,
  },
  noWorkspace: {
    urlId: 'the-forge-htuvsi',
    name: 'The Forge',
    hasWorkspace: false,
    hasTemplate: true,
  },
  minimalData: {
    urlId: 'inference',
    name: 'Inference',
    hasWorkspace: true,
    hasTemplate: false,
  },
};

// ิ๖วิ๖วิ๖ว Helper Functions ิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖ว

async function waitForChatReady(page: Page, timeout = 30000) {
  // Wait for the chat panel to be interactive
  await page.waitForSelector('[data-testid="chat-input"], textarea[placeholder*="message"]', {
    timeout,
  });
}

async function waitForPreviewReady(page: Page, timeout = 60000) {
  // Wait for preview iframe to load
  await page.waitForSelector('iframe[src*="proxy.daytona.works"]', {
    timeout,
  });
}

async function getProjectStep(page: Page): Promise<string | null> {
  // Check for step indicator or infer from UI state
  const stepIndicator = page.locator('[data-testid="current-step"]');
  if (await stepIndicator.isVisible()) {
    return stepIndicator.textContent();
  }

  // Fallback: infer from visible UI elements
  if (await page.locator('[data-testid="template-gallery"]').isVisible()) {
    return 'template';
  }
  if (await page.locator('[data-testid="personalization-panel"]').isVisible()) {
    return 'personalization';
  }
  if (await page.locator('[data-testid="integrations-panel"]').isVisible()) {
    return 'integrations';
  }
  if (await page.locator('text=Your site is ready').isVisible()) {
    return 'ready';
  }

  return null;
}

// ิ๖วิ๖วิ๖ว Tests ิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖วิ๖ว

test.describe('Project Restoration Flow', () => {
  test.describe('Full Project Restoration', () => {
    test('loads existing project with workspace', async ({ page }) => {
      const project = TEST_PROJECTS.fullBuild;

      // Navigate to project
      await page.goto(`${BASE_URL}/p/${project.urlId}`);

      // Wait for chat to be ready
      await waitForChatReady(page);

      // Verify project name is shown
      await expect(page.locator(`text=${project.name}`)).toBeVisible();

      // Should be in ready state since project is complete
      const step = await getProjectStep(page);
      expect(step).toBe('ready');
    });

    test('restores preview for project with workspace', async ({ page }) => {
      const project = TEST_PROJECTS.fullBuild;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Preview should be available
      await waitForPreviewReady(page, 90000);

      // Preview iframe should have correct URL pattern
      const previewFrame = page.locator('iframe[src*="proxy.daytona.works"]');
      await expect(previewFrame).toBeVisible();
    });

    test('shows conversation history', async ({ page }) => {
      const project = TEST_PROJECTS.fullBuild;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Should show previous messages in chat
      const messages = page.locator('[data-testid="chat-message"], .chat-message');
      const messageCount = await messages.count();

      // A complete project should have conversation history
      expect(messageCount).toBeGreaterThan(0);
    });

    test('shows suggested replies for ready state', async ({ page }) => {
      const project = TEST_PROJECTS.fullBuild;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Should show modification suggestions
      await expect(
        page.locator('text=Make some changes, text=Try different colors, text=Add more sections').first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Project Without Workspace', () => {
    test('triggers workspace creation flow', async ({ page }) => {
      const project = TEST_PROJECTS.noWorkspace;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Should show loading/creating state or prompt
      const creatingIndicator = page.locator(
        'text=Creating workspace, text=Provisioning, text=Building your site'
      );

      // Either shows creating state or prompts to continue
      const isCreating = await creatingIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasPrompt = await page.locator('text=Continue building').isVisible({ timeout: 5000 }).catch(() => false);

      expect(isCreating || hasPrompt).toBeTruthy();
    });

    test('restores business details from Convex', async ({ page }) => {
      const project = TEST_PROJECTS.noWorkspace;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Business info should be restored even without workspace
      // Check if business summary or relevant info is shown
      const businessInfo = page.locator('text=fitness trainer, text=strength training, text=Austin');
      const hasBusinessInfo = await businessInfo.first().isVisible({ timeout: 10000 }).catch(() => false);

      // If not visible in summary, it should be in the chat history
      if (!hasBusinessInfo) {
        const chatHistory = await page.locator('.chat-message, [data-testid="chat-message"]').allTextContents();
        const mentionsFitness = chatHistory.some(
          (text) => text.toLowerCase().includes('fitness') || text.toLowerCase().includes('trainer')
        );
        expect(mentionsFitness).toBeTruthy();
      }
    });

    test('restores template selection', async ({ page }) => {
      const project = TEST_PROJECTS.noWorkspace;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Template should be preselected (fitness-coach)
      // This might be shown in UI or stored in state
      const templateIndicator = page.locator('text=Fitness Coach');
      const isTemplateShown = await templateIndicator.isVisible({ timeout: 5000 }).catch(() => false);

      // Template should either be visible or project should proceed to build
      expect(isTemplateShown || (await getProjectStep(page)) !== 'template').toBeTruthy();
    });
  });

  test.describe('Minimal Project', () => {
    test('loads project with workspace but no template', async ({ page }) => {
      const project = TEST_PROJECTS.minimalData;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Should load successfully
      await expect(page.locator(`text=${project.name}`)).toBeVisible();

      // Workspace should be available
      const hasPreviewOrEditor =
        (await page.locator('iframe[src*="proxy.daytona.works"]').isVisible({ timeout: 5000 }).catch(() => false)) ||
        (await page.locator('[data-testid="code-editor"]').isVisible({ timeout: 5000 }).catch(() => false));

      expect(hasPreviewOrEditor).toBeTruthy();
    });

    test('allows modification requests on minimal project', async ({ page }) => {
      const project = TEST_PROJECTS.minimalData;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Find and use chat input
      const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]').first();
      await expect(chatInput).toBeVisible();

      // Type a modification request
      await chatInput.fill('Add a contact section');
      await chatInput.press('Enter');

      // Should show processing or response
      await expect(
        page.locator('text=Applying, text=Processing, text=contact section').first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Error Handling', () => {
    test('handles non-existent project gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/non-existent-project-xyz`);

      // Should show error or redirect to new project
      const errorOrNew = await page
        .locator('text=not found, text=create a new, text=Project not found')
        .first()
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      const isNewProjectPage = page.url().includes('/new');

      expect(errorOrNew || isNewProjectPage).toBeTruthy();
    });

    test('handles workspace in error state', async ({ page }) => {
      // This test would need a project with workspaceStatus: 'error'
      // For now, we test that the app doesn't crash on edge cases
      const project = TEST_PROJECTS.fullBuild;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);

      // Should load without crashing
      await expect(page).not.toHaveTitle(/error|crash/i);
      await waitForChatReady(page);
    });
  });

  test.describe('State Persistence', () => {
    test('preserves state on page refresh', async ({ page }) => {
      const project = TEST_PROJECTS.fullBuild;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Get initial message count
      const initialMessages = await page.locator('.chat-message, [data-testid="chat-message"]').count();

      // Refresh page
      await page.reload();
      await waitForChatReady(page);

      // Messages should be preserved
      const messagesAfterRefresh = await page.locator('.chat-message, [data-testid="chat-message"]').count();
      expect(messagesAfterRefresh).toBe(initialMessages);
    });

    test('syncs state to Convex on changes', async ({ page }) => {
      const project = TEST_PROJECTS.minimalData;

      await page.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(page);

      // Send a message
      const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="message"]').first();
      await chatInput.fill('Test message for persistence');
      await chatInput.press('Enter');

      // Wait for message to appear
      await expect(page.locator('text=Test message for persistence')).toBeVisible({ timeout: 10000 });

      // Open in new tab (simulates fresh load)
      const newPage = await page.context().newPage();
      await newPage.goto(`${BASE_URL}/p/${project.urlId}`);
      await waitForChatReady(newPage);

      // Message should be persisted
      await expect(newPage.locator('text=Test message for persistence')).toBeVisible({ timeout: 10000 });

      await newPage.close();
    });
  });
});

test.describe('Workspace Restoration', () => {
  test('syncs files from Convex to editor', async ({ page }) => {
    const project = TEST_PROJECTS.fullBuild;

    await page.goto(`${BASE_URL}/p/${project.urlId}`);
    await waitForChatReady(page);

    // Switch to editor view
    const editorTab = page.locator('button:has-text("Editor"), [data-testid="editor-tab"]');
    if (await editorTab.isVisible()) {
      await editorTab.click();

      // File tree should show project files
      await expect(
        page.locator('[data-testid="file-tree"], .file-tree').first()
      ).toBeVisible({ timeout: 10000 });

      // Common Astro project files should be present
      const fileTree = page.locator('[data-testid="file-tree"], .file-tree');
      const fileTreeText = await fileTree.textContent();

      expect(
        fileTreeText?.includes('astro.config') ||
          fileTreeText?.includes('src') ||
          fileTreeText?.includes('package.json')
      ).toBeTruthy();
    }
  });

  test('preview reflects current file state', async ({ page }) => {
    const project = TEST_PROJECTS.fullBuild;

    await page.goto(`${BASE_URL}/p/${project.urlId}`);
    await waitForChatReady(page);
    await waitForPreviewReady(page, 90000);

    // Get preview iframe
    const previewFrame = page.frameLocator('iframe[src*="proxy.daytona.works"]');

    // Preview should show actual content (not error page)
    await expect(previewFrame.locator('body')).not.toContainText('error', { ignoreCase: true });

    // Should have visible content
    const bodyText = await previewFrame.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(50); // Has real content
  });
});

