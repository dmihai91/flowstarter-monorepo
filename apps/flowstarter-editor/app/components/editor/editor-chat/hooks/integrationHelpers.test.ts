/**
 * Integration Helpers - Unit Tests
 *
 * Tests the pure conversion functions between IntegrationConfig[] (UI state)
 * and the Convex projects.integrations schema format.
 */

import { describe, it, expect } from 'vitest';
import {
  toConvexBooking,
  toConvexNewsletter,
  toConvexIntegrations,
  isValidCalendlyUrl,
  isValidCalcomUrl,
  getEnabledIntegrations,
  buildIntegrationsMessage,
} from './integrationHelpers';
import type { IntegrationConfig } from '../types';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const CALENDLY_CONFIG: IntegrationConfig = {
  id: 'booking',
  name: 'Calendly',
  enabled: true,
  config: {
    provider: 'calendly',
    url: 'https://calendly.com/darius-popescu1191/30min',
  },
};

const CALCOM_CONFIG: IntegrationConfig = {
  id: 'booking',
  name: 'Cal.com',
  enabled: true,
  config: {
    provider: 'calcom',
    url: 'https://cal.com/darius/30min',
  },
};

const MAILCHIMP_CONFIG: IntegrationConfig = {
  id: 'newsletter',
  name: 'Mailchimp',
  enabled: true,
  config: {
    provider: 'mailchimp',
    url: 'https://example.us1.list-manage.com/subscribe/post',
  },
};

const CONVERTKIT_CONFIG: IntegrationConfig = {
  id: 'newsletter',
  name: 'ConvertKit',
  enabled: true,
  config: {
    provider: 'convertkit',
    url: '12345',
  },
};

const BUTTONDOWN_CONFIG: IntegrationConfig = {
  id: 'newsletter',
  name: 'Buttondown',
  enabled: true,
  config: {
    provider: 'buttondown',
    url: 'darius',
  },
};

const DISABLED_BOOKING: IntegrationConfig = {
  id: 'booking',
  name: 'Calendly',
  enabled: false,
  config: { provider: 'calendly', url: '' },
};

const DISABLED_NEWSLETTER: IntegrationConfig = {
  id: 'newsletter',
  name: 'Mailchimp',
  enabled: false,
  config: { provider: 'mailchimp', url: '' },
};

// ─── toConvexBooking ──────────────────────────────────────────────────────────

describe('toConvexBooking', () => {
  it('returns default (disabled, none) when config is undefined', () => {
    const result = toConvexBooking(undefined);
    expect(result).toEqual({
      enabled: false,
      provider: 'none',
    });
  });

  it('converts enabled Calendly config correctly', () => {
    const result = toConvexBooking(CALENDLY_CONFIG);
    expect(result).toEqual({
      enabled: true,
      provider: 'calendly',
      calendlyUrl: 'https://calendly.com/darius-popescu1191/30min',
      calcomUrl: undefined,
    });
  });

  it('converts enabled Cal.com config correctly', () => {
    const result = toConvexBooking(CALCOM_CONFIG);
    expect(result).toEqual({
      enabled: true,
      provider: 'calcom',
      calendlyUrl: undefined,
      calcomUrl: 'https://cal.com/darius/30min',
    });
  });

  it('sets provider URL fields based on provider only', () => {
    // Even if there's a url, calendlyUrl should only be set for provider=calendly
    const result = toConvexBooking(CALCOM_CONFIG);
    expect(result.calendlyUrl).toBeUndefined();
    expect(result.calcomUrl).toBe('https://cal.com/darius/30min');
  });

  it('preserves enabled=false from disabled config', () => {
    const result = toConvexBooking(DISABLED_BOOKING);
    expect(result.enabled).toBe(false);
    expect(result.provider).toBe('calendly');
    // URL is empty string which is falsy but still set
    expect(result.calendlyUrl).toBe('');
  });

  it('defaults provider to none when config.provider is missing', () => {
    const noProvider: IntegrationConfig = {
      id: 'booking',
      name: 'Booking',
      enabled: true,
      config: {},
    };
    const result = toConvexBooking(noProvider);
    expect(result.provider).toBe('none');
  });

  it('handles config without config property', () => {
    const noConfig: IntegrationConfig = {
      id: 'booking',
      name: 'Booking',
      enabled: false,
    };
    const result = toConvexBooking(noConfig);
    expect(result.enabled).toBe(false);
    expect(result.provider).toBe('none');
  });
});

// ─── toConvexNewsletter ───────────────────────────────────────────────────────

describe('toConvexNewsletter', () => {
  it('returns default (disabled, none) when config is undefined', () => {
    const result = toConvexNewsletter(undefined);
    expect(result).toEqual({
      enabled: false,
      provider: 'none',
    });
  });

  it('converts Mailchimp config — sets mailchimpUrl only', () => {
    const result = toConvexNewsletter(MAILCHIMP_CONFIG);
    expect(result).toEqual({
      enabled: true,
      provider: 'mailchimp',
      mailchimpUrl: 'https://example.us1.list-manage.com/subscribe/post',
      convertkitFormId: undefined,
      buttondownUsername: undefined,
    });
  });

  it('converts ConvertKit config — sets convertkitFormId only', () => {
    const result = toConvexNewsletter(CONVERTKIT_CONFIG);
    expect(result).toEqual({
      enabled: true,
      provider: 'convertkit',
      mailchimpUrl: undefined,
      convertkitFormId: '12345',
      buttondownUsername: undefined,
    });
  });

  it('converts Buttondown config — sets buttondownUsername only', () => {
    const result = toConvexNewsletter(BUTTONDOWN_CONFIG);
    expect(result).toEqual({
      enabled: true,
      provider: 'buttondown',
      mailchimpUrl: undefined,
      convertkitFormId: undefined,
      buttondownUsername: 'darius',
    });
  });

  it('preserves enabled=false', () => {
    const result = toConvexNewsletter(DISABLED_NEWSLETTER);
    expect(result.enabled).toBe(false);
  });

  it('defaults provider to none when missing', () => {
    const noProvider: IntegrationConfig = {
      id: 'newsletter',
      name: 'Newsletter',
      enabled: true,
      config: {},
    };
    const result = toConvexNewsletter(noProvider);
    expect(result.provider).toBe('none');
  });
});

// ─── toConvexIntegrations ─────────────────────────────────────────────────────

describe('toConvexIntegrations', () => {
  it('converts full config with both booking and newsletter', () => {
    const result = toConvexIntegrations([CALENDLY_CONFIG, MAILCHIMP_CONFIG]);

    expect(result.booking.enabled).toBe(true);
    expect(result.booking.provider).toBe('calendly');
    expect(result.booking.calendlyUrl).toBe('https://calendly.com/darius-popescu1191/30min');

    expect(result.newsletter.enabled).toBe(true);
    expect(result.newsletter.provider).toBe('mailchimp');
    expect(result.newsletter.mailchimpUrl).toBe('https://example.us1.list-manage.com/subscribe/post');
  });

  it('handles empty array — both default to disabled', () => {
    const result = toConvexIntegrations([]);
    expect(result.booking).toEqual({ enabled: false, provider: 'none' });
    expect(result.newsletter).toEqual({ enabled: false, provider: 'none' });
  });

  it('handles only booking enabled', () => {
    const result = toConvexIntegrations([CALENDLY_CONFIG]);
    expect(result.booking.enabled).toBe(true);
    expect(result.newsletter.enabled).toBe(false);
  });

  it('handles only newsletter enabled', () => {
    const result = toConvexIntegrations([MAILCHIMP_CONFIG]);
    expect(result.booking.enabled).toBe(false);
    expect(result.newsletter.enabled).toBe(true);
  });

  it('handles both disabled', () => {
    const result = toConvexIntegrations([DISABLED_BOOKING, DISABLED_NEWSLETTER]);
    expect(result.booking.enabled).toBe(false);
    expect(result.newsletter.enabled).toBe(false);
  });

  it('ignores unknown integration IDs', () => {
    const unknown: IntegrationConfig = {
      id: 'analytics',
      name: 'Google Analytics',
      enabled: true,
      config: { trackingId: 'G-12345' },
    };
    const result = toConvexIntegrations([unknown, CALENDLY_CONFIG]);
    expect(result.booking.enabled).toBe(true);
    expect(result.newsletter.enabled).toBe(false);
  });

  it('handles duplicate IDs — uses first match (find behavior)', () => {
    const calendly2: IntegrationConfig = {
      id: 'booking',
      name: 'Cal.com',
      enabled: true,
      config: { provider: 'calcom', url: 'https://cal.com/other/30min' },
    };
    const result = toConvexIntegrations([CALENDLY_CONFIG, calendly2]);
    // Array.find returns the first match
    expect(result.booking.provider).toBe('calendly');
    expect(result.booking.calendlyUrl).toBe('https://calendly.com/darius-popescu1191/30min');
  });
});

// ─── URL Validators ───────────────────────────────────────────────────────────

describe('isValidCalendlyUrl', () => {
  it('accepts valid Calendly URLs', () => {
    expect(isValidCalendlyUrl('https://calendly.com/darius/30min')).toBe(true);
    expect(isValidCalendlyUrl('https://calendly.com/user-name/event-type')).toBe(true);
    expect(isValidCalendlyUrl('https://calendly.com/team/consultation')).toBe(true);
  });

  it('rejects non-Calendly domains', () => {
    expect(isValidCalendlyUrl('https://cal.com/darius/30min')).toBe(false);
    expect(isValidCalendlyUrl('https://google.com')).toBe(false);
    expect(isValidCalendlyUrl('https://evil-calendly.com/test')).toBe(false);
  });

  it('rejects Calendly root (no path)', () => {
    expect(isValidCalendlyUrl('https://calendly.com')).toBe(false);
    expect(isValidCalendlyUrl('https://calendly.com/')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidCalendlyUrl('')).toBe(false);
    expect(isValidCalendlyUrl('not-a-url')).toBe(false);
    expect(isValidCalendlyUrl('calendly.com/test')).toBe(false); // no protocol
  });
});

describe('isValidCalcomUrl', () => {
  it('accepts valid Cal.com URLs', () => {
    expect(isValidCalcomUrl('https://cal.com/darius/30min')).toBe(true);
    expect(isValidCalcomUrl('https://cal.com/team/event')).toBe(true);
  });

  it('rejects non-Cal.com domains', () => {
    expect(isValidCalcomUrl('https://calendly.com/darius/30min')).toBe(false);
    expect(isValidCalcomUrl('https://google.com')).toBe(false);
  });

  it('rejects root URL', () => {
    expect(isValidCalcomUrl('https://cal.com')).toBe(false);
    expect(isValidCalcomUrl('https://cal.com/')).toBe(false);
  });
});

// ─── getEnabledIntegrations ───────────────────────────────────────────────────

describe('getEnabledIntegrations', () => {
  it('returns only enabled integrations', () => {
    const result = getEnabledIntegrations([CALENDLY_CONFIG, DISABLED_NEWSLETTER]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('booking');
  });

  it('returns empty array when none enabled', () => {
    const result = getEnabledIntegrations([DISABLED_BOOKING, DISABLED_NEWSLETTER]);
    expect(result).toHaveLength(0);
  });

  it('returns all when all enabled', () => {
    const result = getEnabledIntegrations([CALENDLY_CONFIG, MAILCHIMP_CONFIG]);
    expect(result).toHaveLength(2);
  });

  it('handles empty input', () => {
    const result = getEnabledIntegrations([]);
    expect(result).toHaveLength(0);
  });
});

// ─── buildIntegrationsMessage ─────────────────────────────────────────────────

describe('buildIntegrationsMessage', () => {
  it('shows generic message when no integrations enabled', () => {
    expect(buildIntegrationsMessage([])).toBe("Let's build my site!");
    expect(buildIntegrationsMessage([DISABLED_BOOKING])).toBe("Let's build my site!");
  });

  it('shows single integration name', () => {
    expect(buildIntegrationsMessage([CALENDLY_CONFIG])).toBe("I've connected Calendly. Let's build!");
  });

  it('shows both integration names joined with "and"', () => {
    expect(buildIntegrationsMessage([CALENDLY_CONFIG, MAILCHIMP_CONFIG]))
      .toBe("I've connected Calendly and Mailchimp. Let's build!");
  });

  it('uses the integration name field, not the id', () => {
    const custom: IntegrationConfig = {
      id: 'booking',
      name: 'My Custom Booking',
      enabled: true,
      config: { provider: 'custom' },
    };
    expect(buildIntegrationsMessage([custom])).toBe("I've connected My Custom Booking. Let's build!");
  });
});

