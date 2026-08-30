/**
 * Deterministic ROUTING classifier: standard vs custom.
 *
 * This answers a DIFFERENT question than `recommendTier`
 * (discovery.logic.ts). `recommendTier` computes a price bracket
 * (starter/pro/commerce/custom) for pricing + UI, and is left untouched — a
 * commerce project can be perfectly standard to build, while a cheap,
 * rushed, custom-integration project is not. Routing decides which
 * *operational path* a lead takes: the standard packaged flow, or a custom
 * scoping conversation.
 *
 * Rules are DATA, not control flow: `ROUTING_RULES` is a flat list of
 * `{ id, weight, when, reason }`, and `ROUTING_THRESHOLDS` is the only other
 * tunable. Ops can retune sensitivity by editing weights/threshold here (or
 * via `ROUTING_CUSTOM_THRESHOLD` env) without touching `classifyRouting`.
 *
 * `classifyRouting` is pure, synchronous, and does no IO — no LLM is ever
 * consulted. Same input always produces the same output.
 *
 * ── Why `selectedTier === 'starter'` stands in for "budget" ────────────────
 * The wizard never collects a raw currency figure, so there is no literal
 * budget field to weigh. The closest honest signal is `selectedTier`: the
 * price bracket the client has actually confirmed (wizard step 5). It is
 * used only for the cheapest bracket, as a "tight budget" flag.
 *
 * This is deliberately NOT `recommendTier(d).tier` — that computed tier
 * already flips to `'custom'` the instant a bespoke integration is
 * described (see discovery.logic.ts), so using it here would make the
 * "budget" signal collapse into the "custom integration" signal instead of
 * being independent evidence. `selectedTier` is what the client chose to
 * pay, which is a genuinely separate fact.
 *
 * At recommend-time (step 5, before the tier is confirmed) `selectedTier` is
 * `''` and this rule simply does not fire — correct, since budget is not yet
 * knowable at that point in the flow. It becomes available by the time the
 * wizard submits (step 7), which is when routing is persisted for
 * calibration (see intake-submission.ts).
 */
import {
  hasCustomIntegrationRequest,
  integrationRequestList,
  type DiscoveryData,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';

export interface RoutingRule {
  id: string;
  /** Points added toward the 'custom' decision when `when(d)` is true. */
  weight: number;
  when: (d: DiscoveryData) => boolean;
  /** Human-readable explanation, surfaced in `reasons` and persisted for calibration. */
  reason: string;
}

const COMMERCE_ACTIVE = new Set<string>([
  'physical',
  'mixed',
  'digital',
  'few-services',
]);

const LARGE_CATALOG = new Set<string>(['26-100', '100+']);

function hasActiveCommerce(d: DiscoveryData): boolean {
  return d.commerceMode !== '' && d.commerceMode !== 'none';
}

export const ROUTING_RULES: RoutingRule[] = [
  // ── Heaviest: budget and deadline ─────────────────────────────────────
  {
    id: 'tightDeadline',
    weight: 4,
    when: (d) => d.timeline === 'asap',
    reason: 'Rush timeline (ASAP, ~2 weeks) needs bespoke scheduling',
  },
  {
    id: 'tightBudget',
    weight: 4,
    when: (d) => d.selectedTier === 'starter',
    reason: 'Confirmed starter-tier budget is the tightest bracket',
  },

  // ── Scope complexity ────────────────────────────────────────────────────
  {
    id: 'customIntegrationRequested',
    weight: 3,
    when: (d) => hasCustomIntegrationRequest(d.customIntegrations),
    reason: 'A requested integration falls outside the standard allow-list',
  },
  {
    id: 'largeCatalog',
    weight: 2,
    when: (d) => hasActiveCommerce(d) && LARGE_CATALOG.has(d.catalogSize),
    reason: 'Catalog of 26+ items needs custom merchandising / import work',
  },
  {
    id: 'mediumCatalogCommerce',
    weight: 1,
    when: (d) => hasActiveCommerce(d) && d.catalogSize === '6-25',
    reason: 'Mid-size catalog adds moderate setup complexity',
  },
  {
    id: 'manyPages',
    weight: 1,
    when: (d) => d.pageCount === '15+',
    reason: 'Large page count (15+) extends standard build scope',
  },

  // ── Informational / zero-weight ─────────────────────────────────────────
  // These fire and are recorded (audit trail + calibration) but never move
  // the score — most importantly, commerce alone must NOT force 'custom'.
  {
    id: 'commercePresent',
    weight: 0,
    when: (d) => COMMERCE_ACTIVE.has(d.commerceMode),
    reason: 'Commerce is present but standard commerce fits the packaged flow',
  },
  {
    id: 'standardIntegrationsOnly',
    weight: 0,
    when: (d) =>
      integrationRequestList(d.customIntegrations).length > 0 &&
      !hasCustomIntegrationRequest(d.customIntegrations),
    reason:
      'Only standard integrations (Cal.com, Stripe, newsletter, forms) requested',
  },
  {
    id: 'simpleBrochure',
    weight: 0,
    when: (d) =>
      d.commerceMode === 'none' &&
      !hasCustomIntegrationRequest(d.customIntegrations),
    reason: 'No commerce or custom integration — fits the standard brochure flow',
  },
  {
    id: 'bookingOrPortfolioGoal',
    weight: 0,
    when: (d) => /book|appointment|portfolio|showcase/i.test(d.goal),
    reason: 'Booking/portfolio goal is well served by the standard flow',
  },
  {
    id: 'flexibleTimeline',
    weight: 0,
    when: (d) => d.timeline === 'flexible',
    reason: 'Flexible timeline removes routing risk from schedule pressure',
  },
];

function envThreshold(): number {
  const raw = Number(process.env.ROUTING_CUSTOM_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

/** Overridable via `ROUTING_CUSTOM_THRESHOLD` for ops, without a code change. */
export const ROUTING_THRESHOLDS = {
  customAtOrAbove: envThreshold(),
};

export interface RoutingResult {
  decision: 'standard' | 'custom';
  score: number;
  rulesFired: string[];
  reasons: string[];
}

/**
 * Pure, synchronous, no IO, no LLM. Sums the weight of every rule whose
 * `when(d)` is true; `decision` is 'custom' once the score reaches
 * {@link ROUTING_THRESHOLDS.customAtOrAbove}.
 */
export function classifyRouting(data: DiscoveryData): RoutingResult {
  let score = 0;
  const rulesFired: string[] = [];
  const reasons: string[] = [];

  for (const rule of ROUTING_RULES) {
    if (rule.when(data)) {
      score += rule.weight;
      rulesFired.push(rule.id);
      reasons.push(rule.reason);
    }
  }

  const decision: 'standard' | 'custom' =
    score >= ROUTING_THRESHOLDS.customAtOrAbove ? 'custom' : 'standard';

  return { decision, score, rulesFired, reasons };
}
