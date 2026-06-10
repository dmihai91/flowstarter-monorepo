// Demo generation + refinement. Uses a CHEAP/FAST model via OpenRouter
// (guardrail: demo model ≠ build model); falls back to the deterministic
// mock generator when no API key is configured.
import 'server-only';
import { z } from 'zod';
import {
  applyMockRefinement,
  mockSpecFromDescription,
  type SiteSpec,
} from '@flowstarter/build-engine';
import { MODELS } from './config';

const SpecSchema = z.object({
  brand: z.object({
    name: z.string().min(1).max(40),
    tagline: z.string().min(1).max(80),
    palette: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    voice: z.array(z.string()).min(1).max(4),
  }),
  copy: z.object({
    hero: z.string().min(1).max(120),
    sub: z.string().min(1).max(260),
    cta: z.string().min(1).max(40),
    sections: z.array(z.object({ h: z.string().max(60), p: z.string().max(220) })).length(3),
  }),
  positioning: z.string().min(1).max(120),
});

const SYSTEM = `You are the brand+copy demo generator for Flowstarter. Given a business description, produce a JSON object with this exact shape:
{"brand":{"name":string,"tagline":string,"palette":[primaryHex,secondaryHex,inkHex,paperHex],"voice":[2-3 adjectives]},"copy":{"hero":string,"sub":string,"cta":string,"sections":[{"h":string,"p":string} x3]},"positioning":string}
Rules: respond with ONLY the JSON object. Use the business's real name if one is given. Palette must be 4 hex colors that work together (readable ink on paper). Copy is concrete and specific to the business — no clichés, no invented statistics, no fake testimonials.`;

async function callDemoModel(messages: Array<{ role: string; content: string }>): Promise<SiteSpec | null> {
  if (!MODELS.openrouterApiKey) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MODELS.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.demo,
        messages,
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error('[selfserve demo] model call failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const jsonText = raw.replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '').trim();
    const parsed = SpecSchema.safeParse(JSON.parse(jsonText));
    return parsed.success ? (parsed.data as SiteSpec) : null;
  } catch (e) {
    console.error('[selfserve demo] model error', e);
    return null;
  }
}

export async function generateDemoSpec(businessDescription: string): Promise<SiteSpec> {
  const fromModel = await callDemoModel([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Business description:\n${businessDescription}` },
  ]);
  return fromModel ?? mockSpecFromDescription(businessDescription);
}

export async function refineDemoSpec(
  businessDescription: string,
  current: SiteSpec,
  prompt: string,
): Promise<SiteSpec> {
  const fromModel = await callDemoModel([
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `Business description:\n${businessDescription}\n\nCurrent demo JSON:\n${JSON.stringify(current)}\n\nApply this refinement and return the full updated JSON: ${prompt}`,
    },
  ]);
  return fromModel ?? applyMockRefinement(current, prompt);
}
