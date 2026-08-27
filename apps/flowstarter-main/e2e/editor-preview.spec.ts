import { expect, test, type TestInfo } from '@playwright/test';

test.describe('Flowstarter smart editor preview', () => {
  test('shows a complete customer journey in the site mockup', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The complete mock site is covered on the desktop landing page.'
    );

    await page.goto('/');

    const editor = page.locator('#editor-showcase');
    await editor.scrollIntoViewIfNeeded();

    const productImage = editor.getByRole('img', {
      name: 'Forest-green coffee bag beside a ceramic cup',
    });
    await expect(productImage).toBeVisible();
    await expect
      .poll(() =>
        productImage.evaluate((image: HTMLImageElement) => image.naturalWidth)
      )
      .toBeGreaterThan(0);

    await expect(editor.locator('[data-demo-section="trust"]')).toContainText(
      'Roast to dispatch'
    );
    await expect(
      editor.locator('[data-demo-section="products"]')
    ).toContainText('House Blend');
    await expect(
      editor.locator('[data-demo-section="brand-story"]')
    ).toContainText('Small batches. Serious attention.');
    await expect(
      editor.locator('[data-demo-section="customer-proof"]')
    ).toContainText('subscriber since 2024');
    await expect(
      editor.locator('[data-demo-section="subscription"]')
    ).toContainText('Build a subscription');
    await expect(editor.locator('[data-preview-field="price"]')).toContainText(
      'From €24 every two weeks'
    );
  });

  test('applies a prompt to the live site preview', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The full editor interaction is covered on the desktop landing page.'
    );

    await page.goto('/');

    const editor = page.locator('#editor-showcase');
    await editor.scrollIntoViewIfNeeded();

    const headline = editor.locator('[data-preview-field="headline"]');
    await expect(headline).toBeVisible();

    const input = editor.locator('input');
    await input.fill('Make this friendlier');
    await input.press('Enter');

    await expect(headline).toHaveText(
      'Come in. Your new favourite coffee is waiting.'
    );
  });

  test('keeps the showcased quick edits live after user interaction', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The editor quick prompts are covered on the desktop landing page.'
    );

    await page.goto('/');

    const editor = page.locator('#editor-showcase');
    await editor.scrollIntoViewIfNeeded();

    await editor.getByRole('button', { name: 'Price', exact: true }).click();
    await editor.getByLabel('Amount').selectOption({ label: '€29' });
    await editor.getByLabel('Billing').selectOption({ label: 'Monthly' });
    await editor
      .getByLabel('Delivery')
      .selectOption({ label: 'Calculated separately' });
    await editor.getByRole('button', { name: 'Apply price' }).click();
    await expect(editor.locator('[data-preview-field="price"]')).toHaveText(
      '€29 per month · delivery calculated separately'
    );

    await editor.getByRole('button', { name: 'Rewrite', exact: true }).click();
    await editor
      .getByLabel('What to rewrite')
      .selectOption({ label: 'Main button' });
    await editor
      .getByLabel('How it should feel')
      .selectOption({ label: 'More direct' });
    await editor.getByRole('button', { name: 'Apply rewrite' }).click();
    await expect(editor.locator('[data-preview-field="cta"]')).toHaveText(
      'Find your roast'
    );

    await editor.getByRole('button', { name: 'Tone', exact: true }).click();
    await editor
      .getByLabel('Text to adjust')
      .selectOption({ label: 'Introduction' });
    await editor.getByLabel('Desired voice').selectOption({ label: 'Calm' });
    await editor.getByRole('button', { name: 'Apply tone' }).click();
    await expect(
      editor.locator('[data-preview-field="introduction"]')
    ).toHaveText('Thoughtfully roasted coffee, delivered when you need it.');

    await editor
      .getByRole('button', { name: 'Translate', exact: true })
      .click();
    await editor
      .getByLabel('Text to translate')
      .selectOption({ label: 'Main button' });
    await editor.getByLabel('Language').selectOption({ label: 'French' });
    await editor.getByRole('button', { name: 'Apply translation' }).click();
    await expect(editor.locator('[data-preview-field="cta"]')).toHaveText(
      'Choisir mon café'
    );

    await page.waitForTimeout(5_500);
    await expect(editor.locator('[data-preview-field="price"]')).toHaveText(
      '€29 per month · delivery calculated separately'
    );
    await expect(
      editor.locator('[data-preview-field="introduction"]')
    ).toHaveText('Thoughtfully roasted coffee, delivered when you need it.');
    await expect(editor.locator('[data-preview-field="cta"]')).toHaveText(
      'Choisir mon café'
    );
  });

  test('keeps structural requests out of the inline preview', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The full editor interaction is covered on the desktop landing page.'
    );

    await page.goto('/');

    const editor = page.locator('#editor-showcase');
    await editor.scrollIntoViewIfNeeded();

    const hiddenContactForm = editor
      .locator('div.overflow-hidden.opacity-0.max-h-0')
      .first();
    await expect(hiddenContactForm).toBeAttached();

    const input = editor.locator('input');
    await input.fill('Add a contact form');
    await input.press('Enter');

    await expect(editor).toContainText('sent this to your Care team');
    await expect(hiddenContactForm).toHaveClass(/opacity-0/);
    await expect(hiddenContactForm).toHaveClass(/max-h-0/);
  });
});
