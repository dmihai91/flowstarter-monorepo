/**
 * Integration Helpers
 *
 * Pure functions for converting between IntegrationConfig[] (UI state)
 * and the Convex projects.integrations schema format.
 */

import type { IntegrationConfig } from '../types';

export interface ConvexBookingConfig {
  enabled: boolean;
  provider: 'calendly' | 'calcom' | 'custom' | 'none';
  calendlyUrl?: string;
  calcomUrl?: string;
}

export interface ConvexNewsletterConfig {
  enabled: boolean;
  provider: 'mailchimp' | 'convertkit' | 'buttondown' | 'custom' | 'none';
  mailchimpUrl?: string;
  convertkitFormId?: string;
  buttondownUsername?: string;
}

export interface ConvexIntegrations {
  booking: ConvexBookingConfig;
  newsletter: ConvexNewsletterConfig;
}

const DEFAULT_BOOKING: ConvexBookingConfig = {
  enabled: false,
  provider: 'none' as const,
};

const DEFAULT_NEWSLETTER: ConvexNewsletterConfig = {
  enabled: false,
  provider: 'none' as const,
};

/**
 * Convert a booking IntegrationConfig to Convex schema format
 */
export function toConvexBooking(config: IntegrationConfig | undefined): ConvexBookingConfig {
  if (!config) return DEFAULT_BOOKING;

  const provider = (config.config?.provider as ConvexBookingConfig['provider']) || 'none';

  return {
    enabled: config.enabled,
    provider,
    calendlyUrl: provider === 'calendly' ? (config.config?.url as string) : undefined,
    calcomUrl: provider === 'calcom' ? (config.config?.url as string) : undefined,
  };
}

/**
 * Convert a newsletter IntegrationConfig to Convex schema format
 */
export function toConvexNewsletter(config: IntegrationConfig | undefined): ConvexNewsletterConfig {
  if (!config) return DEFAULT_NEWSLETTER;

  const provider = (config.config?.provider as ConvexNewsletterConfig['provider']) || 'none';

  return {
    enabled: config.enabled,
    provider,
    mailchimpUrl: provider === 'mailchimp' ? (config.config?.url as string) : undefined,
    convertkitFormId: provider === 'convertkit' ? (config.config?.url as string) : undefined,
    buttondownUsername: provider === 'buttondown' ? (config.config?.url as string) : undefined,
  };
}

/**
 * Convert an IntegrationConfig[] array to the full Convex integrations object.
 */
export function toConvexIntegrations(integrations: IntegrationConfig[]): ConvexIntegrations {
  const bookingConfig = integrations.find(i => i.id === 'booking');
  const newsletterConfig = integrations.find(i => i.id === 'newsletter');

  return {
    booking: toConvexBooking(bookingConfig),
    newsletter: toConvexNewsletter(newsletterConfig),
  };
}

/**
 * Validate that a URL is a plausible Calendly URL
 */
export function isValidCalendlyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'calendly.com' && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Validate that a URL is a plausible Cal.com URL
 */
export function isValidCalcomUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'cal.com' && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Filter integrations to only enabled ones
 */
export function getEnabledIntegrations(integrations: IntegrationConfig[]): IntegrationConfig[] {
  return integrations.filter(i => i.enabled);
}

/**
 * Build the user-facing message for selected integrations
 */
export function buildIntegrationsMessage(integrations: IntegrationConfig[]): string {
  const enabled = getEnabledIntegrations(integrations);

  if (enabled.length === 0) {
    return "Let's build my site!";
  }

  const names = enabled.map(i => i.name).join(' and ');
  return `I've connected ${names}. Let's build!`;
}

