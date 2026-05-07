import 'server-only';
import { models } from '@/lib/ai/openrouter-client';
import { generateText } from 'ai';

/**
 * Generate first-pass site copy for a Flowstarter project.
 *
 * Takes a structured business brief (from enrich-project or manual entry) and
 * returns hero, services, about, and CTA copy that the team reviews + edits
 * before deploying. Saves 20-60 minutes of copywriting per project.
 *
 * Used from the team admin "Generate copy" button on the project detail page.
 * NOT exposed to clients — limited AI for admin productivity, not autonomous
 * site generation.
 */

export interface SiteCopyInput {
  /** Business name as it'll appear on the site */
  businessName: string;
  /** What the business does (1-3 sentences) */
  description: string;
  /** Industry or niche, e.g. "life coaching", "Italian restaurant" */
  industry?: string;
  /** Who the site is for, e.g. "busy parents", "small B2B teams" */
  targetAudience?: string;
  /** What makes them different / their UVP */
  uvp?: string;
  /** Primary goal of the site */
  goal?: 'leads' | 'sales' | 'bookings';
  /** Brand tone */
  brandTone?: 'professional' | 'bold' | 'friendly';
  /** Comma-separated services or offerings */
  offerings?: string;
  /** Locale for the output (default 'en'). When 'ro', returns Romanian copy. */
  locale?: 'en' | 'ro';
}

export interface SiteCopy {
  hero: {
    headline: string;
    subhead: string;
    primaryCta: string;
  };
  services: {
    sectionTitle: string;
    items: Array<{ title: string; description: string }>;
  };
  about: {
    sectionTitle: string;
    paragraph: string;
  };
  finalCta: {
    headline: string;
    subhead: string;
    button: string;
  };
}

function buildPrompt(input: SiteCopyInput): string {
  const locale = input.locale === 'ro' ? 'Romanian' : 'English';
  const tone = input.brandTone ?? 'professional';
  const goal = input.goal ?? 'leads';

  return `You are a senior conversion copywriter for service-business websites.

Write first-pass website copy for the business below in **${locale}**, with a **${tone}** brand tone, optimized to drive **${goal}**.

BUSINESS BRIEF:
- Name: ${input.businessName}
- Description: ${input.description}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.targetAudience ? `- Target audience: ${input.targetAudience}` : ''}
${input.uvp ? `- UVP / what makes them different: ${input.uvp}` : ''}
${input.offerings ? `- Offerings: ${input.offerings}` : ''}

CONSTRAINTS:
- Be specific, no buzzwords, no "elevate your business" filler.
- Hero headline: ≤ 60 chars. Hero subhead: ≤ 140 chars.
- Services: 3-5 items. Each title ≤ 40 chars, description ≤ 120 chars.
- About paragraph: ≤ 280 chars.
- Final CTA headline: ≤ 70 chars.
- Use the audience's language and concerns.

OUTPUT — pure JSON, no markdown fences, no commentary, exactly this shape:

{
  "hero": { "headline": "...", "subhead": "...", "primaryCta": "..." },
  "services": {
    "sectionTitle": "...",
    "items": [
      { "title": "...", "description": "..." }
    ]
  },
  "about": { "sectionTitle": "...", "paragraph": "..." },
  "finalCta": { "headline": "...", "subhead": "...", "button": "..." }
}`;
}

export async function generateSiteCopy(
  input: SiteCopyInput
): Promise<SiteCopy> {
  if (!input.businessName?.trim() || !input.description?.trim()) {
    throw new Error(
      'generateSiteCopy: businessName and description are required'
    );
  }

  const { text } = await generateText({
    model: models.projectDetails,
    prompt: buildPrompt(input),
    temperature: 0.4,
  });

  const trimmed = text.trim();
  // Strip accidental markdown fences if the model wraps in ```json ... ```
  const jsonText = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      `generateSiteCopy: model returned invalid JSON: ${(e as Error).message}`
    );
  }

  if (!isSiteCopy(parsed)) {
    throw new Error('generateSiteCopy: model output missing required fields');
  }
  return parsed;
}

function isSiteCopy(value: unknown): value is SiteCopy {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isObjectWithStrings(v.hero, ['headline', 'subhead', 'primaryCta']) &&
    isObjectWithStrings(v.about, ['sectionTitle', 'paragraph']) &&
    isObjectWithStrings(v.finalCta, ['headline', 'subhead', 'button']) &&
    isServicesShape(v.services)
  );
}

function isObjectWithStrings(value: unknown, keys: string[]): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return keys.every(
    (k) => typeof v[k] === 'string' && (v[k] as string).length > 0
  );
}

function isServicesShape(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.sectionTitle !== 'string') return false;
  if (!Array.isArray(v.items)) return false;
  return v.items.every((item) =>
    isObjectWithStrings(item, ['title', 'description'])
  );
}
