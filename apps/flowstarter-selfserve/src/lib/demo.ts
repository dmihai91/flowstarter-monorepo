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
  DISPLAY_FONTS,
  BODY_FONTS,
  type TemplateFill,
  type StyleFill,
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
"hero":{"kicker":string(<=38 chars, the positioning angle),"title":string(<=58 chars, punchy, works in HUGE uppercase type),"text":string(1-2 sentences, <=200 chars),"highlight":string(a short phrase copied VERBATIM from text),"cta1":string(<=22 chars action),"cta2":string(<=24 chars secondary)},
"positioning":string(<=90 chars, the ONE line that separates this business from everyone else, quotable),
"offer":{"name":string(<=40 chars, the signature offer),"description":string(<=220 chars, concrete: what happens, for whom, how),"includes":[4 x string(<=70 chars, tangible things the client gets)],"note":string(<=40 chars, a true low-risk hook from the description, e.g. "First chat is free", NEVER invented discounts)},
"audience":[3 x string(<=110 chars, "you..." statements that make the right client feel seen)],
"stats":[{"number":string(<=8 chars),"label":string(<=26 chars)} x4],
"process": OPTIONAL {"title":string(<=36),"steps":[{"title":string(<=28),"text":string(<=120)} x3]}, include ONLY when the work has a clear start-to-finish flow worth showing,
"faq": OPTIONAL [{"q":string(<=64, a real hesitation this trade's customers have),"a":string(<=180, honest answer)} x3], include ONLY when customers typically hesitate or compare,
"services":{"label":string(<=20 chars),"titleLine1":string(<=18 chars),"titleLine2":string(<=18 chars),"items":[{"title":string(<=30 chars),"description":string(<=140 chars)} x6]},
"about":{"label":string,"title":string(<=60 chars),"p1":string(<=240 chars),"p2":string(<=240 chars)},
"cta":{"title":string(<=48 chars),"text":string(<=160 chars),"button":string(<=24 chars)},
"contact":{"heading":string(<=40 chars),"text":string(<=160 chars),"email":string(plausible address on the business's own domain)},
"style":{"fontDisplay":one of ${JSON.stringify([...DISPLAY_FONTS])},"fontBody":one of ${JSON.stringify([...BODY_FONTS])},"hero":"dark"|"light"|"gradient"|"split","caseStyle":"uppercase"|"normal","radius":"sharp"|"soft"|"round","paper":"#hex near-white tint","dark":"#hex near-black, may lean toward the brand","visual":"blob"|"arch"|"rings"|"tiles","image":one of ["barber","beauty","cafe","restaurant","bakery","florist","fitness","craft","retail","coaching","wellness","photography","auto","outdoor","generic"], the closest match to the trade,"layout":"classic"|"offer-first"|"story"|"proof-first", the order that sells THIS business: offer-first when one signature package is the whole pitch, story when the person and trust matter most, proof-first when hard facts impress, classic otherwise}}

Every page should feel structured for its business, not assembled from the same checklist: vary the layout, include process/faq only when they earn their place.

You are the POSITIONING STRATEGIST and ART DIRECTOR, not just a copywriter. The page must make the offer feel inevitable: the positioning line is the spine, the signature offer makes it concrete, the audience section makes the right visitor feel seen.

 The template is your structure; the style block is where you make it unmistakably THIS business. Design a combination that feels premium and would impress a paying client:
- a tasteful but characterful font pairing (serif display for crafted/warm trades, grotesque for modern/technical ones),
- a hero treatment and visual motif that match the trade's energy (dark = bold/premium, light = airy/calm, gradient = energetic, split = editorial),
- tinted surfaces (paper/dark) that carry the brand instead of defaults.
Avoid the obvious default (dark + uppercase + blob) unless it truly fits best.

Rules:
- Respond with ONLY the JSON object. No prose, no code fences.
- Every word bespoke to THIS business, in its voice. Use its real name if given.
- stats: ONLY facts present in the description (counts, hours, formats like "1:1") or qualities of the offer. NEVER invent client numbers, years, ratings or percentages.
- No invented testimonials, awards or statistics anywhere.
- No em dashes anywhere in the copy; use commas, periods or colons.
- primary: a saturated MID-brightness color (must read as a button on white AND near-black; never navy/near-black). accent: a LIGHT pastel companion (must read as text on near-black).`;

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '').trim();
}

function normalizeFill(raw: unknown): TemplateFill | null {
  try {
    const r = raw as TemplateFill;
    const str = (v: unknown, max: number, fb = '') => {
      const s = String(v ?? fb)
        .replace(/\s*[—–]\s*/g, ', ') // voice rules: no em/en dashes
        .replace(/,\s*,/g, ',')
        .trim();
      if (s.length <= max) return s;
      // over budget: cut on a word boundary so we never ship half a word,
      // and drop an orphaned comma/conjunction left at the cut
      const cut = s.slice(0, max);
      const atWord = cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
      return atWord.replace(/[,;:\s]+$/, '').replace(/\s(and|or|with|that|the|a|to|of|in|for)$/i, '');
    };
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
        kicker: str(r.hero?.kicker, 44),
        title: str(r.hero?.title, 70),
        text: str(r.hero?.text, 260),
        highlight: str(r.hero?.highlight, 80),
        cta1: str(r.hero?.cta1, 26, 'Get in touch'),
        cta2: str(r.hero?.cta2, 28, 'Learn more'),
      },
      positioning: str(r.positioning, 110),
      offer: {
        name: str(r.offer?.name, 48),
        description: str(r.offer?.description, 260),
        includes: (r.offer?.includes ?? []).map((x) => str(x, 80)).filter(Boolean).slice(0, 4),
        note: str(r.offer?.note, 48),
      },
      audience: (r.audience ?? []).map((x) => str(x, 130)).filter(Boolean).slice(0, 3),
      stats: (r.stats ?? []).slice(0, 4).map((x) => ({ number: str(x?.number, 10), label: str(x?.label, 30) })),
      process: r.process?.steps?.length
        ? {
            title: str(r.process.title, 40, 'How it works'),
            steps: r.process.steps
              .slice(0, 4)
              .map((x) => ({ title: str(x?.title, 30), text: str(x?.text, 130) }))
              .filter((x) => x.title),
          }
        : undefined,
      faq: (r.faq ?? [])
        .slice(0, 4)
        .map((x) => ({ q: str(x?.q, 70), a: str(x?.a, 200) }))
        .filter((x) => x.q && x.a),
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
      style: (r as { style?: StyleFill }).style,
    };
    if (!fill.hero.title || !fill.hero.text || fill.services.items.length < 3) return null;
    if (!fill.positioning) fill.positioning = fill.brand.tagline;
    if (!fill.hero.kicker) fill.hero.kicker = fill.brand.tagline;
    if (!fill.offer.name) {
      fill.offer = {
        name: fill.services.items[0]?.title ?? 'How we work',
        description: fill.services.items[0]?.description ?? fill.hero.text,
        includes: fill.services.items.slice(0, 4).map((i) => i.title),
        note: 'No obligation to start',
      };
    }
    while (fill.offer.includes.length < 4) fill.offer.includes.push(fill.services.items[fill.offer.includes.length]?.title ?? 'Personal attention, start to finish');
    while (fill.audience.length < 3) fill.audience.push('You want this done properly, by someone who cares.');
    while (fill.stats.length < 4) fill.stats.push({ number: '1:1', label: 'Personal service' });
    while (fill.services.items.length < 6) {
      fill.services.items.push({ title: 'Made for you', description: 'Shaped around how you actually work.' });
    }
    return fill;
  } catch {
    return null;
  }
}

/** Real progress stages emitted while the agent works (and consumed by the funnel feed). */
export type DemoStage = (stage: string, detail?: string) => void;

/** One small model call → content fill. Fast, cheap, no layout risk.
 *  With onStage, the call streams and emits milestones as the agent's JSON
 *  actually arrives — this is what the funnel's crew feed shows. */
async function callFillModel(
  messages: Array<{ role: string; content: string }>,
  onStage?: DemoStage,
): Promise<TemplateFill | null> {
  if (!MODELS.openrouterApiKey) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MODELS.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODELS.demo, messages, temperature: 0.7, max_tokens: 2_500, stream: Boolean(onStage) }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      console.error('[selfserve demo-fill] model call failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    let raw = '';
    if (onStage && res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      const fired = new Set<string>();
      const fire = (k: string, detail?: string) => {
        if (fired.has(k)) return;
        fired.add(k);
        onStage(k, detail);
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          const m = line.match(/^data: (.+)$/);
          if (!m || m[1] === '[DONE]') continue;
          try {
            const delta = (JSON.parse(m[1]) as { choices?: Array<{ delta?: { content?: string } }> }).choices?.[0]?.delta?.content;
            if (delta) raw += delta;
          } catch {}
        }
        if (raw.includes('"brand"')) fire('brand');
        const name = raw.match(/"name"\s*:\s*"([^"]{2,60})"/);
        if (name) fire('name', name[1]);
        if (raw.includes('"offer"')) fire('positioning');
        if (raw.includes('"services"')) fire('copy');
        if (raw.includes('"style"')) fire('style');
      }
    } else {
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      raw = data.choices?.[0]?.message?.content ?? '';
    }
    if (!raw) return null;
    const fill = normalizeFill(JSON.parse(cleanJson(raw)));
    if (!fill) console.warn('[selfserve demo-fill] fill JSON unusable — falling back');
    return fill;
  } catch (e) {
    console.error('[selfserve demo-fill] model error', e);
    return null;
  }
}

type DemoSite = { spec: SiteSpec; html: string; agentBuilt: boolean };

// Cost control: identical descriptions reuse the cached generation (the
// landing example chips, double-clicks and retries cost nothing).
function demoCache(): Map<string, DemoSite> {
  const g = globalThis as { __selfserveDemoCache?: Map<string, DemoSite> };
  g.__selfserveDemoCache ??= new Map();
  return g.__selfserveDemoCache;
}

/** Agent fills the house template (dorin-portfolio elements); design is ours,
 *  so quality is constant. Keyless fallback maps the mock spec onto the same
 *  template — even the fallback looks like the house design. */
/** Deterministic per-description style nudge so directions don't converge. */
function directionSeed(description: string): string {
  let h = 0;
  for (const c of description) h = (h * 31 + c.charCodeAt(0)) | 0;
  const heroes = ['dark', 'light', 'gradient', 'split'] as const;
  const visuals = ['blob', 'arch', 'rings', 'tiles'] as const;
  const cases = ['uppercase', 'normal'] as const;
  const layouts = ['classic', 'offer-first', 'story', 'proof-first'] as const;
  return `Suggested starting direction (depart from it if it doesn't fit this business): hero="${heroes[Math.abs(h) % 4]}", visual="${visuals[Math.abs(h >> 2) % 4]}", caseStyle="${cases[Math.abs(h >> 4) % 2]}", layout="${layouts[Math.abs(h >> 6) % 4]}".`;
}

/** Cache lookup without generating — lets the API skip rate-limit charges for free cache hits. */
export function peekDemoCache(businessDescription: string): DemoSite | undefined {
  const hit = demoCache().get(businessDescription.trim().toLowerCase());
  return hit?.agentBuilt ? hit : undefined;
}

export async function generateDemoSite(
  businessDescription: string,
  onStage?: DemoStage,
): Promise<DemoSite & { cached?: boolean }> {
  const cacheKey = businessDescription.trim().toLowerCase();
  const cached = demoCache().get(cacheKey);
  if (cached?.agentBuilt) {
    onStage?.('cached', cached.spec.brand.name);
    return { ...cached, cached: true };
  }
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    { role: 'user', content: `Business description:\n${businessDescription}\n\n${directionSeed(businessDescription)}` },
  ];
  onStage?.('start');
  let fill = await callFillModel(messages, onStage);
  if (!fill && MODELS.openrouterApiKey) {
    console.warn('[selfserve demo-fill] first attempt failed — retrying once');
    onStage?.('retry');
    fill = await callFillModel(messages, onStage);
  }
  if (fill) {
    onStage?.('render');
    const out: DemoSite = { spec: fillToSpec(fill), html: renderTemplate(fill), agentBuilt: true };
    const cache = demoCache();
    cache.set(cacheKey, out);
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    return out;
  }
  onStage?.('fallback');
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
