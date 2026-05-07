import 'server-only';
import { models } from '@/lib/ai/openrouter-client';
import { generateText } from 'ai';

/**
 * Classify a client_request into an actionable type for the team.
 *
 * Used from the team admin Client requests inbox to triage incoming
 * requests faster. Reads the raw request text + project context, returns
 * a category, urgency, suggested action, and a 1-line summary.
 *
 * Categories:
 *   - text_edit       — copy change (rename a section, fix a typo, swap a word)
 *   - image_swap      — replace an image / asset
 *   - style           — color, font, theme, layout tweak
 *   - structural      — add/remove/reorder a section or page
 *   - integration     — connect a 3rd-party (Calendly, Mailchimp, Stripe)
 *   - commerce        — add/remove products, pricing changes
 *   - escalate        — needs human design or scoping; quote separately
 *   - clarify         — request is ambiguous, ask the client a question
 */

export const CLIENT_REQUEST_CATEGORIES = [
  'text_edit',
  'image_swap',
  'style',
  'structural',
  'integration',
  'commerce',
  'escalate',
  'clarify',
] as const;

export type ClientRequestCategory = (typeof CLIENT_REQUEST_CATEGORIES)[number];

export type ClientRequestUrgency = 'low' | 'normal' | 'high';

export interface ClassifiedClientRequest {
  category: ClientRequestCategory;
  urgency: ClientRequestUrgency;
  summary: string;
  suggestedAction: string;
  estimatedMinutes: number;
}

export interface ClassifyClientRequestInput {
  /** Raw text of what the client wrote */
  requestText: string;
  /** Optional context to help classification */
  projectContext?: {
    name?: string;
    industry?: string;
    tier?: 'starter' | 'pro' | 'commerce';
  };
}

const SYSTEM_PROMPT = `You are a triage assistant for a concierge website-building service. You read incoming change requests from clients and tag them so the team can act quickly.

Categories:
  - text_edit: copy/text change (rename a section, fix wording, change phone number)
  - image_swap: replace an image or asset
  - style: color, font, theme, or visual layout tweak
  - structural: add/remove/reorder a section or page
  - integration: connect a 3rd-party tool (Calendly, Mailchimp, Stripe, etc.)
  - commerce: add/remove products, change prices, change checkout
  - escalate: complex change that needs human design/scoping (custom features, redesigns)
  - clarify: request is too ambiguous; ask the client a follow-up question first

Urgency:
  - low: cosmetic, no impact on bookings/sales
  - normal: improves conversion or fixes a small annoyance
  - high: actively blocking the client (e.g. broken link on hero, wrong phone number)

estimatedMinutes: realistic team time to ship the change (5-15 for text/image, 15-45 for style, 30-90 for structural, 60-180 for integration/commerce, > 180 → escalate).`;

function buildPrompt(input: ClassifyClientRequestInput): string {
  const ctx = input.projectContext;
  return `${SYSTEM_PROMPT}

PROJECT CONTEXT:
${ctx?.name ? `- Project: ${ctx.name}` : ''}
${ctx?.industry ? `- Industry: ${ctx.industry}` : ''}
${ctx?.tier ? `- Tier: ${ctx.tier}` : ''}

CLIENT REQUEST (verbatim):
"""
${input.requestText.trim()}
"""

OUTPUT — pure JSON, no markdown fences, exactly this shape:

{
  "category": "text_edit | image_swap | style | structural | integration | commerce | escalate | clarify",
  "urgency": "low | normal | high",
  "summary": "<= 12 words, imperative, what the team needs to do",
  "suggestedAction": "<= 25 words, concrete next step for the team",
  "estimatedMinutes": <integer>
}`;
}

export async function classifyClientRequest(
  input: ClassifyClientRequestInput
): Promise<ClassifiedClientRequest> {
  if (!input.requestText?.trim()) {
    throw new Error('classifyClientRequest: requestText is required');
  }

  const { text } = await generateText({
    model: models.projectDetails,
    prompt: buildPrompt(input),
    temperature: 0.1,
  });

  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      `classifyClientRequest: model returned invalid JSON: ${(e as Error).message}`
    );
  }

  return normalize(parsed);
}

function normalize(value: unknown): ClassifiedClientRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('classifyClientRequest: model output not an object');
  }
  const v = value as Record<string, unknown>;

  const category = inEnum(
    v.category,
    CLIENT_REQUEST_CATEGORIES,
    'clarify' as ClientRequestCategory
  );
  const urgency = inEnum(
    v.urgency,
    ['low', 'normal', 'high'] as const,
    'normal' as ClientRequestUrgency
  );

  const summary =
    typeof v.summary === 'string' ? v.summary.trim().slice(0, 200) : 'Pending';
  const suggestedAction =
    typeof v.suggestedAction === 'string'
      ? v.suggestedAction.trim().slice(0, 400)
      : 'Triage';

  let estimatedMinutes = 30;
  if (typeof v.estimatedMinutes === 'number' && Number.isFinite(v.estimatedMinutes)) {
    estimatedMinutes = Math.max(5, Math.min(480, Math.round(v.estimatedMinutes)));
  }

  return { category, urgency, summary, suggestedAction, estimatedMinutes };
}

function inEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string') return fallback;
  return allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}
