/**
 * Content Generation Module
 * 
 * Domain-specialized content generation for website creation.
 * Generates content/*.md files with domain-appropriate messaging.
 */

import type { SiteGenerationInput, GeneratedContentFiles } from './types';
import { buildDomainContext, findIntegration, getDomainInfo } from './context';
import {
  generateSiteMd,
  generateHeroMd,
  generateServicesMd,
  generateTestimonialsMd,
  generatePricingMd,
  generateImagesMd,
  generateBookingMd,
  generatePaymentsMd,
  generateContactFormMd,
  generateNewsletterMd,
  generateSocialFeedMd,
} from './generators';

// Re-export types
export type { GeneratedContentFiles, SiteGenerationInput } from './types';
export { getDomainInfo } from './context';

/**
 * Generate all content files with domain-specialized content
 */
export function generateContentFiles(input: SiteGenerationInput): GeneratedContentFiles {
  const { siteName, businessInfo, integrations, generatedAssets } = input;
  const year = new Date().getFullYear();

  // Build domain context for specialized content
  const description = businessInfo.description || businessInfo.name || siteName;
  const ctx = buildDomainContext(description);

  // Find specific integrations if provided
  const bookingIntegration = findIntegration(integrations, 'booking');
  const newsletterIntegration = findIntegration(integrations, 'newsletter');

  return {
    'content/site.md': generateSiteMd(siteName, businessInfo, year, ctx),
    'content/hero.md': generateHeroMd(businessInfo, integrations, generatedAssets, ctx),
    'content/services.md': generateServicesMd(businessInfo, generatedAssets, ctx),
    'content/testimonials.md': generateTestimonialsMd(businessInfo, ctx),
    'content/pricing.md': generatePricingMd(businessInfo, ctx),
    'content/images.md': generateImagesMd(generatedAssets),
    'content/integrations/booking.md': generateBookingMd(businessInfo, bookingIntegration, ctx),
    'content/integrations/payments.md': generatePaymentsMd(),
    'content/integrations/contact-form.md': generateContactFormMd(businessInfo, ctx),
    'content/integrations/newsletter.md': generateNewsletterMd(businessInfo, newsletterIntegration, ctx),
    'content/integrations/social-feed.md': generateSocialFeedMd(businessInfo),
  };
}
