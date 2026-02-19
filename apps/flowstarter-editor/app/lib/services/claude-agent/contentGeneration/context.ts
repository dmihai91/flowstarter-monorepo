/**
 * Domain Context Builder
 * 
 * Builds content context from business description using domain detection.
 */

import {
  detectDomain,
  getContentSuggestions,
  getRecommendedSections,
  getConversionSettings,
  getDesignRecommendations,
} from '../../siteContentAgent';
import type { ContentContext, IntegrationConfig, GeneratedAsset } from './types';

/**
 * Build domain context from business description
 */
export function buildDomainContext(description: string): ContentContext {
  const domain = detectDomain(description);
  return {
    domain,
    suggestions: getContentSuggestions(description),
    sections: getRecommendedSections(description),
    conversion: getConversionSettings(description),
    design: getDesignRecommendations(description),
  };
}

/**
 * Pick a random item from array
 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Helper to find an integration config by id
 */
export function findIntegration(
  integrations: IntegrationConfig[] | undefined,
  id: string
): IntegrationConfig | undefined {
  return integrations?.find(i => i.id === id);
}

/**
 * Helper to find an asset by type
 */
export function findAsset(
  assets: GeneratedAsset[] | undefined,
  type: string
): GeneratedAsset | undefined {
  return assets?.find(a => a.type === type);
}

/**
 * Get domain info for external use
 */
export function getDomainInfo(description: string) {
  const ctx = buildDomainContext(description);
  return {
    domainId: ctx.domain.id,
    domainName: ctx.domain.name,
    suggestions: ctx.suggestions,
    sections: ctx.sections,
    conversion: ctx.conversion,
    design: ctx.design,
  };
}
