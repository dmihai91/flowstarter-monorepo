import { describe, expect, it } from 'vitest';

import { billingEventToTierUpdate } from '../route';

const userPayer = { payer: { user_id: 'user_123' } };

describe('billingEventToTierUpdate', () => {
  it('maps an active subscription to the plan tier', () => {
    const r = billingEventToTierUpdate('subscription.active', {
      id: 'sub_1',
      status: 'active',
      ...userPayer,
      items: [{ plan: { slug: 'pro' } }],
    });
    expect(r).toEqual({
      clerkUserId: 'user_123',
      tierName: 'pro',
      subscriptionStatus: 'active',
    });
  });

  it('maps created/updated and honors the event status', () => {
    const created = billingEventToTierUpdate('subscription.created', {
      id: 'sub_1',
      ...userPayer,
      items: [{ plan: { slug: 'ecommerce' } }],
    });
    expect(created).toMatchObject({
      tierName: 'ecommerce',
      subscriptionStatus: 'active',
    });

    const updated = billingEventToTierUpdate('subscription.updated', {
      id: 'sub_1',
      status: 'trialing',
      ...userPayer,
      items: [{ plan: { slug: 'max' } }],
    });
    expect(updated).toMatchObject({
      tierName: 'max',
      subscriptionStatus: 'trialing',
    });
  });

  it('returns null for an unknown / non-canonical plan slug', () => {
    expect(
      billingEventToTierUpdate('subscription.active', {
        id: 'sub_1',
        ...userPayer,
        items: [{ plan: { slug: 'free_user' } }],
      })
    ).toBeNull();
  });

  it('returns null for org payers (B2C only)', () => {
    expect(
      billingEventToTierUpdate('subscription.active', {
        id: 'sub_1',
        payer: { organization_id: 'org_1' },
        items: [{ plan: { slug: 'pro' } }],
      })
    ).toBeNull();
  });

  it('downgrades to floor (tierName null) on cancel/ended', () => {
    for (const t of [
      'subscriptionItem.canceled',
      'subscriptionItem.ended',
    ] as const) {
      const r = billingEventToTierUpdate(t, { id: 'si_1', ...userPayer });
      expect(r).toEqual({
        clerkUserId: 'user_123',
        tierName: null,
        subscriptionStatus: 'canceled',
      });
    }
  });

  it('keeps the tier on pastDue — flags status only (no tierName key)', () => {
    const r = billingEventToTierUpdate('subscription.pastDue', {
      id: 'sub_1',
      ...userPayer,
      items: [{ plan: { slug: 'pro' } }],
    });
    expect(r).toEqual({
      clerkUserId: 'user_123',
      subscriptionStatus: 'past_due',
    });
    expect(r && 'tierName' in r).toBe(false);
  });

  it('returns null for unrelated event types', () => {
    expect(
      billingEventToTierUpdate('user.created', { id: 'sub_1', ...userPayer })
    ).toBeNull();
  });
});
