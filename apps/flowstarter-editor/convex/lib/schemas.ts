import { v } from 'convex/values';

/**
 * Shared Convex validation schemas used across projects and conversations.
 */

export const bookingIntegrationSchema = v.object({
  enabled: v.boolean(),
  provider: v.union(v.literal('calendly'), v.literal('calcom'), v.literal('custom'), v.literal('none')),
  calendlyUrl: v.optional(v.string()),
  calcomUrl: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  phone: v.optional(v.string()),
});

export const newsletterIntegrationSchema = v.object({
  enabled: v.boolean(),
  provider: v.union(
    v.literal('mailchimp'),
    v.literal('convertkit'),
    v.literal('buttondown'),
    v.literal('custom'),
    v.literal('none'),
  ),
  mailchimpUrl: v.optional(v.string()),
  convertkitFormId: v.optional(v.string()),
  buttondownUsername: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
});

export const integrationsSchema = v.object({
  booking: v.optional(bookingIntegrationSchema),
  newsletter: v.optional(newsletterIntegrationSchema),
});

export const brandProfileSchema = v.object({
  brandTone: v.object({
    primary: v.string(),
    secondary: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  }),
  valueProposition: v.optional(v.string()),
  primaryGoal: v.optional(v.string()),
  desiredCustomerAction: v.optional(v.string()),
  differentiators: v.optional(v.array(v.string())),
  trustSignals: v.optional(v.array(v.string())),
  contentStylePreference: v.optional(v.string()),
  operatorNotes: v.optional(v.string()),
});

export const messageSchema = v.object({
  id: v.string(),
  role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
  content: v.string(),
  createdAt: v.number(),
  component: v.optional(v.string()),
  metadata: v.optional(v.string()),
});
