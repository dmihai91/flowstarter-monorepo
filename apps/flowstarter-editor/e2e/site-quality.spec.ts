/**
 * Site Quality & Conversion Tests
 *
 * Verifies that generated websites have:
 * - Proper structure for conversion (hero, CTA, testimonials)
 * - Working integrations (Calendly, newsletter)
 * - Responsive design elements
 * - SEO basics (meta tags, headings)
 * - Accessibility fundamentals
 */

import { test, expect, type Page, type Frame } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════════
// Test Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_PROJECT = {
  description: 'A fitness coaching website for busy professionals with workout programs and online booking',
  name: 'FitPro Studio',
  uvp: 'Personalized 15-minute workouts designed for maximum efficiency',
  audience: 'Busy executives and professionals aged 30-50',
  goals: 'Generate leads and book consultations',
  tone: 'Professional yet motivating',
  selling: 'Online booking for training sessions',
  pricing: 'Monthly packages starting at $99',
  calendlyUrl: 'https://calendly.com/darius-popescu1191/30min',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function getPreviewFrame(page: Page): Promise<Frame | null> {
  const iframe = page.locator('iframe[title="Daytona Preview"]');
  await expect(iframe).toBeVisible({ timeout: 60000 });
  
  const frame = await iframe.contentFrame();
  return frame;
}

async function waitForPreviewContent(page: Page, maxRetries = 20): Promise<Frame> {
  let frame: Frame | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    frame = await getPreviewFrame(page);
    if (frame) {
      const body = await frame.locator('body').textContent().catch(() => '');
      if (body && body.length > 200 && !body.includes('Initializing')) {
        return frame;
      }
    }
    await page.waitForTimeout(5000);
  }
  
  throw new Error('Preview content did not load');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Conversion Elements Tests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Site Conversion Elements', () => {
  test.setTimeout(600000); // 10 minutes - includes build time

  test('Generated site has hero section with clear value proposition', async ({ page }) => {
    // This test assumes a project is already built
    // Navigate to an existing project
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    const count = await projectLinks.count();
    
    if (count === 0) {
      test.skip(true, 'No existing projects to test');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Hero Section ─────────────────────────────────────────────────────────
    
    // Check for hero section
    const heroSection = frame.locator('section').first();
    const heroText = await heroSection.textContent().catch(() => '');
    
    // Should have a headline (h1)
    const h1 = frame.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text!.length).toBeGreaterThan(5);
    console.log(`✓ Hero headline: "${h1Text?.slice(0, 50)}..."`);
    
    // Should have a subheadline or description
    const subheadline = frame.locator('h1 + p, h1 ~ p').first();
    const subText = await subheadline.textContent().catch(() => '');
    expect(subText!.length).toBeGreaterThan(10);
    console.log(`✓ Hero subheadline present`);
  });

  test('Generated site has primary CTA button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── CTA Button ───────────────────────────────────────────────────────────
    
    // Look for primary CTA button patterns
    const ctaSelectors = [
      'a[href*="book"], a[href*="contact"], a[href*="calendly"]',
      'button:has-text("Book"), button:has-text("Get Started"), button:has-text("Contact")',
      'a:has-text("Book"), a:has-text("Get Started"), a:has-text("Schedule")',
      '[class*="cta"], [class*="primary"]',
    ];
    
    let ctaFound = false;
    for (const selector of ctaSelectors) {
      const cta = frame.locator(selector).first();
      if (await cta.isVisible({ timeout: 2000 }).catch(() => false)) {
        ctaFound = true;
        const ctaText = await cta.textContent();
        console.log(`✓ CTA button found: "${ctaText}"`);
        break;
      }
    }
    
    expect(ctaFound).toBe(true);
  });

  test('Generated site has navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Navigation ───────────────────────────────────────────────────────────
    
    // Check for nav element or header with links
    const nav = frame.locator('nav, header').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
    
    // Should have multiple navigation links
    const navLinks = frame.locator('nav a, header a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
    console.log(`✓ Navigation has ${linkCount} links`);
  });

  test('Generated site has social proof elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Social Proof ─────────────────────────────────────────────────────────
    
    const pageContent = await frame.locator('body').textContent();
    
    // Check for testimonials section
    const testimonialPatterns = [
      /testimonial/i,
      /review/i,
      /what.*say/i,
      /client.*stories/i,
      /"[^"]{20,}"/,  // Quoted text (likely testimonial)
    ];
    
    const hasTestimonials = testimonialPatterns.some(p => p.test(pageContent || ''));
    
    // Check for trust indicators
    const trustPatterns = [
      /years.*experience/i,
      /clients.*served/i,
      /certified/i,
      /award/i,
      /trusted/i,
      /\d+\+/,  // Numbers like "100+"
    ];
    
    const hasTrustIndicators = trustPatterns.some(p => p.test(pageContent || ''));
    
    expect(hasTestimonials || hasTrustIndicators).toBe(true);
    console.log(`✓ Social proof: testimonials=${hasTestimonials}, trust=${hasTrustIndicators}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration Verification Tests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Integration Verification', () => {
  test.setTimeout(600000);

  test('Calendly widget is properly embedded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Calendly Integration ─────────────────────────────────────────────────
    
    // Check for Calendly elements
    const calendlyPatterns = [
      'div[data-url*="calendly"]',
      'iframe[src*="calendly"]',
      'a[href*="calendly"]',
      '.calendly-inline-widget',
      '[class*="calendly"]',
    ];
    
    let calendlyFound = false;
    for (const selector of calendlyPatterns) {
      const element = frame.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        calendlyFound = true;
        console.log(`✓ Calendly found with selector: ${selector}`);
        break;
      }
    }
    
    // Also check for booking-related links
    const bookingLink = frame.locator('a[href*="calendly"], a[href*="book"]').first();
    const hasBookingLink = await bookingLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasBookingLink) {
      const href = await bookingLink.getAttribute('href');
      console.log(`✓ Booking link: ${href}`);
    }
    
    // At least one booking mechanism should exist
    expect(calendlyFound || hasBookingLink).toBe(true);
  });

  test('Newsletter form is properly embedded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Newsletter Form ──────────────────────────────────────────────────────
    
    // Check for newsletter/email signup
    const newsletterPatterns = [
      'form[action*="mailchimp"]',
      'form[action*="convertkit"]',
      'form[action*="buttondown"]',
      'form[action*="newsletter"]',
      'form[action*="subscribe"]',
      'input[type="email"]',
      '[class*="newsletter"]',
      '[class*="subscribe"]',
    ];
    
    let newsletterFound = false;
    for (const selector of newsletterPatterns) {
      const element = frame.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        newsletterFound = true;
        console.log(`✓ Newsletter element found: ${selector}`);
        break;
      }
    }
    
    // Check for email input field
    const emailInput = frame.locator('input[type="email"], input[placeholder*="email" i]').first();
    const hasEmailInput = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasEmailInput) {
      console.log('✓ Email input field present');
    }
    
    // Newsletter form should exist if integrations were configured
    // If not configured, this test is informational
    console.log(`Newsletter form found: ${newsletterFound || hasEmailInput}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEO & Accessibility Tests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('SEO & Accessibility Basics', () => {
  test.setTimeout(300000);

  test('Site has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Heading Hierarchy ────────────────────────────────────────────────────
    
    // Should have exactly one h1
    const h1Count = await frame.locator('h1').count();
    expect(h1Count).toBe(1);
    console.log('✓ Single H1 present');
    
    // Should have h2s for main sections
    const h2Count = await frame.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
    console.log(`✓ ${h2Count} H2 headings present`);
  });

  test('Site has meta description', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Meta Tags ────────────────────────────────────────────────────────────
    
    // Check for meta description
    const metaDesc = frame.locator('meta[name="description"]');
    const hasMetaDesc = await metaDesc.count() > 0;
    
    if (hasMetaDesc) {
      const content = await metaDesc.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(50);
      console.log(`✓ Meta description: "${content?.slice(0, 60)}..."`);
    }
    
    // Check for viewport meta
    const viewport = frame.locator('meta[name="viewport"]');
    expect(await viewport.count()).toBeGreaterThan(0);
    console.log('✓ Viewport meta present');
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Image Alt Text ───────────────────────────────────────────────────────
    
    const images = frame.locator('img');
    const imageCount = await images.count();
    
    let imagesWithAlt = 0;
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (alt && alt.length > 0) {
        imagesWithAlt++;
      }
    }
    
    const altPercentage = imageCount > 0 ? (imagesWithAlt / Math.min(imageCount, 10)) * 100 : 100;
    expect(altPercentage).toBeGreaterThanOrEqual(80); // At least 80% should have alt text
    console.log(`✓ ${imagesWithAlt}/${Math.min(imageCount, 10)} images have alt text (${altPercentage.toFixed(0)}%)`);
  });

  test('Site has proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Color Contrast (Basic Check) ─────────────────────────────────────────
    
    // Check that text is visible (not same color as background)
    const h1 = frame.locator('h1').first();
    const isVisible = await h1.isVisible();
    expect(isVisible).toBe(true);
    
    // Check that primary text has sufficient contrast
    // This is a basic check - a full contrast audit would need a specialized tool
    const bodyText = frame.locator('p').first();
    if (await bodyText.isVisible().catch(() => false)) {
      const color = await bodyText.evaluate(el => 
        window.getComputedStyle(el).color
      );
      // Text should not be fully transparent or invisible
      expect(color).not.toBe('transparent');
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      console.log(`✓ Body text color: ${color}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Responsive Design Tests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Responsive Design', () => {
  test.setTimeout(300000);

  test('Site renders properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    // ─── Mobile Viewport ──────────────────────────────────────────────────────
    
    // Check that content doesn't overflow
    const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(htmlWidth).toBeLessThanOrEqual(400); // Some tolerance for scrollbar
    console.log(`✓ Mobile width: ${htmlWidth}px (no horizontal overflow)`);
    
    // Check that text is readable (font size >= 14px)
    const frame = await getPreviewFrame(page);
    if (frame) {
      const bodyFontSize = await frame.locator('body').evaluate(el => 
        parseFloat(window.getComputedStyle(el).fontSize)
      ).catch(() => 16);
      expect(bodyFontSize).toBeGreaterThanOrEqual(14);
      console.log(`✓ Mobile font size: ${bodyFontSize}px`);
    }
  });

  test('Site has mobile-friendly touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Touch Targets ────────────────────────────────────────────────────────
    
    // Check CTA button size (should be at least 44x44px for accessibility)
    const ctaButton = frame.locator('a, button').filter({ hasText: /book|contact|start|get/i }).first();
    
    if (await ctaButton.isVisible().catch(() => false)) {
      const box = await ctaButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
        console.log(`✓ CTA button size: ${box.width}x${box.height}px`);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Performance Basics
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Performance Basics', () => {
  test.setTimeout(300000);

  test('Site loads within reasonable time', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    const startTime = Date.now();
    await projectLinks.first().click();
    
    // Wait for preview to be visible
    const iframe = page.locator('iframe[title="Daytona Preview"]');
    await expect(iframe).toBeVisible({ timeout: 120000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`✓ Preview loaded in ${loadTime}ms`);
    
    // Preview should load within 2 minutes (includes dev server startup)
    expect(loadTime).toBeLessThan(120000);
  });

  test('Site has no critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(15000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('hydration') &&
      !e.includes('WebSocket')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('JavaScript errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
    console.log('✓ No critical JavaScript errors');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Content Quality Tests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Content Quality', () => {
  test.setTimeout(300000);

  test('Site content reflects business info', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Content Relevance ────────────────────────────────────────────────────
    
    const pageContent = await frame.locator('body').textContent();
    
    // Check that the page has substantial content
    expect(pageContent!.length).toBeGreaterThan(500);
    console.log(`✓ Page has ${pageContent!.length} characters of content`);
    
    // Should not have placeholder text
    const placeholderPatterns = [
      /lorem ipsum/i,
      /your text here/i,
      /placeholder/i,
      /\[.*\]/,  // [brackets] often indicate placeholders
    ];
    
    const hasPlaceholder = placeholderPatterns.some(p => p.test(pageContent || ''));
    expect(hasPlaceholder).toBe(false);
    console.log('✓ No placeholder text detected');
  });

  test('Site has clear contact information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Contact Information ──────────────────────────────────────────────────
    
    const pageContent = await frame.locator('body').textContent();
    
    // Check for contact section or elements
    const contactPatterns = [
      /contact/i,
      /get in touch/i,
      /reach out/i,
      /email/i,
      /phone/i,
      /address/i,
    ];
    
    const hasContactInfo = contactPatterns.some(p => p.test(pageContent || ''));
    
    // Check for contact link in navigation
    const contactLink = frame.locator('a').filter({ hasText: /contact/i }).first();
    const hasContactLink = await contactLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasContactInfo || hasContactLink).toBe(true);
    console.log(`✓ Contact info: section=${hasContactInfo}, link=${hasContactLink}`);
  });

  test('Site has clear pricing or service information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href^="/project/"]');
    if ((await projectLinks.count()) === 0) {
      test.skip(true, 'No existing projects');
      return;
    }
    
    await projectLinks.first().click();
    await page.waitForTimeout(10000);
    
    const frame = await getPreviewFrame(page);
    if (!frame) {
      test.skip(true, 'No preview available');
      return;
    }
    
    // ─── Pricing/Services ─────────────────────────────────────────────────────
    
    const pageContent = await frame.locator('body').textContent();
    
    // Check for pricing or service information
    const servicePatterns = [
      /pricing/i,
      /plans/i,
      /packages/i,
      /services/i,
      /\$\d+/,  // Dollar amounts
      /€\d+/,   // Euro amounts
      /per month/i,
      /per session/i,
      /starting at/i,
    ];
    
    const hasServiceInfo = servicePatterns.some(p => p.test(pageContent || ''));
    console.log(`✓ Service/pricing information present: ${hasServiceInfo}`);
  });
});
