/**
 * Site Content Agent - Domain Index
 * 
 * Routes business descriptions to domain-specific content agents
 * for optimized site generation.
 */

import { type BusinessContext, type SiteContent } from './base';
import { THERAPIST_DOMAIN } from './therapist';
import { FITNESS_DOMAIN } from './fitness';
import { YOGA_DOMAIN } from './yoga';
import { COACHING_DOMAIN } from './coaching';
import { CREATIVE_DOMAIN } from './creative';
import { BEAUTY_DOMAIN } from './beauty';
import { FOOD_DOMAIN } from './food';
import { PROFESSIONAL_DOMAIN } from './professional';
import { REALESTATE_DOMAIN } from './realestate';
import { TECH_DOMAIN } from './tech';

// Re-export types
export * from './base';

/**
 * Domain configuration structure
 */
export interface DomainConfig {
  id: string;
  name: string;
  keywords: string[];
  sections: {
    required: string[];
    recommended: string[];
    optional: string[];
  };
  contentPatterns: {
    heroHeadlines: string[];
    [key: string]: string[];
  };
  systemPrompt: string;
  buildPrompt: (context: BusinessContext) => string;
  design: {
    colorMoods: string[];
    avoidColors: string[];
    imageStyle: string;
    layoutStyle: string;
  };
  conversion: {
    primaryCta: string;
    secondaryCta: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    trustPriority: 'low' | 'medium' | 'high';
  };
}

/**
 * All registered domains in priority order
 * Order matters - more specific categories before general ones
 */
const DOMAINS: DomainConfig[] = [
  // Mind/body wellness (order: therapist before yoga before fitness)
  THERAPIST_DOMAIN,
  YOGA_DOMAIN,
  FITNESS_DOMAIN,
  
  // Service professionals
  COACHING_DOMAIN,
  BEAUTY_DOMAIN,
  
  // Creative
  CREATIVE_DOMAIN,
  
  // Food & hospitality
  FOOD_DOMAIN,
  
  // Professional services
  PROFESSIONAL_DOMAIN,
  REALESTATE_DOMAIN,
  
  // Tech
  TECH_DOMAIN,
];

/**
 * Generic/fallback domain for unmatched businesses
 */
export const GENERIC_DOMAIN: DomainConfig = {
  id: 'generic',
  name: 'General Business',
  keywords: [],
  sections: {
    required: ['hero', 'about', 'services', 'contact'],
    recommended: ['testimonials', 'faq'],
    optional: ['team', 'blog', 'gallery'],
  },
  contentPatterns: {
    heroHeadlines: [
      'Excellence in Every Detail',
      'Where Quality Meets Service',
      'Your Success Is Our Mission',
      'Professional Solutions, Personal Touch',
    ],
    ctas: [
      'Get Started',
      'Contact Us',
      'Learn More',
      'Request a Quote',
    ],
  },
  systemPrompt: `You are a professional website content writer.
Create clear, compelling content that communicates value and builds trust.
Focus on benefits over features, and make calls to action clear and specific.`,
  buildPrompt: (context: BusinessContext) => {
    return `Create professional website content for: ${context.description}`;
  },
  design: {
    colorMoods: ['professional', 'trustworthy', 'clean'],
    avoidColors: ['overly flashy', 'unprofessional'],
    imageStyle: 'professional, high-quality',
    layoutStyle: 'clean, organized, professional',
  },
  conversion: {
    primaryCta: 'Get Started',
    secondaryCta: 'Learn More',
    urgencyLevel: 'medium',
    trustPriority: 'medium',
  },
};

/**
 * Detect the business domain from a description
 */
export function detectDomain(description: string): DomainConfig {
  if (!description || description.trim().length === 0) {
    return GENERIC_DOMAIN;
  }

  const lowerDesc = description.toLowerCase();
  
  for (const domain of DOMAINS) {
    for (const keyword of domain.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return domain;
      }
    }
  }
  
  return GENERIC_DOMAIN;
}

/**
 * Get content generation prompt for a business
 */
export function getContentPrompt(context: BusinessContext): string {
  const domain = detectDomain(context.description);
  return domain.buildPrompt(context);
}

/**
 * Get recommended sections for a business
 */
export function getRecommendedSections(description: string): {
  required: string[];
  recommended: string[];
  optional: string[];
} {
  const domain = detectDomain(description);
  return domain.sections;
}

/**
 * Get design recommendations for a business
 */
export function getDesignRecommendations(description: string): DomainConfig['design'] {
  const domain = detectDomain(description);
  return domain.design;
}

/**
 * Get conversion optimization settings for a business
 */
export function getConversionSettings(description: string): DomainConfig['conversion'] {
  const domain = detectDomain(description);
  return domain.conversion;
}

/**
 * Get sample headlines for a business domain
 */
export function getSampleHeadlines(description: string): string[] {
  const domain = detectDomain(description);
  return domain.contentPatterns.heroHeadlines;
}

/**
 * Get all domain IDs (for debugging/testing)
 */
export function getAllDomainIds(): string[] {
  return [...DOMAINS.map(d => d.id), 'generic'];
}

/**
 * Get a domain by ID
 */
export function getDomainById(id: string): DomainConfig | undefined {
  if (id === 'generic') return GENERIC_DOMAIN;
  return DOMAINS.find(d => d.id === id);
}
