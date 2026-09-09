import { expect, test, type TestInfo } from '@playwright/test';

test.describe('Flowstarter landing page motion', () => {
  test('turns the hero brief into visible agent progress', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The animated hero is covered once in desktop Chromium.'
    );

    await page.goto('/');

    const brief = page.locator('[data-hero-stage]');
    await expect(brief).toHaveAttribute('data-hero-stage', '1');
    await expect(brief).toHaveAttribute('data-hero-stage', '2', {
      timeout: 3_500,
    });
    await expect(brief.getByText('Shaping your voice')).toBeVisible();
  });

  test('shows the finished hero immediately when motion is reduced', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'Reduced motion is covered once in desktop Chromium.'
    );

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const brief = page.locator('[data-hero-stage]');
    await expect(brief).toHaveAttribute('data-hero-stage', '4');
    await page.waitForTimeout(2_100);
    await expect(brief).toHaveAttribute('data-hero-stage', '4');
    await expect(brief.getByText('Preview ready')).toBeVisible();
  });

  test('keeps the benefits story sticky and follows the active benefit', async ({
    page,
  }, testInfo: TestInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The desktop sticky story is covered once in desktop Chromium.'
    );

    await page.goto('/');

    const lead = page.locator('.ls-human-lead');
    await lead.scrollIntoViewIfNeeded();
    await expect
      .poll(() => lead.evaluate((node) => getComputedStyle(node).position))
      .toBe('sticky');

    const secondBenefit = page.locator('[data-benefit-index="1"]');
    await secondBenefit.evaluate((node) =>
      node.scrollIntoView({ block: 'center', behavior: 'instant' })
    );
    await expect(secondBenefit).toHaveAttribute('data-active', 'true');
    await expect(lead).toContainText('Easy to find and easy to use');
  });
});
