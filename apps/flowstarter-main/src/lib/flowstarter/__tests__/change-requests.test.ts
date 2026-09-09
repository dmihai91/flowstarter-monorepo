/**
 * A change request's life is a table of allowed moves, and the price the
 * operator sees first comes from the classifier's own labels. Both are pure.
 */
import { describe, expect, it } from 'vitest';
import {
  CHANGE_REQUEST_TRANSITIONS,
  canTransition,
  suggestQuoteMinor,
  toChangeRequestView,
  type ChangeRequestRow,
} from '../change-requests';

function row(overrides: Partial<ChangeRequestRow> = {}): ChangeRequestRow {
  return {
    id: 'cr-1',
    workspace_id: 'ws-1',
    message_id: null,
    request: 'Add a page for group workshops with its own booking calendar',
    classification: 'structural',
    matched_rules: ['structural:new-thing'],
    status: 'requested',
    quote_minor: null,
    currency: 'eur',
    quote_note: null,
    quoted_by: null,
    quoted_at: null,
    responded_at: null,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    paid_at: null,
    completed_at: null,
    created_by: 'user_client',
    created_at: '2026-09-08T10:00:00.000Z',
    updated_at: '2026-09-08T10:00:00.000Z',
    ...overrides,
  };
}

describe('who may move a request where', () => {
  it('lets the operator quote, re-quote and decline, and finish only what was paid', () => {
    expect(canTransition('requested', 'quoted', 'operator')).toBe(true);
    expect(canTransition('quoted', 'quoted', 'operator')).toBe(true);
    expect(canTransition('quoted', 'declined', 'operator')).toBe(true);
    expect(canTransition('paid', 'done', 'operator')).toBe(true);
    expect(canTransition('quoted', 'done', 'operator')).toBe(false);
    expect(canTransition('requested', 'paid', 'operator')).toBe(false);
  });

  it('lets the client answer a quote and nothing else', () => {
    expect(canTransition('quoted', 'accepted', 'client')).toBe(true);
    expect(canTransition('quoted', 'declined', 'client')).toBe(true);
    expect(canTransition('quoted', 'paid', 'client')).toBe(true); // a zero quote
    expect(canTransition('requested', 'accepted', 'client')).toBe(false);
    expect(canTransition('paid', 'done', 'client')).toBe(false);
    expect(canTransition('accepted', 'declined', 'client')).toBe(false);
  });

  it('lets Stripe settle an accepted request only', () => {
    expect(canTransition('accepted', 'paid', 'stripe')).toBe(true);
    expect(canTransition('quoted', 'paid', 'stripe')).toBe(false);
    expect(canTransition('paid', 'paid', 'stripe')).toBe(false);
  });

  it('never leaves done or declined', () => {
    for (const t of CHANGE_REQUEST_TRANSITIONS) {
      expect(['done', 'declined']).not.toContain(t.from);
    }
  });
});

describe('the suggested quote', () => {
  it('takes the dearest rule that fired', () => {
    expect(suggestQuoteMinor(['structural:new-thing'])).toBe(19_000);
    expect(suggestQuoteMinor(['structural:theme', 'structural:platform'])).toBe(
      24_000
    );
    expect(suggestQuoteMinor(['image:media-swap'])).toBe(3_000);
  });

  it('has a base rate for a request no rule priced', () => {
    expect(suggestQuoteMinor([])).toBe(9_000);
    expect(suggestQuoteMinor(['something:unknown'])).toBe(9_000);
  });
});

describe('the view', () => {
  it('shows the client no suggested price and the operator one', () => {
    expect(toChangeRequestView(row()).suggestedQuoteMinor).toBeUndefined();
    expect(
      toChangeRequestView(row(), { forOperator: true }).suggestedQuoteMinor
    ).toBe(19_000);
  });

  it('never invents a status the table does not know', () => {
    expect(toChangeRequestView(row({ status: 'weird' })).status).toBe(
      'requested'
    );
  });
});
