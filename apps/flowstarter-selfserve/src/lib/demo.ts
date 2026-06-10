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

const SITE_SYSTEM = `You are Dash, Flowstarter's site agent. From a business description, produce a COMPLETE, polished single-file website draft.

Output format — exactly this, nothing else:
Line 1: an HTML comment containing the brand spec JSON:
<!--SPEC{"brand":{"name":string,"tagline":string,"palette":[primaryHex,secondaryHex,inkHex,paperHex],"voice":[2-3 adjectives]},"copy":{"hero":string,"sub":string,"cta":string,"sections":[{"h":string,"p":string} x3]},"positioning":string}SPEC-->
Then: a complete <!DOCTYPE html> document.

Page rules:
- Single file: all CSS inline in one <style> tag. NO JavaScript, NO external assets, NO web fonts (system font stack), NO images (use CSS gradients/shapes for visuals).
- Structure: nav (brand + CTA), hero (kicker, headline, subcopy, CTA button, decorative visual), three feature sections, an about/why strip, contact/booking section with a mailto CTA, footer.
- Bespoke to THIS business: concrete copy in its voice, palette that fits the trade. Mobile-responsive, readable contrast, generous whitespace.
- Never invent statistics, testimonials, awards, or client names. Mark unknown details (address, hours, prices) as e.g. "123 Your Street" placeholders sparingly.`;

function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
}

async function callSiteModel(messages: Array<{ role: string; content: string }>): Promise<{ spec: SiteSpec; html: string } | null> {
  if (!MODELS.openrouterApiKey) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MODELS.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODELS.demo, messages, temperature: 0.7, max_tokens: 10_000 }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      console.error('[selfserve demo-site] model call failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const specMatch = raw.match(/<!--SPEC([\s\S]*?)SPEC-->/);
    const htmlStart = raw.indexOf('<!DOCTYPE');
    if (!specMatch || htmlStart < 0) {
      console.warn('[selfserve demo-site] missing SPEC comment or doctype — falling back');
      return null;
    }
    // Lenient parse: the agent's spec only feeds our own UI; normalize rather than reject.
    let spec: SiteSpec;
    try {
      const rawSpec = JSON.parse(specMatch[1]) as SiteSpec;
      spec = {
        brand: {
          name: String(rawSpec.brand?.name ?? '').slice(0, 60) || 'Your business',
          tagline: String(rawSpec.brand?.tagline ?? '').slice(0, 120),
          palette: (Array.isArray(rawSpec.brand?.palette) && rawSpec.brand.palette.length >= 4
            ? (rawSpec.brand.palette.slice(0, 4) as SiteSpec['brand']['palette'])
            : ['#4D5DD9', '#9DB0F2', '#1D2030', '#F4F4F8']),
          voice: (rawSpec.brand?.voice ?? []).map(String).slice(0, 3),
        },
        copy: {
          hero: String(rawSpec.copy?.hero ?? '').slice(0, 160),
          sub: String(rawSpec.copy?.sub ?? '').slice(0, 400),
          cta: String(rawSpec.copy?.cta ?? 'Get in touch').slice(0, 60),
          sections: (rawSpec.copy?.sections ?? [])
            .slice(0, 3)
            .map((x) => ({ h: String(x?.h ?? '').slice(0, 90), p: String(x?.p ?? '').slice(0, 300) })),
        },
        positioning: String(rawSpec.positioning ?? '').slice(0, 160),
      };
      while (spec.copy.sections.length < 3) spec.copy.sections.push({ h: '', p: '' });
    } catch (e) {
      console.warn('[selfserve demo-site] spec JSON invalid — falling back', e);
      return null;
    }
    let html = raw.slice(htmlStart).trim();
    html = html.replace(/```\s*$/m, '').trim(); // tolerate trailing code fence
    if (!/<\/html>\s*$/i.test(html)) {
      console.warn('[selfserve demo-site] page truncated (no </html>) — falling back');
      return null;
    }
    return { spec, html: stripScripts(html) };
  } catch (e) {
    console.error('[selfserve demo-site] model error', e);
    return null;
  }
}

/** Agent-built demo page from the prompt; template fallback when keyless. */
export async function generateDemoSite(
  businessDescription: string,
): Promise<{ spec: SiteSpec; html: string; agentBuilt: boolean }> {
  const fromModel = await callSiteModel([
    { role: 'system', content: SITE_SYSTEM },
    { role: 'user', content: `Business description:\n${businessDescription}` },
  ]);
  if (fromModel) return { ...fromModel, agentBuilt: true };
  const spec = await generateDemoSpec(businessDescription);
  const { renderSiteHtml } = await import('@flowstarter/build-engine');
  return { spec, html: renderSiteHtml(spec), agentBuilt: false };
}

/** Refinement that regenerates the actual page, not just the spec. */
export async function refineDemoSite(
  businessDescription: string,
  currentSpec: SiteSpec,
  currentHtml: string | null,
  prompt: string,
): Promise<{ spec: SiteSpec; html: string }> {
  const fromModel = await callSiteModel([
    { role: 'system', content: SITE_SYSTEM },
    {
      role: 'user',
      content: `Business description:\n${businessDescription}\n\nCurrent spec JSON:\n${JSON.stringify(currentSpec)}\n\nCurrent page (may be truncated):\n${(currentHtml ?? '').slice(0, 12_000)}\n\nApply this refinement and return the full updated output (spec comment + complete page): ${prompt}`,
    },
  ]);
  if (fromModel) return fromModel;
  const spec = await refineDemoSpec(businessDescription, currentSpec, prompt);
  const { renderSiteHtml } = await import('@flowstarter/build-engine');
  return { spec, html: renderSiteHtml(spec) };
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
