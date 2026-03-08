/**
 * Business Discovery Helpers
 *
 * Pure functions extracted from useBusinessDiscoveryHandlers
 * for testability. These handle:
 * - Goal parsing from free-text input
 * - Selling method extraction from keywords
 * - BusinessInfo validation and completeness checks
 * - First missing field detection
 */

import type { BusinessInfo, OnboardingStep } from '../types';

/**
 * Parse business goals from free-text answer.
 * Splits by comma, newline, bullets, or numbered lists.
 * Returns max 5 goals.
 */
export function parseBusinessGoals(answer: string): string[] {
  return answer
    .split(/(?:\s*,\s*|\n|\s*•\s*|\s*-\s+|\d+\.\s+|\d+\)\s+)/)
    .map((g) => g.trim())
    .filter((g) => g.length > 0)
    .slice(0, 5);
}

/**
 * Extract selling method category from a free-text answer.
 * Maps keywords to one of the selling method categories.
 */
export function extractSellingMethod(
  answer: string,
): 'ecommerce' | 'bookings' | 'leads' | 'subscriptions' | 'content' | 'other' {
  const lowerAnswer = answer.toLowerCase();

  if (
    lowerAnswer.includes('ecommerce') ||
    lowerAnswer.includes('product') ||
    lowerAnswer.includes('shop') ||
    lowerAnswer.includes('store')
  ) {
    return 'ecommerce';
  }

  if (
    lowerAnswer.includes('booking') ||
    lowerAnswer.includes('appointment') ||
    lowerAnswer.includes('session') ||
    lowerAnswer.includes('consultation')
  ) {
    return 'bookings';
  }

  if (
    lowerAnswer.includes('lead') ||
    lowerAnswer.includes('contact') ||
    lowerAnswer.includes('inquiry') ||
    lowerAnswer.includes('form')
  ) {
    return 'leads';
  }

  if (
    lowerAnswer.includes('subscription') ||
    lowerAnswer.includes('membership') ||
    lowerAnswer.includes('course')
  ) {
    return 'subscriptions';
  }

  if (
    lowerAnswer.includes('content') ||
    lowerAnswer.includes('blog') ||
    lowerAnswer.includes('article') ||
    lowerAnswer.includes('news')
  ) {
    return 'content';
  }

  return 'other';
}

/**
 * Determine if pricing was skipped based on user answer.
 */
export function isPricingSkipped(answer: string): boolean {
  const lower = answer.toLowerCase();
  return lower.includes('skip') || lower.includes('no') || lower.includes('none');
}

/**
 * Determine the first missing business info field.
 * Returns null if all required fields are filled.
 */
export function getFirstMissingField(info: Partial<BusinessInfo>): OnboardingStep | null {
  if (!info.uvp || info.uvp.trim() === '') {
    return 'business-uvp';
  }

  if (!info.targetAudience || info.targetAudience.trim() === '') {
    return 'business-audience';
  }

  if (!info.businessGoals || info.businessGoals.length === 0) {
    return 'business-goals';
  }

  if (!info.brandTone || info.brandTone.trim() === '') {
    return 'business-tone';
  }

  if (!info.sellingMethod) {
    return 'business-selling';
  }

  // Pricing is optional — no missing field
  return null;
}

/**
 * Assemble a complete BusinessInfo from partial data with defaults.
 */
export function assembleBusinessInfo(partial: Partial<BusinessInfo>): BusinessInfo {
  return {
    description: partial.description || '',
    quickProfile: partial.quickProfile || { goal: 'leads', offerType: 'free', tone: 'professional' },
    uvp: partial.uvp || '',
    targetAudience: partial.targetAudience || '',
    businessGoals: partial.businessGoals || [],
    brandTone: partial.brandTone || '',
    sellingMethod: partial.sellingMethod,
    pricingOffers: partial.pricingOffers,
  };
}

/**
 * Validate that a BusinessInfo object has all required fields.
 */
export function isBusinessInfoComplete(info: Partial<BusinessInfo>): boolean {
  return getFirstMissingField(info) === null;
}

/**
 * Get a display string for the selling method.
 * Prefers the detailed text over the category.
 */
export function getSellingMethodDisplay(
  sellingMethod?: string,
  sellingMethodDetails?: string,
): string {
  if (sellingMethodDetails) {
    return sellingMethodDetails;
  }
  if (sellingMethod) {
    return sellingMethod.charAt(0).toUpperCase() + sellingMethod.slice(1);
  }
  return 'Not specified';
}

