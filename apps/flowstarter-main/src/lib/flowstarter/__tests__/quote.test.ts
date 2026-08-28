/**
 * One quote field. These cases are the reason it exists: an operator setting a
 * price the payment flow cannot see was a silent failure that only surfaced
 * when a client tried to pay.
 */
import { describe, expect, it } from 'vitest';
import {
  InvalidQuoteError,
  parseQuoteInputToMinor,
  quoteMajorFrom,
  quoteMinorFrom,
} from '../quote';

describe('quoteMinorFrom', () => {
  it('prefers the authoritative column', () => {
    expect(quoteMinorFrom({ final_value_minor: 79_900, setup_fee: 1234 })).toBe(
      79_900
    );
  });

  it('falls back to the legacy euro column so older rows still price', () => {
    expect(quoteMinorFrom({ final_value_minor: null, setup_fee: 799 })).toBe(
      79_900
    );
    // Some rows carry it as a string from the admin form.
    expect(quoteMinorFrom({ setup_fee: '1199' })).toBe(119_900);
  });

  it('rounds fractional legacy euros at the cent instead of drifting', () => {
    expect(quoteMinorFrom({ setup_fee: 159.8 })).toBe(15_980);
    expect(quoteMinorFrom({ setup_fee: 0.1 + 0.2 })).toBe(30);
  });

  it('reports an unpriced project as zero rather than guessing', () => {
    expect(quoteMinorFrom({})).toBe(0);
    expect(quoteMinorFrom({ final_value_minor: 0, setup_fee: 0 })).toBe(0);
    expect(quoteMinorFrom({ final_value_minor: null, setup_fee: null })).toBe(
      0
    );
    // A negative or NaN column is corrupt, not a price.
    expect(quoteMinorFrom({ setup_fee: -50 })).toBe(0);
    expect(quoteMinorFrom({ setup_fee: 'abc' })).toBe(0);
  });

  it('exposes major units for display without a second rounding rule', () => {
    expect(quoteMajorFrom({ final_value_minor: 15_980 })).toBe(159.8);
  });
});

describe('parseQuoteInputToMinor', () => {
  it('accepts what an operator actually types', () => {
    expect(parseQuoteInputToMinor('799')).toBe(79_900);
    expect(parseQuoteInputToMinor(1199)).toBe(119_900);
    expect(parseQuoteInputToMinor(' 159.80 ')).toBe(15_980);
    // European decimal comma.
    expect(parseQuoteInputToMinor('159,80')).toBe(15_980);
  });

  it('refuses input the old Number(x) || 0 would have silently zeroed', () => {
    expect(() => parseQuoteInputToMinor('not a price')).toThrow(
      InvalidQuoteError
    );
    expect(() => parseQuoteInputToMinor(-1)).toThrow(/negative/);
    expect(() => parseQuoteInputToMinor(Infinity)).toThrow(InvalidQuoteError);
    expect(() => parseQuoteInputToMinor(9_999_999)).toThrow(/maximum/);
  });

  it('allows an explicit zero, which clears a quote', () => {
    expect(parseQuoteInputToMinor(0)).toBe(0);
  });
});
