import { describe, expect, it } from 'vitest';
import {
  describeCommerceProvider,
  inferCommercePlanFromText,
  normalizeCommercePlan,
} from '../commerce';

describe('commerce helpers', () => {
  it('defaults to no commerce for regular service websites', () => {
    const plan = inferCommercePlanFromText(
      'A coaching website with booking and lead capture.'
    );

    expect(plan).toMatchObject({
      commerce_mode: 'none',
      commerce_product_type: 'none',
      commerce_provider: 'none',
      commerce_status: 'not_needed',
    });
  });

  it('routes digital products to a merchant-of-record provider by default', () => {
    const plan = inferCommercePlanFromText(
      'Sell an ebook and downloadable PDF templates globally.'
    );

    expect(plan).toMatchObject({
      commerce_mode: 'digital_delivery',
      commerce_product_type: 'digital',
      commerce_provider: 'lemon_squeezy',
      commerce_status: 'discovery',
    });
  });

  it('routes physical products to Shopify by default', () => {
    const plan = inferCommercePlanFromText(
      'A shop for merch with sizes, variants, stock, and shipping.'
    );

    expect(plan).toMatchObject({
      commerce_mode: 'external_storefront',
      commerce_product_type: 'physical',
      commerce_provider: 'shopify',
      commerce_status: 'discovery',
    });
  });

  it('normalizes unsafe values without throwing', () => {
    const plan = normalizeCommercePlan({
      mode: 'unknown',
      productType: 'physical',
      provider: 'shopify',
      productCount: -1,
      requirements: [],
      notes: '  Use Shopify Buy Button first.  ',
    });

    expect(plan).toMatchObject({
      commerce_mode: 'none',
      commerce_product_type: 'physical',
      commerce_provider: 'shopify',
      commerce_product_count: 0,
      commerce_requirements: {},
      commerce_notes: 'Use Shopify Buy Button first.',
    });
  });

  it('describes provider tradeoffs', () => {
    expect(describeCommerceProvider('shopify')).toContain('physical goods');
    expect(describeCommerceProvider('stripe')).toContain('simple payments');
  });
});
