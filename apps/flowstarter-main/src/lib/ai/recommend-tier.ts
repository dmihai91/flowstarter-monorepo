import 'server-only';

import { generateText } from 'ai';

import { models, isOpenRouterConfigured } from './client';
import type {
  DiscoveryData,
  Recommendation,
  Tier,
} from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';

const TIERS: ReadonlyArray<Tier> = ['starter', 'pro', 'commerce', 'custom'];

/**
 * Reason vocabulary the UI can render (keys under
 * `landing.discovery.recommendation.reasons.*`). The model must pick from
 * this set so the existing translations keep working.
 */
const REASON_KEYS = [
  'customIntegrations',
  'physicalCatalog',
  'digitalCatalog',
  'simplePayments',
  'multiPage',
  'contentDriven',
  'servicePresentation',
  'bookingFriendly',
  'portfolioFriendly',
  'fastTurnaround',
  'default',
] as const;

const TIER_GUIDE = `TIERS:
- "starter": A polished marketing/service site. No online store. Cheapest. For service businesses presenting what they do.
- "pro": Adds Stripe for selling DIGITAL products, courses, memberships, paid bookings, plus more pages/integrations. Choose this when they sell digital goods or a few paid services and the catalog is small.
- "commerce": A full storefront (inventory, shipping, tax, checkout). Choose this for a real store with a non-trivial catalog, physical OR a sizeable digital catalog.
- "custom": Bespoke build / heavy custom integrations.`;

function buildPrompt(d: DiscoveryData): string {
  return `You match a small business to the right website build tier.

${TIER_GUIDE}

THE BUSINESS:
- Name: ${d.businessName || '(not given)'}
- What they do: ${d.description || '(not given)'}
- Industry: ${d.industry || '(not given)'}
- Target audience: ${d.targetAudience || '(not given)'}
- Primary goal: ${d.goal || '(not given)'}
- Secondary goals: ${d.secondaryGoals.join(', ') || '(none)'}
- Brand tone: ${d.brandTone || '(not given)'}
- Estimated pages: ${d.pageCount || '(not given)'}
- Timeline: ${d.timeline || '(not given)'}
- Sells online: ${d.commerceMode || '(not given)'}
- Catalog size: ${d.catalogSize}
- Custom integrations: ${d.customIntegrations || '(none)'}

Weigh ALL of the above, especially the free-text description. If they sell
digital products (guides, courses, downloads), do NOT pick "starter" just
because the structured commerce field is vague — infer from the description.

REASON KEYS (pick 1-3 that best explain the choice, most important first):
${REASON_KEYS.join(', ')}

Respond with ONLY valid JSON, no markdown, no prose:
{"tier":"<starter|pro|commerce|custom>","reasonKeys":["<key>", ...]}`;
}

function coerce(raw: unknown): Recommendation | null {
  const r = raw as { tier?: unknown; reasonKeys?: unknown };
  const tier = r.tier;
  if (typeof tier !== 'string' || !TIERS.includes(tier as Tier)) return null;

  const allowed = new Set<string>(REASON_KEYS);
  const reasonKeys = Array.isArray(r.reasonKeys)
    ? r.reasonKeys
        .filter((k): k is string => typeof k === 'string' && allowed.has(k))
        .slice(0, 4)
    : [];

  return {
    tier: tier as Tier,
    reasonKeys: reasonKeys.length > 0 ? reasonKeys : ['default'],
  };
}

/** OpenRouter model id used for the recommendation (for cost attribution). */
export const RECOMMEND_MODEL = 'meta-llama/llama-3.1-70b-instruct';

export interface RecommendLLMResult {
  rec: Recommendation;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}

/**
 * LLM-driven tier recommendation. Returns `null` on any failure (no key,
 * model error, unparseable / invalid output) so the caller can fall back to
 * the deterministic {@link recommendTier}. Never throws.
 */
export async function recommendTierLLM(
  d: DiscoveryData
): Promise<RecommendLLMResult | null> {
  if (!isOpenRouterConfigured()) return null;

  try {
    const { text, usage } = await generateText({
      model: models.llama,
      messages: [
        {
          role: 'system',
          content:
            'You are a precise classification agent. Respond with valid JSON only, no markdown.',
        },
        { role: 'user', content: buildPrompt(d) },
      ],
      temperature: 0.1,
      maxOutputTokens: 120,
    });

    if (!text) return null;
    const clean = text
      .replace(/^```json\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
    const rec = coerce(JSON.parse(clean));
    if (!rec) return null;
    return { rec, usage: usage as RecommendLLMResult['usage'] };
  } catch {
    return null;
  }
}
