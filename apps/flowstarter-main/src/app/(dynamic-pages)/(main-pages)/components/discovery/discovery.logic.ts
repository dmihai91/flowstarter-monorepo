/**
 * Discovery wizard data model + deterministic tier recommendation.
 *
 * Tiers reference docs/FLOWSTARTER_MASTER_DECISIONS.md (canonical).
 * Setup fees in EUR (founding price not exposed publicly here).
 */

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Tier = 'starter' | 'pro' | 'commerce' | 'custom';

/**
 * Monthly subscription is INDEPENDENT of the one-time setup package. The
 * client picks a build package (Tier) and, separately, a monthly plan sized
 * by AI edit sessions. The Commerce build package is the exception: it has a
 * dedicated flat store subscription instead of the 3-tier picker.
 */
export type SubscriptionTier = 'starter' | 'pro' | 'max';

export const SUBSCRIPTIONS: Record<
  SubscriptionTier,
  { priceEur: number; sessions: number }
> = {
  starter: { priceEur: 39, sessions: 50 },
  pro: { priceEur: 99, sessions: 150 },
  max: { priceEur: 249, sessions: 450 },
};

/** Commerce build package → dedicated storefront subscription (flat). */
export const ECOMMERCE_SUBSCRIPTION = { priceEur: 149, sessions: 450 };

/** True when the build tier uses the dedicated store subscription. */
export function usesDedicatedSubscription(tier: Tier | ''): boolean {
  return tier === 'commerce';
}

export type GoalId = 'leads' | 'sales' | 'bookings' | 'portfolio';
export type ToneId = 'professional' | 'bold' | 'friendly' | 'minimal';
export type CommerceMode =
  | 'none'
  | 'few-services'
  | 'digital'
  | 'physical'
  | 'mixed';
export type CatalogSize = 'na' | '1-5' | '6-25' | '26-100' | '100+' | 'unsure';
export type PageCount = 'lt-5' | '5-7' | '8-15' | '15+' | 'unsure';
export type TimelineId = 'asap' | '4-weeks' | '1-3-months' | 'flexible';

export interface DiscoveryData {
  // Step 1 — about you
  fullName: string;
  email: string;
  businessName: string;

  // Step 2 — business
  industry: string;
  description: string;
  targetAudience: string;

  // Step 3 — goals
  goal: GoalId | '';
  brandTone: ToneId | '';
  pageCount: PageCount | '';
  timeline: TimelineId | '';

  // Step 4 — commerce + integrations
  commerceMode: CommerceMode | '';
  catalogSize: CatalogSize;
  customIntegrations: string;

  // Step 5 — recommendation
  /** User-confirmed build package (may differ from auto recommendation) */
  selectedTier: Tier | '';

  // Step 6 — monthly plan (independent of setup; n/a for Commerce, which
  // uses the dedicated store subscription)
  subscription: SubscriptionTier | '';
}

export const EMPTY_DISCOVERY: DiscoveryData = {
  fullName: '',
  email: '',
  businessName: '',
  industry: '',
  description: '',
  targetAudience: '',
  goal: '',
  brandTone: '',
  pageCount: '',
  timeline: '',
  commerceMode: '',
  catalogSize: 'na',
  customIntegrations: '',
  selectedTier: '',
  subscription: '',
};

export const STEPS: Array<{ n: Step; key: string }> = [
  { n: 1, key: 'about' },
  { n: 2, key: 'business' },
  { n: 3, key: 'goals' },
  { n: 4, key: 'commerce' },
  { n: 5, key: 'recommendation' },
  { n: 6, key: 'subscription' },
  { n: 7, key: 'preview' },
];

export const LAST_STEP: Step = 7;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function canProceed(step: Step, d: DiscoveryData): boolean {
  switch (step) {
    case 1:
      return d.fullName.trim().length >= 2 && EMAIL_RE.test(d.email.trim());
    case 2:
      return d.description.trim().length >= 10;
    case 3:
      return d.goal !== '';
    case 4:
      return d.commerceMode !== '';
    case 5:
      return d.selectedTier !== '';
    case 6:
      // Commerce uses the dedicated store subscription — nothing to pick.
      return usesDedicatedSubscription(d.selectedTier) || d.subscription !== '';
    case 7:
      return true;
  }
}

/**
 * Palette + type derived from the chosen brand tone. Used by the inline
 * site-preview demo so the prospect sees something shaped like their brand,
 * not a generic stock mock.
 */
export interface PreviewTheme {
  accent: string;
  accentSoft: string;
  ink: string;
  bg: string;
  panel: string;
  font: string;
  radius: string;
}

export function previewTheme(tone: ToneId | ''): PreviewTheme {
  switch (tone) {
    case 'bold':
      return {
        accent: '#e8551f',
        accentSoft: 'rgba(232,85,31,0.12)',
        ink: '#1a1208',
        bg: '#fffaf4',
        panel: '#ffffff',
        font: "'Plus Jakarta Sans', system-ui, sans-serif",
        radius: '14px',
      };
    case 'friendly':
      return {
        accent: '#2f8f6b',
        accentSoft: 'rgba(47,143,107,0.12)',
        ink: '#10241c',
        bg: '#f5fbf8',
        panel: '#ffffff',
        font: "'Plus Jakarta Sans', system-ui, sans-serif",
        radius: '20px',
      };
    case 'minimal':
      return {
        accent: '#111111',
        accentSoft: 'rgba(0,0,0,0.06)',
        ink: '#111111',
        bg: '#ffffff',
        panel: '#fafafa',
        font: "'Plus Jakarta Sans', system-ui, sans-serif",
        radius: '4px',
      };
    case 'professional':
    default:
      return {
        accent: '#3b4ee0',
        accentSoft: 'rgba(59,78,224,0.10)',
        ink: '#0f1430',
        bg: '#f7f8fc',
        panel: '#ffffff',
        font: "'Plus Jakarta Sans', system-ui, sans-serif",
        radius: '10px',
      };
  }
}

/** Primary action label for the mock site, shaped by the prospect's goal. */
export function previewCtaLabel(goal: GoalId | ''): string {
  switch (goal) {
    case 'sales':
      return 'Shop now';
    case 'bookings':
      return 'Book a session';
    case 'portfolio':
      return 'View work';
    case 'leads':
    default:
      return 'Get in touch';
  }
}

export interface Recommendation {
  tier: Tier;
  /** i18n key suffixes under `landing.discovery.recommendation.reasons.*` */
  reasonKeys: string[];
}

/**
 * Deterministic tier recommendation. Order matters — first match wins for the
 * primary tier, but reasonKeys aggregate every signal for transparency.
 */
export function recommendTier(d: DiscoveryData): Recommendation {
  const reasons: string[] = [];

  const integrations = d.customIntegrations.trim();
  const hasCustomIntegrations = integrations.length > 5;

  const physicalOrMixed =
    d.commerceMode === 'physical' || d.commerceMode === 'mixed';
  const digital = d.commerceMode === 'digital';
  const fewServices = d.commerceMode === 'few-services';
  const noCommerce = d.commerceMode === 'none';

  const largeCatalog = d.catalogSize === '26-100' || d.catalogSize === '100+';
  const mediumCatalog = d.catalogSize === '6-25';

  const manyPages = d.pageCount === '8-15' || d.pageCount === '15+';
  const mediumPages = d.pageCount === '5-7';

  let tier: Tier = 'starter';

  if (hasCustomIntegrations) {
    tier = 'custom';
    reasons.push('customIntegrations');
  } else if (physicalOrMixed && (largeCatalog || mediumCatalog)) {
    tier = 'commerce';
    reasons.push('physicalCatalog');
  } else if (digital && (largeCatalog || mediumCatalog)) {
    tier = 'commerce';
    reasons.push('digitalCatalog');
  } else if (digital || fewServices) {
    tier = 'pro';
    reasons.push('simplePayments');
  } else if (manyPages) {
    tier = 'pro';
    reasons.push('multiPage');
  } else if (mediumPages && d.goal === 'leads') {
    tier = 'pro';
    reasons.push('contentDriven');
  } else if (noCommerce) {
    tier = 'starter';
    reasons.push('servicePresentation');
  }

  if (d.goal === 'bookings' && tier === 'starter') {
    reasons.push('bookingFriendly');
  }
  if (d.goal === 'portfolio' && tier === 'starter') {
    reasons.push('portfolioFriendly');
  }
  if (d.timeline === 'asap') {
    reasons.push('fastTurnaround');
  }

  if (reasons.length === 0) reasons.push('default');

  return { tier, reasonKeys: reasons };
}

/** Setup fee minimum displayed alongside the tier in the recommendation step. */
export const TIER_SETUP_FROM: Record<Tier, string> = {
  starter: '€799',
  pro: '€1,199',
  commerce: '€1,499',
  custom: '€2,499',
};

/** Numeric setup-fee minimum, used to compute the 10% booking deposit. */
const TIER_SETUP_FROM_NUMERIC: Record<Tier, number> = {
  starter: 799,
  pro: 1199,
  commerce: 1499,
  custom: 2499,
};

/** Deposit % of setup fee required to book the discovery call. */
export const BOOKING_DEPOSIT_PERCENT = 10;

/**
 * Custom is "from €2,499" — open-ended scope, so the booking deposit is a
 * flat figure rather than 10% of an unknown final number.
 */
export const CUSTOM_BOOKING_DEPOSIT_EUR = 199;

/** Booking-deposit amount in whole euros for a tier. */
export function bookingDepositAmount(tier: Tier): number {
  if (tier === 'custom') return CUSTOM_BOOKING_DEPOSIT_EUR;
  // Setup fees end in 9 (€799, €1,199, €1,499); 10% is fractional
  // (€79.9, €119.9, €149.9). Floor so the deposit keeps the .9-style
  // price ending (€79 / €119 / €149) instead of rounding up.
  return Math.floor(
    TIER_SETUP_FROM_NUMERIC[tier] * (BOOKING_DEPOSIT_PERCENT / 100)
  );
}

/** Formatted booking-deposit amount for a tier, e.g. "€79", "€199". */
export function bookingDepositFor(tier: Tier): string {
  return `€${bookingDepositAmount(tier).toLocaleString('en-IE')}`;
}

export const TIER_MONTHLY_FROM: Record<Tier, string> = {
  starter: '€49/mo',
  pro: '€79/mo',
  commerce: '€89/mo',
  custom: '€79+/mo',
};
