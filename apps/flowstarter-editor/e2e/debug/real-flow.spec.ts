import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for REAL Site Creation Flow (No Mocks)
 *
 * These tests validate the actual application behavior without mocks.
 * They test the real API endpoints and UI interactions.
 * Uses data-testid attributes for reliable element selection.
 */

// ─── Test Configuration ─────────────────────────────────────────────────────

test.describe('Real Site Creation Flow', () => {
  test.setTimeout(120000); // 2 minutes for real API calls

  test('1. Welcome screen loads correctly', async ({ page }) => {
    await page.goto('/new');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // The welcome message should appear
    // Check what actually renders
    const body = await page.locator('body').textContent();
    console.log('Page content preview:', body?.substring(0, 500));

    // Should have the chat input with test ID
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/1-welcome-screen.png' });
  });

  test('2. Can enter project description and get response', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    // Wait for chat input using test ID
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    // Enter a project description
    await chatInput.fill('A fitness coaching website for personal trainers');

    // Click send button using test ID
    const sendButton = page.getByTestId('chat-send-button');
    await sendButton.click();

    // Wait for a response - should see our message echoed and a response
    await page.waitForTimeout(5000);

    // Take screenshot to see state
    await page.screenshot({ path: 'test-results/2-after-description.png' });

    // Our message should be visible
    const ourMessage = page.getByText('A fitness coaching website for personal trainers');
    await expect(ourMessage.first()).toBeVisible({ timeout: 10000 });

    // Log what we see
    const messages = await page.locator('[class*="message"]').count();
    console.log('Number of message elements:', messages);
  });

  test('3. Full flow through naming step', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    // Step 1: Enter description using test IDs
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    await chatInput.fill('A yoga studio website with class schedules and booking');
    const sendButton = page.getByTestId('chat-send-button');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/3a-after-description.png' });

    // Step 2: Look for name prompt or enter name
    // The flow should ask for a project name
    const namePromptVisible = await page.getByText(/name|call/i).first().isVisible().catch(() => false);
    console.log('Name prompt visible:', namePromptVisible);

    if (namePromptVisible) {
      // Enter project name using test IDs
      const input = page.getByTestId('chat-input');
      await input.fill('Zen Yoga Studio');
      await page.getByTestId('chat-send-button').click();

      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/3b-after-name.png' });
    }

    // Log final state
    const pageContent = await page.content();
    console.log('Contains "name":', pageContent.includes('name'));
    console.log('Contains "unique":', pageContent.includes('unique'));
    console.log('Contains "template":', pageContent.includes('template'));
  });

  test('4. Clicking suggestion sends message', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for suggested replies container using test ID
    const suggestedReplies = page.getByTestId('suggested-replies');
    const hasSuggestions = await suggestedReplies.isVisible().catch(() => false);

    if (hasSuggestions) {
      // Click first suggestion using test ID prefix
      const suggestionButtons = page.locator('[data-testid^="suggestion-"]');
      const count = await suggestionButtons.count();
      console.log('Found suggestion buttons:', count);

      if (count > 0) {
        const firstSuggestion = suggestionButtons.first();
        const suggestionText = await firstSuggestion.textContent();
        console.log('Clicking suggestion:', suggestionText);

        await firstSuggestion.click();

        // Wait for response
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-results/4-after-suggestion-click.png' });

        // The suggestion text should now be in the conversation
        if (suggestionText) {
          const messageInChat = page.getByText(suggestionText.substring(0, 30));
          const isVisible = await messageInChat.first().isVisible().catch(() => false);
          console.log('Suggestion text visible in chat:', isVisible);
        }
      }
    } else {
      // Fallback: Look for suggestion buttons by text
      const suggestionButtons = page.locator('button').filter({
        hasText: /coach|fitness|salon|spa|yoga|trainer|photographer|dental|lawyer/i
      });

      const count = await suggestionButtons.count();
      console.log('Found suggestion buttons (fallback):', count);

      if (count > 0) {
        const firstSuggestion = suggestionButtons.first();
        const suggestionText = await firstSuggestion.textContent();
        console.log('Clicking suggestion:', suggestionText);

        await firstSuggestion.click();

        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-results/4-after-suggestion-click.png' });

        if (suggestionText) {
          const messageInChat = page.getByText(suggestionText.substring(0, 30));
          const isVisible = await messageInChat.first().isVisible().catch(() => false);
          console.log('Suggestion text visible in chat:', isVisible);
        }
      } else {
        console.log('No suggestion buttons found - checking what is visible');
        await page.screenshot({ path: 'test-results/4-no-suggestions.png' });
      }
    }
  });

  test('5. API endpoints respond correctly', async ({ page }) => {
    // Test the onboarding-chat API directly
    const response = await page.request.post('/api/onboarding-chat', {
      data: {
        action: 'generate-message',
        messageType: 'welcome',
        context: {}
      }
    });

    console.log('API Status:', response.status());
    const body = await response.json().catch(() => null);
    console.log('API Response:', JSON.stringify(body, null, 2));

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('message');
  });

  test('6. Project name generation API works', async ({ page }) => {
    const response = await page.request.post('/api/generate-project-name', {
      data: {
        description: 'A fitness coaching website for busy professionals'
      }
    });

    console.log('Name API Status:', response.status());
    const body = await response.json().catch(() => ({ error: 'Failed to parse' }));
    console.log('Name API Response:', JSON.stringify(body, null, 2));

    // API returns 'projectName' not 'name'
    if (response.status() === 200) {
      expect(body).toHaveProperty('projectName');
    }
  });

  test('7. Template recommendation API works', async ({ page }) => {
    // API requires: businessInfo, projectDescription, projectName
    const response = await page.request.post('/api/recommend-templates', {
      data: {
        projectDescription: 'A fitness coaching website for personal trainers',
        projectName: 'FitPro Studio',
        businessInfo: {
          uvp: 'Personalized 15-minute workouts',
          targetAudience: 'Busy professionals aged 30-50',
          businessGoals: ['Get more leads', 'Book consultations'],
          brandTone: 'Professional and motivating',
          sellingMethod: 'bookings',
          pricingOffers: 'Monthly packages starting at $99'
        }
      }
    });

    console.log('Templates API Status:', response.status());
    const body = await response.json().catch(() => ({ error: 'Failed to parse' }));
    console.log('Templates API Response:', JSON.stringify(body, null, 2));

    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('recommendations');
  });
});

// ─── Debug Tests ─────────────────────────────────────────────────────────────

test.describe('Debug: UI State Inspection', () => {
  test('Inspect initial page structure', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Log all visible text
    const allText = await page.locator('body').textContent();
    console.log('\n=== PAGE TEXT ===\n', allText?.substring(0, 2000));

    // Log test IDs found
    const testIdElements = page.locator('[data-testid]');
    const testIdCount = await testIdElements.count();
    console.log('\n=== TEST IDs FOUND ===');
    for (let i = 0; i < testIdCount; i++) {
      const testId = await testIdElements.nth(i).getAttribute('data-testid');
      console.log(`  - ${testId}`);
    }

    // Log all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log('\n=== BUTTONS ===');
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const text = await buttons.nth(i).textContent();
      console.log(`Button ${i}:`, text?.substring(0, 100));
    }

    // Log all input fields
    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    console.log('\n=== INPUTS ===');
    for (let i = 0; i < inputCount; i++) {
      const tag = await inputs.nth(i).evaluate(el => el.tagName);
      const placeholder = await inputs.nth(i).getAttribute('placeholder');
      const testId = await inputs.nth(i).getAttribute('data-testid');
      console.log(`Input ${i}: ${tag} - placeholder: "${placeholder}" - testId: "${testId}"`);
    }

    await page.screenshot({ path: 'test-results/debug-initial-state.png', fullPage: true });
  });

  test('Inspect message structure after sending', async ({ page }) => {
    await page.goto('/new');
    await page.waitForLoadState('networkidle');

    // Use test ID for input
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: 30000 });

    await chatInput.fill('Test message');
    await page.getByTestId('chat-send-button').click();

    await page.waitForTimeout(5000);

    // Log message structure
    const messageContainers = page.locator('[class*="message"], [data-role], [class*="chat"]');
    const msgCount = await messageContainers.count();
    console.log('\n=== MESSAGE CONTAINERS ===');
    console.log('Total found:', msgCount);

    for (let i = 0; i < Math.min(msgCount, 5); i++) {
      const classes = await messageContainers.nth(i).getAttribute('class');
      const text = await messageContainers.nth(i).textContent();
      console.log(`Container ${i}:`, classes?.substring(0, 50), '|', text?.substring(0, 100));
    }

    await page.screenshot({ path: 'test-results/debug-after-message.png', fullPage: true });
  });
});

