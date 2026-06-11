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
import {
  renderTemplate,
  parseFillFromHtml,
  fillToSpec,
  fillFromSpec,
  type TemplateFill,
} from './site-template';

export const SpecSchema = z.object({
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

// ---------------------------------------------------------------------------
// Full demo SITE generation — the agent writes a real bespoke page from the
// prompt (single shot, cheap demo model). The page is only ever shown as a
// blurred sneak peek until the build is paid.
// ---------------------------------------------------------------------------

const FILL_SYSTEM = `You are the content agent for Flowstarter's house site template. From a business description, produce ONLY a JSON object filling the template's content slots:

{"brand":{"name":string,"tagline":string(<=70 chars),"primary":"#hex saturated, fits the trade","accent":"#hex soft pastel companion","voice":[3 adjectives]},
"hero":{"title":string(<=58 chars, punchy, works in HUGE uppercase type),"text":string(1-2 sentences, <=200 chars),"highlight":string(a short phrase copied VERBATIM from text),"cta1":string(<=22 chars action),"cta2":string(<=24 chars secondary)},
"stats":[{"number":string(<=8 chars),"label":string(<=26 chars)} x4],
"services":{"label":string(<=20 chars),"titleLine1":string(<=18 chars),"titleLine2":string(<=18 chars),"items":[{"title":string(<=30 chars),"description":string(<=140 chars)} x6]},
"about":{"label":string,"title":string(<=60 chars),"p1":string(<=240 chars),"p2":string(<=240 chars)},
"cta":{"title":string(<=48 chars),"text":string(<=160 chars),"button":string(<=24 chars)},
"contact":{"heading":string(<=40 chars),"text":string(<=160 chars),"email":string(plausible address on the business's own domain)}}

Rules:
- Respond with ONLY the JSON object. No prose, no code fences.
- Every word bespoke to THIS business, in its voice. Use its real name if given.
- stats: ONLY facts present in the description (counts, hours, formats like "1:1") or qualities of the offer. NEVER invent client numbers, years, ratings or percentages.
- No invented testimonials, awards or statistics anywhere.`;

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '').trim();
}

function normalizeFill(raw: unknown): TemplateFill | null {
  try {
    const r = raw as TemplateFill;
    const str = (v: unknown, max: number, fb = '') => String(v ?? fb).slice(0, max);
    const hex = (v: unknown, fb: string) => (/^#[0-9a-fA-F]{3,8}$/.test(String(v ?? '')) ? String(v) : fb);
    const fill: TemplateFill = {
      brand: {
        name: str(r.brand?.name, 60) || 'Your business',
        tagline: str(r.brand?.tagline, 90),
        primary: hex(r.brand?.primary, '#3D4FF0'),
        accent: hex(r.brand?.accent, '#B3B6FF'),
        voice: (r.brand?.voice ?? []).map((v) => str(v, 20)).slice(0, 3),
      },
      hero: {
        title: str(r.hero?.title, 70),
        text: str(r.hero?.text, 260),
        highlight: str(r.hero?.highlight, 80),
        cta1: str(r.hero?.cta1, 26, 'Get in touch'),
        cta2: str(r.hero?.cta2, 28, 'Learn more'),
      },
      stats: (r.stats ?? []).slice(0, 4).map((x) => ({ number: str(x?.number, 10), label: str(x?.label, 30) })),
      services: {
        label: str(r.services?.label, 24, 'What we do'),
        titleLine1: str(r.services?.titleLine1, 22),
        titleLine2: str(r.services?.titleLine2, 22),
        items: (r.services?.items ?? [])
          .slice(0, 6)
          .map((x) => ({ title: str(x?.title, 36), description: str(x?.description, 170) })),
      },
      about: {
        label: str(r.about?.label, 24, 'About'),
        title: str(r.about?.title, 70),
        p1: str(r.about?.p1, 280),
        p2: str(r.about?.p2, 280),
      },
      cta: {
        title: str(r.cta?.title, 56),
        text: str(r.cta?.text, 190),
        button: str(r.cta?.button, 26, 'Get in touch'),
      },
      contact: {
        heading: str(r.contact?.heading, 46, 'Let\u2019s talk'),
        text: str(r.contact?.text, 190),
        email: str(r.contact?.email, 80, 'hello@example.com'),
      },
    };
    if (!fill.hero.title || !fill.hero.text || fill.services.items.length < 3) return null;
    while (fill.stats.length < 4) fill.stats.push({ number: '1:1', label: 'Personal service' });
    while (fill.services.items.length < 6) {
      fill.services.items.push({ title: 'Made for you', description: 'Shaped around how you actually work.' });
    }
    return fill;
  } catch {
    return null;
  }
}

/** One small model call → content fill. Fast, cheap, no layout risk. */
async function callFillModel(messages: Array<{ role: string; content: string }>): Promise<TemplateFill | null> {
  if (!MODELS.openrouterApiKey) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MODELS.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODELS.demo, messages, temperature: 0.7, max_tokens: 2_500 }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error('[selfserve demo-fill] model call failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const fill = normalizeFill(JSON.parse(cleanJson(raw)));
    if (!fill) console.warn('[selfserve demo-fill] fill JSON unusable — falling back');
    return fill;
  } catch (e) {
    console.error('[selfserve demo-fill] model error', e);
    return null;
  }
}

/** Agent fills the house template (dorin-portfolio elements); design is ours,
 *  so quality is constant. Keyless fallback maps the mock spec onto the same
 *  template — even the fallback looks like the house design. */
export async function generateDemoSite(
  businessDescription: string,
): Promise<{ spec: SiteSpec; html: string; agentBuilt: boolean }> {
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    { role: 'user', content: `Business description:\n${businessDescription}` },
  ];
  let fill = await callFillModel(messages);
  if (!fill && MODELS.openrouterApiKey) {
    console.warn('[selfserve demo-fill] first attempt failed — retrying once');
    fill = await callFillModel(messages);
  }
  if (fill) {
    return { spec: fillToSpec(fill), html: renderTemplate(fill), agentBuilt: true };
  }
  const spec = await generateDemoSpec(businessDescription);
  const fallback = fillFromSpec(spec);
  return { spec, html: renderTemplate(fallback), agentBuilt: false };
}

/** Refinement edits the fill (recovered from the page) and re-renders. */
export async function refineDemoSite(
  businessDescription: string,
  currentSpec: SiteSpec,
  currentHtml: string | null,
  prompt: string,
): Promise<{ spec: SiteSpec; html: string }> {
  const currentFill = (currentHtml && parseFillFromHtml(currentHtml)) || fillFromSpec(currentSpec);
  const fill = await callFillModel([
    { role: 'system', content: FILL_SYSTEM },
    {
      role: 'user',
      content: `Business description:\n${businessDescription}\n\nCurrent content JSON:\n${JSON.stringify(currentFill)}\n\nApply this change and return the FULL updated JSON (all slots, not just the changed ones): ${prompt}`,
    },
  ]);
  if (fill) return { spec: fillToSpec(fill), html: renderTemplate(fill) };
  const spec = await refineDemoSpec(businessDescription, currentSpec, prompt);
  return { spec, html: renderTemplate(fillFromSpec(spec)) };
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
