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
 * by editor capabilities. The Commerce build package is the exception: it has
 * a dedicated flat store subscription instead of the 3-tier picker.
 */
export type SubscriptionTier = 'starter' | 'pro' | 'max';
export type BillingCadence = 'monthly' | 'yearly';

export const SUBSCRIPTIONS: Record<
  SubscriptionTier,
  { priceEur: number; summary: string }
> = {
  starter: { priceEur: 49, summary: 'Guided editor access' },
  pro: { priceEur: 99, summary: 'Manual model picker included' },
  max: { priceEur: 249, summary: 'Code experimentation included' },
};

/**
 * Commerce build → dedicated store plan with product and collection editing.
 * Mirrors PLAN_ENTITLEMENTS.ecommerce.
 */
export const ECOMMERCE_SUBSCRIPTION = {
  priceEur: 129,
  summary: 'Store editing for products and collections',
};

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

/** Suggested goal chips (multi-select). Users can also add freetext. */
export const GOAL_PRESETS: readonly string[] = [
  'Get enquiries / leads',
  'Sell products or services',
  'Take bookings or appointments',
  'Grow an email list',
  'Show a portfolio of work',
  'Build trust and credibility',
  'Promote an event or launch',
  'Drive calls or visits',
];

/**
 * Brand-tone chips across several dimensions (warmth, energy, formality,
 * character) — multi-select, plus freetext.
 */
export const TONE_PRESETS: readonly string[] = [
  'Warm',
  'Calm',
  'Friendly',
  'Professional',
  'Bold',
  'Playful',
  'Minimal',
  'Premium / elegant',
  'Energetic',
  'Trustworthy',
  'Modern',
  'Editorial',
  'Earthy / natural',
  'Vibrant',
  'Confident',
  'Approachable',
];

export interface DiscoveryData {
  // Step 1 — about you
  fullName: string;
  email: string;
  businessName: string;

  // Step 2 — business
  industry: string;
  description: string;
  targetAudience: string;
  instagramUrl: string;
  linkedinUrl: string;

  // Step 3 — goals. Free-form: chip presets + freetext, comma-joined.
  goal: string;
  /** Reserved (kept for back-compat; the goal chips capture everything). */
  secondaryGoals: string[];
  /** Multi-dimensional brand tone: chip presets + freetext, comma-joined. */
  brandTone: string;
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
  billingCadence: BillingCadence;
}

export const EMPTY_DISCOVERY: DiscoveryData = {
  fullName: '',
  email: '',
  businessName: '',
  industry: '',
  description: '',
  targetAudience: '',
  instagramUrl: '',
  linkedinUrl: '',
  goal: '',
  secondaryGoals: [],
  brandTone: '',
  pageCount: '',
  timeline: '',
  commerceMode: '',
  catalogSize: 'na',
  customIntegrations: '',
  selectedTier: '',
  subscription: '',
  billingCadence: 'monthly',
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
      return d.goal.trim() !== '';
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

/** Map free-form tone text to the closest preset visual theme. */
function resolveToneId(tone: string): ToneId {
  const t = tone.toLowerCase();
  if (/bold|vibrant|energetic|playful|colou?rful/.test(t)) return 'bold';
  if (/warm|friendly|approachable|earthy|natural|calm|gentle/.test(t))
    return 'friendly';
  if (/minimal|clean|elegant|premium|refined|editorial/.test(t))
    return 'minimal';
  return 'professional';
}

export function previewTheme(tone: ToneId | '' | string): PreviewTheme {
  switch (tone ? resolveToneId(tone) : 'professional') {
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
export function previewCtaLabel(goal: GoalId | '' | string): string {
  const g = String(goal).toLowerCase();
  if (/sell|shop|sales|product|store|buy/.test(g)) return 'Shop now';
  if (/book|appointment|session|reserv/.test(g)) return 'Book a session';
  if (/portfolio|showcase|view work|gallery/.test(g)) return 'View work';
  return 'Get in touch';
}

/* ───────────────────── Playable demo site model ─────────────────────── */

/** Max prompts a prospect can run against the demo editor. */
export const MAX_DEMO_EDITS = 20;

/** sessionStorage key for the generated demo (site + id + edits used). */
export const DEMO_STATE_KEY = 'fs-discovery-demo-v1';

export type DemoSectionId =
  | 'hero'
  | 'valueProps'
  | 'services'
  | 'about'
  | 'testimonial'
  | 'cta';

/**
 * The whole editable site, as one JSON model. The renderer draws it; the
 * edit endpoint sends this to the LLM and gets the same shape back with
 * only allowed mutations (copy, accent hex, section order/visibility).
 * Template-first: surfaces/typography come from the tone, never freeform.
 */
export interface DemoSite {
  brandName: string;
  tone: ToneId; // drives surfaces via previewTheme (always tasteful)
  accent: string; // hex — editable
  nav: string[];
  hero: { eyebrow: string; headline: string; subhead: string; cta: string };
  valueProps: Array<{ title: string; body: string }>;
  services: {
    sectionTitle: string;
    items: Array<{ title: string; description: string }>;
  };
  about: { sectionTitle: string; paragraph: string };
  testimonial: { quote: string; author: string };
  cta: { headline: string; subhead: string; button: string };
  order: DemoSectionId[];
  hidden: DemoSectionId[];
}

/** Generated copy shape returned by the server (mirror of lib/ai SiteCopy). */
export interface GeneratedSiteCopy {
  hero: { headline: string; subhead: string; primaryCta: string };
  services: {
    sectionTitle: string;
    items: Array<{ title: string; description: string }>;
  };
  about: { sectionTitle: string; paragraph: string };
  finalCta: { headline: string; subhead: string; button: string };
}

const DEFAULT_ORDER: DemoSectionId[] = [
  'hero',
  'valueProps',
  'services',
  'about',
  'testimonial',
  'cta',
];

/**
 * Compose the editable DemoSite from the generated copy + wizard answers.
 * Value props are distilled from the first services. Testimonials stay hidden
 * until the client supplies approved evidence.
 */
export function buildDemoSite(
  d: Pick<
    DiscoveryData,
    'businessName' | 'fullName' | 'industry' | 'targetAudience' | 'brandTone'
  >,
  copy: GeneratedSiteCopy
): DemoSite {
  const tone: ToneId = resolveToneId(d.brandTone);
  const theme = previewTheme(d.brandTone);
  const brandName =
    d.businessName.trim() || d.fullName.trim() || 'Your business';
  const items = copy.services.items.slice(0, 6);
  const valueProps = items.slice(0, 3).map((s) => ({
    title: s.title,
    body: s.description,
  }));
  return {
    brandName,
    tone,
    accent: theme.accent,
    nav: ['Home', copy.services.sectionTitle || 'Services', 'About'],
    hero: {
      eyebrow: d.industry.trim(),
      headline: copy.hero.headline,
      subhead: copy.hero.subhead,
      cta: copy.hero.primaryCta,
    },
    valueProps:
      valueProps.length > 0
        ? valueProps
        : [
            { title: 'Built for you', body: 'Designed around your offer.' },
            { title: 'Yours to edit', body: 'Change anything in plain words.' },
            { title: 'Live fast', body: 'Online in weeks, not months.' },
          ],
    services: {
      sectionTitle: copy.services.sectionTitle || 'What we do',
      items,
    },
    about: copy.about,
    testimonial: {
      quote: 'Client-approved testimonial content can appear here.',
      author: 'Hidden until evidence is supplied',
    },
    cta: {
      headline: copy.finalCta.headline,
      subhead: copy.finalCta.subhead,
      button: copy.finalCta.button,
    },
    order: [...DEFAULT_ORDER],
    hidden: ['testimonial'],
  };
}

/** Defensive: ensure an LLM-returned object is a usable DemoSite. */
export function isDemoSite(v: unknown): v is DemoSite {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.brandName === 'string' &&
    typeof s.accent === 'string' &&
    !!s.hero &&
    !!s.services &&
    !!s.cta &&
    Array.isArray(s.order)
  );
}

export interface Recommendation {
  tier: Tier;
  /** i18n key suffixes under `landing.discovery.recommendation.reasons.*` */
  reasonKeys: string[];
}

/**
 * Standard, pre-approved integrations the packaged flow already supports.
 * Anything a client asks for that falls outside this list is a bespoke
 * integration request. Shared by `recommendTier` and the routing rules
 * (`lib/flowstarter/routing-rules.ts`) so both read the same definition of
 * "custom integration".
 */
const STANDARD_INTEGRATION_RE =
  /\b(cal\.com|calendly|stripe|payment links?|newsletter|mailchimp|convertkit|brevo|contact forms?|booking)\b/i;

/** Splits the free-text integrations field into individual requests. */
export function integrationRequestList(customIntegrations: string): string[] {
  return customIntegrations
    .trim()
    .split(/[,;\n]|\band\b/gi)
    .map((value) => value.trim())
    .filter(Boolean);
}

/** True when at least one requested integration is outside the standard allow-list. */
export function hasCustomIntegrationRequest(customIntegrations: string): boolean {
  return integrationRequestList(customIntegrations).some(
    (request) => !STANDARD_INTEGRATION_RE.test(request)
  );
}

/**
 * Deterministic tier recommendation. Order matters — first match wins for the
 * primary tier, but reasonKeys aggregate every signal for transparency.
 */
export function recommendTier(d: DiscoveryData): Recommendation {
  const reasons: string[] = [];

  const hasCustomIntegrations = hasCustomIntegrationRequest(
    d.customIntegrations
  );

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
  } else if (mediumPages && /lead|enquir|inquir/i.test(d.goal)) {
    tier = 'pro';
    reasons.push('contentDriven');
  } else if (noCommerce) {
    tier = 'starter';
    reasons.push('servicePresentation');
  }

  if (/book|appointment/i.test(d.goal) && tier === 'starter') {
    reasons.push('bookingFriendly');
  }
  if (/portfolio|showcase/i.test(d.goal) && tier === 'starter') {
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
