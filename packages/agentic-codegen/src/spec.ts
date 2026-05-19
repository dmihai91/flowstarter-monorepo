/**
 * The user spec the agent turns into a site. Mirrors the discovery wizard /
 * `discovery_leads` columns (business_name, industry, description,
 * target_audience, goal, brand_tone, page_count) so a funnel lead row maps
 * straight onto this with no translation layer.
 */
export interface DiscoverySpec {
  businessName: string;
  industry?: string;
  /** Free-text description of the business — the primary signal. */
  description: string;
  targetAudience?: string;
  /** Primary outcome the site should drive (leads, bookings, sales, signups). */
  goal?: string;
  /** Brand tone words, e.g. "warm, calm, trustworthy". */
  brandTone?: string;
  /** "1" | "few" | "several" | "not sure" — advisory only. */
  pageCount?: string;
  /** Secondary goals / extras the wizard collected. */
  secondaryGoals?: string[];
}

/**
 * A realistic spec for the test harness — deliberately distinct from every
 * template's built-in exemplar so personalization is visibly exercised
 * (a same-name/same-niche spec correctly yields ~no change).
 */
export const sampleSpec: DiscoverySpec = {
  businessName: 'Still Point',
  industry: 'Therapy & counselling',
  description:
    'A solo psychotherapy practice in Manchester specialising in grief, pregnancy loss and the perinatal period. Quiet, slow, relational work — in person and online.',
  targetAudience:
    'Adults navigating loss or the transition into parenthood who want an unhurried, deeply human therapist, not a six-session protocol.',
  goal: 'Help the right people feel safe enough to make first contact',
  brandTone: 'tender, steady, plainspoken, unhurried — never clinical or saccharine',
  pageCount: 'few',
  secondaryGoals: ['Normalise reaching out early', 'Convey real specialism in grief and perinatal work'],
};
