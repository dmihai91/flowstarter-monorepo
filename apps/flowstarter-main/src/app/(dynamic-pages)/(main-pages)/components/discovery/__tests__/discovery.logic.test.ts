import { describe, expect, it } from 'vitest';
import {
  type DiscoveryData,
  EMPTY_DISCOVERY,
  INFO_STEP,
  LAST_STEP,
  STEPS,
  bookingDepositAmount,
  bookingDepositFor,
  canProceed,
  extractCalComUrl,
  resolveDiscoveryCalComUrl,
  recommendTier,
  usesDedicatedSubscription,
} from '../discovery.logic';

describe('booking deposit amounts', () => {
  it('is 10% of setup, floored, for standard tiers', () => {
    expect(bookingDepositAmount('starter')).toBe(79); // 10% of 799
    expect(bookingDepositAmount('pro')).toBe(119); // 10% of 1,199
    expect(bookingDepositAmount('commerce')).toBe(149); // 10% of 1,499
  });

  it('is a flat €199 for custom (open-ended scope)', () => {
    expect(bookingDepositAmount('custom')).toBe(199);
  });

  it('formats with the euro sign', () => {
    expect(bookingDepositFor('starter')).toBe('€79');
    expect(bookingDepositFor('custom')).toBe('€199');
  });
});

describe('extractCalComUrl', () => {
  it('finds a bare cal.com link mentioned alongside other text', () => {
    expect(extractCalComUrl('Cal.com: cal.com/acme/intro')).toBe(
      'cal.com/acme/intro'
    );
  });

  it('finds a full https app.cal.com URL', () => {
    expect(
      extractCalComUrl(
        'please use https://app.cal.com/acme-studio for bookings'
      )
    ).toBe('https://app.cal.com/acme-studio');
  });

  it('strips trailing prose punctuation', () => {
    expect(extractCalComUrl('booking via cal.com/acme, thanks!')).toBe(
      'cal.com/acme'
    );
  });

  it('returns null when no Cal.com link is mentioned', () => {
    expect(extractCalComUrl('Calendly: calendly.com/acme')).toBeNull();
    expect(
      extractCalComUrl('Mailchimp newsletter, Stripe payments')
    ).toBeNull();
    expect(extractCalComUrl('')).toBeNull();
  });
});

describe('resolveDiscoveryCalComUrl', () => {
  it('prefers the dedicated calComUrl field over free-text integrations', () => {
    expect(
      resolveDiscoveryCalComUrl({
        ...EMPTY_DISCOVERY,
        calComUrl: 'https://cal.com/dedicated/intro',
        customIntegrations: 'also cal.com/other/event',
      })
    ).toBe('https://cal.com/dedicated/intro');
  });

  it('falls back to extracting from customIntegrations', () => {
    expect(
      resolveDiscoveryCalComUrl({
        ...EMPTY_DISCOVERY,
        customIntegrations: 'Book via cal.com/acme/intro please',
      })
    ).toBe('cal.com/acme/intro');
  });
});

describe('wizard structure', () => {
  it('has 8 steps: the info agent between the form and the preview', () => {
    expect(STEPS).toHaveLength(8);
    // Order is the product: form → info agent → preview. The preview must
    // stay last, because that is the step the modal widens for and the step
    // the wizard submits from.
    expect(STEPS.map((step) => step.key)).toEqual([
      'about',
      'business',
      'goals',
      'commerce',
      'recommendation',
      'subscription',
      'info',
      'preview',
    ]);
    expect(STEPS[STEPS.length - 1].key).toBe('preview');
    expect(LAST_STEP).toBe(8);
    expect(INFO_STEP).toBe(LAST_STEP - 1);
  });

  it('commerce uses the dedicated store subscription', () => {
    expect(usesDedicatedSubscription('commerce')).toBe(true);
    expect(usesDedicatedSubscription('starter')).toBe(false);
  });
});

describe('canProceed gating', () => {
  const base: DiscoveryData = {
    ...EMPTY_DISCOVERY,
    fullName: 'Maria Ionescu',
    email: 'maria@example.com',
    description: 'A boutique dental clinic offering cosmetic work',
    goal: 'leads',
    commerceMode: 'none',
    selectedTier: 'starter',
  };

  it('requires a valid name + email on step 1', () => {
    expect(canProceed(1, base)).toBe(true);
    expect(canProceed(1, { ...base, email: 'not-an-email' })).toBe(false);
    expect(canProceed(1, { ...base, fullName: 'M' })).toBe(false);
  });

  it('requires a subscription on step 6 unless commerce (dedicated plan)', () => {
    expect(canProceed(6, { ...base, subscription: '' })).toBe(false);
    expect(canProceed(6, { ...base, subscription: 'pro' })).toBe(true);
    expect(
      canProceed(6, {
        ...base,
        selectedTier: 'commerce',
        subscription: '',
      })
    ).toBe(true);
  });

  it('always allows the final preview step', () => {
    expect(canProceed(8, base)).toBe(true);
  });

  it('never blocks on the info-agent step, however empty the answers', () => {
    // The chat is skippable by design: a visitor who wants the preview now
    // gets the preview now. Conversion beats completeness at this stage.
    expect(canProceed(INFO_STEP, base)).toBe(true);
    expect(canProceed(INFO_STEP, EMPTY_DISCOVERY)).toBe(true);
    expect(
      canProceed(INFO_STEP, { ...base, intakeChatStatus: 'skipped' })
    ).toBe(true);
  });
});

describe('tier recommendation', () => {
  const base: DiscoveryData = {
    ...EMPTY_DISCOVERY,
    fullName: 'X',
    email: 'x@example.com',
    description: 'desc',
  };

  it('recommends commerce for a real physical catalog', () => {
    const rec = recommendTier({
      ...base,
      goal: 'sales',
      commerceMode: 'physical',
      catalogSize: '26-100',
    });
    expect(rec.tier).toBe('commerce');
  });

  it('recommends custom when custom integrations are described', () => {
    const rec = recommendTier({
      ...base,
      goal: 'leads',
      commerceMode: 'none',
      customIntegrations: 'Bespoke CRM sync with a legacy ERP over SOAP',
    });
    expect(rec.tier).toBe('custom');
  });

  it('keeps standard booking, payment, and newsletter integrations in Pro', () => {
    const rec = recommendTier({
      ...base,
      goal: 'bookings',
      commerceMode: 'few-services',
      customIntegrations:
        'Cal.com for bookings, Stripe payment links, and a newsletter signup',
    });
    expect(rec.tier).toBe('pro');
  });

  it('defaults a simple service site to starter', () => {
    const rec = recommendTier({
      ...base,
      goal: 'bookings',
      commerceMode: 'none',
      pageCount: 'lt-5',
    });
    expect(rec.tier).toBe('starter');
  });
});
