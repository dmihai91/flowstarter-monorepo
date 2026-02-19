/**
 * Content Generation Types
 */

import type { SiteGenerationInput, IntegrationConfig, GeneratedAsset } from '../types';
import type { DomainConfig } from '../../siteContentAgent';
import { getContentSuggestions, getRecommendedSections, getConversionSettings, getDesignRecommendations } from '../../siteContentAgent';

// Re-export from parent types
export type { SiteGenerationInput, IntegrationConfig, GeneratedAsset };

/**
 * Generated content files structure
 */
export interface GeneratedContentFiles {
  'content/site.md': string;
  'content/hero.md': string;
  'content/services.md': string;
  'content/testimonials.md': string;
  'content/pricing.md': string;
  'content/images.md': string;
  'content/integrations/booking.md': string;
  'content/integrations/payments.md': string;
  'content/integrations/contact-form.md': string;
  'content/integrations/newsletter.md': string;
  'content/integrations/social-feed.md': string;
}

/**
 * Domain-aware content context
 */
export interface ContentContext {
  domain: DomainConfig;
  suggestions: ReturnType<typeof getContentSuggestions>;
  sections: ReturnType<typeof getRecommendedSections>;
  conversion: ReturnType<typeof getConversionSettings>;
  design: ReturnType<typeof getDesignRecommendations>;
}

/**
 * Business info from input
 */
export interface BusinessInfo {
  name: string;
  tagline?: string;
  description?: string;
  services?: string[];
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}
