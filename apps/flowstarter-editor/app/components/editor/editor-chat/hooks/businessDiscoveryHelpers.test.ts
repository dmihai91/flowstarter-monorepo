/**
 * Business Discovery Helpers - Unit Tests
 *
 * Tests the pure functions extracted from useBusinessDiscoveryHandlers:
 * - Goal parsing
 * - Selling method extraction
 * - BusinessInfo validation
 * - Missing field detection
 * - BusinessInfo assembly
 */

import { describe, it, expect } from 'vitest';
import {
  parseBusinessGoals,
  extractSellingMethod,
  isPricingSkipped,
  getFirstMissingField,
  assembleBusinessInfo,
  isBusinessInfoComplete,
  getSellingMethodDisplay,
} from './businessDiscoveryHelpers';
import type { BusinessInfo } from '../types';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const COMPLETE_BUSINESS_INFO: BusinessInfo = {
  uvp: 'Personalized 15-minute workouts for busy professionals',
  targetAudience: 'Executives aged 30-50',
  businessGoals: ['Generate leads', 'Book consultations', 'Build brand awareness'],
  brandTone: 'Professional yet motivating',
  sellingMethod: 'bookings',
  pricingOffers: 'Monthly packages from $99',
};

const MINIMAL_BUSINESS_INFO: BusinessInfo = {
  uvp: 'Fast pizza delivery',
  targetAudience: 'College students',
  businessGoals: ['Get orders'],
  brandTone: 'Fun and casual',
  sellingMethod: 'ecommerce',
};

const EMPTY_BUSINESS_INFO: Partial<BusinessInfo> = {
  uvp: '',
  targetAudience: '',
  businessGoals: [],
  brandTone: '',
  sellingMethod: undefined,
  pricingOffers: undefined,
};

// ─── parseBusinessGoals ───────────────────────────────────────────────────────

describe('parseBusinessGoals', () => {
  it('splits goals by commas', () => {
    const goals = parseBusinessGoals('Generate leads, Book consultations, Build awareness');
    expect(goals).toEqual(['Generate leads', 'Book consultations', 'Build awareness']);
  });

  it('splits goals by newlines', () => {
    const goals = parseBusinessGoals('Generate leads\nBook consultations\nBuild awareness');
    expect(goals).toEqual(['Generate leads', 'Book consultations', 'Build awareness']);
  });

  it('splits goals by bullet points', () => {
    const goals = parseBusinessGoals('• Generate leads\n• Book consultations\n• Build awareness');
    expect(goals).toEqual(['Generate leads', 'Book consultations', 'Build awareness']);
  });

  it('splits goals by dashes', () => {
    const goals = parseBusinessGoals('- Generate leads\n- Book consultations\n- Build awareness');
    expect(goals).toEqual(['Generate leads', 'Book consultations', 'Build awareness']);
  });

  it('splits goals by numbered list', () => {
    const goals = parseBusinessGoals('1. Generate leads\n2. Book consultations\n3. Build awareness');
    expect(goals).toEqual(['Generate leads', 'Book consultations', 'Build awareness']);
  });

  it('handles single goal', () => {
    const goals = parseBusinessGoals('Generate more leads');
    expect(goals).toEqual(['Generate more leads']);
  });

  it('limits to 5 goals maximum', () => {
    const goals = parseBusinessGoals('A, B, C, D, E, F, G');
    expect(goals).toHaveLength(5);
    expect(goals).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('filters empty strings', () => {
    // The regex splits on digits too, so "Goal 1" becomes ["Goal ", ""]
    // The actual behavior is: splits on commas, then on digits
    const goals = parseBusinessGoals('Lead generation,, Brand building,  ');
    expect(goals).toEqual(['Lead generation', 'Brand building']);
  });

  it('trims whitespace from each goal', () => {
    const goals = parseBusinessGoals('  Lead generation  ,  Brand building  ');
    expect(goals).toEqual(['Lead generation', 'Brand building']);
  });

  it('handles empty string', () => {
    const goals = parseBusinessGoals('');
    expect(goals).toEqual([]);
  });
});

// ─── extractSellingMethod ─────────────────────────────────────────────────────

describe('extractSellingMethod', () => {
  it('detects ecommerce from "product"', () => {
    expect(extractSellingMethod('I sell products online')).toBe('ecommerce');
  });

  it('detects ecommerce from "shop"', () => {
    expect(extractSellingMethod('We have an online shop')).toBe('ecommerce');
  });

  it('detects ecommerce from "store"', () => {
    expect(extractSellingMethod('I run an e-commerce store')).toBe('ecommerce');
  });

  it('detects bookings from "booking"', () => {
    expect(extractSellingMethod('I take online bookings for sessions')).toBe('bookings');
  });

  it('detects bookings from "appointment"', () => {
    expect(extractSellingMethod('Clients book appointments with me')).toBe('bookings');
  });

  it('detects bookings from "session"', () => {
    expect(extractSellingMethod('Clients can book a session with me')).toBe('bookings');
  });

  it('detects bookings from "consultation"', () => {
    expect(extractSellingMethod('I offer free consultations')).toBe('bookings');
  });

  it('detects leads from "lead"', () => {
    expect(extractSellingMethod('We generate leads through the site')).toBe('leads');
  });

  it('detects leads from "contact"', () => {
    expect(extractSellingMethod('People contact us for quotes')).toBe('leads');
  });

  it('detects leads from "inquiry"', () => {
    // Note: "inquiries" doesn't contain "inquiry" (different suffix)
    // The source checks for exact substring "inquiry"
    expect(extractSellingMethod('We handle each inquiry personally')).toBe('leads');
  });

  it('detects leads from "form"', () => {
    expect(extractSellingMethod('They fill out a form to get started')).toBe('leads');
  });

  it('detects subscriptions from "subscription"', () => {
    expect(extractSellingMethod('We offer monthly subscriptions')).toBe('subscriptions');
  });

  it('detects subscriptions from "membership"', () => {
    expect(extractSellingMethod('Users buy a membership plan')).toBe('subscriptions');
  });

  it('detects subscriptions from "course"', () => {
    expect(extractSellingMethod('I sell online courses')).toBe('subscriptions');
  });

  it('detects content from "blog"', () => {
    expect(extractSellingMethod('I monetize through my blog')).toBe('content');
  });

  it('detects content from "content"', () => {
    expect(extractSellingMethod('We create content to build audience')).toBe('content');
  });

  it('detects content from "article"', () => {
    expect(extractSellingMethod('I write articles for revenue')).toBe('content');
  });

  it('returns "other" for unrecognized methods', () => {
    expect(extractSellingMethod('We do custom work for clients')).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(extractSellingMethod('I SELL PRODUCTS')).toBe('ecommerce');
  });

  it('prioritizes first match (ecommerce over leads when both present)', () => {
    // "product" triggers ecommerce before "contact" triggers leads
    expect(extractSellingMethod('We sell products and get contact inquiries')).toBe('ecommerce');
  });
});

// ─── isPricingSkipped ─────────────────────────────────────────────────────────

describe('isPricingSkipped', () => {
  it('returns true for "skip"', () => {
    expect(isPricingSkipped('skip')).toBe(true);
    expect(isPricingSkipped('Skip this')).toBe(true);
  });

  it('returns true for "no"', () => {
    expect(isPricingSkipped('no')).toBe(true);
    expect(isPricingSkipped('No pricing info')).toBe(true);
  });

  it('returns true for "none"', () => {
    expect(isPricingSkipped('none')).toBe(true);
    expect(isPricingSkipped('None yet')).toBe(true);
  });

  it('returns false for actual pricing info', () => {
    expect(isPricingSkipped('$99/month')).toBe(false);
    expect(isPricingSkipped('Free plan and $49 pro plan')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isPricingSkipped('SKIP')).toBe(true);
    expect(isPricingSkipped('NO')).toBe(true);
  });
});

// ─── getFirstMissingField ─────────────────────────────────────────────────────

describe('getFirstMissingField', () => {
  it('returns null for complete info', () => {
    expect(getFirstMissingField(COMPLETE_BUSINESS_INFO)).toBeNull();
  });

  it('returns null for minimal complete info (no pricing)', () => {
    expect(getFirstMissingField(MINIMAL_BUSINESS_INFO)).toBeNull();
  });

  it('returns "business-uvp" when uvp is empty', () => {
    expect(getFirstMissingField({ ...COMPLETE_BUSINESS_INFO, uvp: '' })).toBe('business-uvp');
  });

  it('returns "business-uvp" when uvp is whitespace', () => {
    expect(getFirstMissingField({ ...COMPLETE_BUSINESS_INFO, uvp: '   ' })).toBe('business-uvp');
  });

  it('returns "business-audience" when targetAudience is empty', () => {
    expect(getFirstMissingField({ ...COMPLETE_BUSINESS_INFO, targetAudience: '' })).toBe('business-audience');
  });

  it('returns "business-goals" when businessGoals is empty array', () => {
    expect(getFirstMissingField({ ...COMPLETE_BUSINESS_INFO, businessGoals: [] })).toBe('business-goals');
  });

  it('returns "business-goals" when businessGoals is undefined', () => {
    const { businessGoals, ...rest } = COMPLETE_BUSINESS_INFO;
    expect(getFirstMissingField(rest)).toBe('business-goals');
  });

  it('returns "business-tone" when brandTone is empty', () => {
    expect(getFirstMissingField({ ...COMPLETE_BUSINESS_INFO, brandTone: '' })).toBe('business-tone');
  });

  it('returns "business-selling" when sellingMethod is undefined', () => {
    const { sellingMethod, ...rest } = COMPLETE_BUSINESS_INFO;
    expect(getFirstMissingField(rest)).toBe('business-selling');
  });

  it('returns first missing field in order (uvp before audience)', () => {
    expect(getFirstMissingField(EMPTY_BUSINESS_INFO)).toBe('business-uvp');
  });

  it('handles empty object', () => {
    expect(getFirstMissingField({})).toBe('business-uvp');
  });

  it('pricing is optional — does not affect missing field check', () => {
    const noPricing = { ...COMPLETE_BUSINESS_INFO, pricingOffers: undefined };
    expect(getFirstMissingField(noPricing)).toBeNull();
  });
});

// ─── assembleBusinessInfo ─────────────────────────────────────────────────────

describe('assembleBusinessInfo', () => {
  it('assembles complete info from partial', () => {
    const result = assembleBusinessInfo(COMPLETE_BUSINESS_INFO);
    expect(result.uvp).toBe(COMPLETE_BUSINESS_INFO.uvp);
    expect(result.targetAudience).toBe(COMPLETE_BUSINESS_INFO.targetAudience);
    expect(result.businessGoals).toEqual(COMPLETE_BUSINESS_INFO.businessGoals);
    expect(result.brandTone).toBe(COMPLETE_BUSINESS_INFO.brandTone);
    expect(result.sellingMethod).toBe('bookings');
    expect(result.pricingOffers).toBe('Monthly packages from $99');
  });

  it('provides defaults for missing fields', () => {
    const result = assembleBusinessInfo({});
    expect(result.uvp).toBe('');
    expect(result.targetAudience).toBe('');
    expect(result.businessGoals).toEqual([]);
    expect(result.brandTone).toBe('');
    expect(result.sellingMethod).toBeUndefined();
    expect(result.pricingOffers).toBeUndefined();
  });

  it('preserves optional fields when present', () => {
    const result = assembleBusinessInfo({ sellingMethod: 'leads', pricingOffers: '$50/hr' });
    expect(result.sellingMethod).toBe('leads');
    expect(result.pricingOffers).toBe('$50/hr');
  });
});

// ─── isBusinessInfoComplete ───────────────────────────────────────────────────

describe('isBusinessInfoComplete', () => {
  it('returns true for complete info', () => {
    expect(isBusinessInfoComplete(COMPLETE_BUSINESS_INFO)).toBe(true);
  });

  it('returns true for minimal complete info', () => {
    expect(isBusinessInfoComplete(MINIMAL_BUSINESS_INFO)).toBe(true);
  });

  it('returns false when uvp is empty', () => {
    expect(isBusinessInfoComplete({ ...COMPLETE_BUSINESS_INFO, uvp: '' })).toBe(false);
  });

  it('returns false when all fields are empty', () => {
    expect(isBusinessInfoComplete(EMPTY_BUSINESS_INFO)).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isBusinessInfoComplete({})).toBe(false);
  });
});

// ─── getSellingMethodDisplay ──────────────────────────────────────────────────

describe('getSellingMethodDisplay', () => {
  it('prefers details over category', () => {
    expect(getSellingMethodDisplay('bookings', 'Online booking for sessions')).toBe(
      'Online booking for sessions',
    );
  });

  it('falls back to capitalized category', () => {
    expect(getSellingMethodDisplay('ecommerce')).toBe('Ecommerce');
  });

  it('capitalizes first letter of category', () => {
    expect(getSellingMethodDisplay('leads')).toBe('Leads');
    expect(getSellingMethodDisplay('bookings')).toBe('Bookings');
    expect(getSellingMethodDisplay('subscriptions')).toBe('Subscriptions');
  });

  it('returns "Not specified" when nothing provided', () => {
    expect(getSellingMethodDisplay()).toBe('Not specified');
    expect(getSellingMethodDisplay(undefined, undefined)).toBe('Not specified');
  });

  it('handles empty strings', () => {
    expect(getSellingMethodDisplay('', '')).toBe('Not specified');
  });
});

