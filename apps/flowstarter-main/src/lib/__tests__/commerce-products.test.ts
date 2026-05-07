import { describe, expect, it } from 'vitest';
import {
  slugifyProductName,
  validateCommerceProductInput,
} from '../commerce-products';

describe('slugifyProductName', () => {
  it('lowercases and replaces non-alphanumerics with dashes', () => {
    expect(slugifyProductName('My Awesome Course!')).toBe('my-awesome-course');
  });
  it('strips diacritics', () => {
    expect(slugifyProductName('Café au Lait')).toBe('cafe-au-lait');
  });
  it('truncates to 80 chars', () => {
    const long = 'a'.repeat(120);
    expect(slugifyProductName(long).length).toBe(80);
  });
});

describe('validateCommerceProductInput', () => {
  it('requires name on full create', () => {
    const result = validateCommerceProductInput({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    }
  });

  it('auto-generates slug from name when not provided', () => {
    const result = validateCommerceProductInput({ name: 'My Product' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.slug).toBe('my-product');
      expect(result.record.product_type).toBe('digital');
      expect(result.record.status).toBe('draft');
      expect(result.record.currency).toBe('EUR');
      expect(result.record.inventory_policy).toBe('not_tracked');
    }
  });

  it('rejects invalid product_type', () => {
    const result = validateCommerceProductInput({
      name: 'X',
      product_type: 'mystery',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.field === 'product_type')
      ).toBe(true);
    }
  });

  it('coerces price_amount to non-negative int', () => {
    const result = validateCommerceProductInput({
      name: 'X',
      price_amount: '49.7',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.price_amount).toBe(49);
  });

  it('rejects bogus URL but allows missing URL', () => {
    const bad = validateCommerceProductInput({
      name: 'X',
      checkout_url: 'not a url',
    });
    expect(bad.ok).toBe(false);

    const ok = validateCommerceProductInput({ name: 'X' });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.record.checkout_url).toBeUndefined();
  });

  it('clears fulfillment_type when explicitly set to null/empty', () => {
    const result = validateCommerceProductInput(
      { fulfillment_type: '' },
      { partial: true }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.fulfillment_type).toBeNull();
  });

  it('partial mode does not require name', () => {
    const result = validateCommerceProductInput(
      { status: 'archived' },
      { partial: true }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.status).toBe('archived');
      expect(result.record.name).toBeUndefined();
    }
  });

  it('normalizes currency to 3-letter uppercase, falls back to EUR', () => {
    const r1 = validateCommerceProductInput({ name: 'X', currency: 'usd' });
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.record.currency).toBe('USD');

    const r2 = validateCommerceProductInput({ name: 'X', currency: 'EURO' });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.record.currency).toBe('EUR');
  });
});
