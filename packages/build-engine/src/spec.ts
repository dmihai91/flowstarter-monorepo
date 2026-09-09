// Deterministic mock SiteSpec generation. Used by the mock engine and as the
// no-API-key fallback for demo generation. Keyword-flavored like the design
// prototype's funnel so common demo inputs feel tailored.
import type { SiteSpec } from './types';

interface Flavor {
  match: RegExp;
  spec: SiteSpec;
}

const FLAVORS: Flavor[] = [
  {
    match: /potter|ceramic|clay|kiln/i,
    spec: {
      brand: {
        name: 'Mudroom',
        tagline: 'Drop in. Get your hands dirty.',
        palette: ['#C2683F', '#E8B07A', '#3C3A34', '#F2EBDD'],
        voice: ['Warm', 'Unfussy', 'A little cheeky'],
      },
      copy: {
        hero: 'Make something with your hands this Saturday.',
        sub: 'No course. No commitment. Drop into a beginner pottery class, bring a friend, and leave with something you made.',
        cta: 'Book a drop-in',
        sections: [
          { h: 'Zero experience required', p: 'Every class starts from nothing. If you can squish clay, you’re qualified.' },
          { h: 'Pay for one Saturday', p: 'No 6-week packages. Book a single drop-in and see if it’s your thing.' },
          { h: 'Bring your people', p: 'Bring a friend or a date. The kiln does the rest.' },
        ],
      },
      positioning: 'A Saturday, not a 6-week course.',
    },
  },
  {
    match: /barber|salon|hair|cuts/i,
    spec: {
      brand: {
        name: 'Northside Cuts',
        tagline: 'Walk in. Walk out sharp.',
        palette: ['#3E5C8A', '#9FB6D9', '#1E2430', '#F2F0EA'],
        voice: ['Confident', 'Local', 'No-nonsense'],
      },
      copy: {
        hero: 'A proper cut, without the wait.',
        sub: 'Two chairs, real barbers, walk-ins welcome. Book a slot or just come by — either way you leave sharp.',
        cta: 'Book a chair',
        sections: [
          { h: 'Fades, trims, the works', p: 'Classic cuts to skin fades, plus beard work that actually follows your jawline.' },
          { h: 'Book or walk in', p: 'Reserve a chair online or take your chances — we keep walk-in slots open every day.' },
          { h: 'Your neighborhood shop', p: 'Same two barbers every week. We remember your cut so you don’t have to explain it.' },
        ],
      },
      positioning: 'The neighborhood shop that respects your time.',
    },
  },
  {
    match: /bak|sourdough|bread|pastr|cafe|coffee/i,
    spec: {
      brand: {
        name: 'Fernwood Bakery',
        tagline: 'Baked before sunrise.',
        palette: ['#E0922E', '#F2C98A', '#3A3128', '#FAF4E8'],
        voice: ['Honest', 'Crafty', 'Neighborly'],
      },
      copy: {
        hero: 'Real bread, from a real oven, around the corner.',
        sub: 'Naturally leavened loaves and pastries baked every morning. Pre-order online and skip the line.',
        cta: 'Pre-order a loaf',
        sections: [
          { h: 'Slow fermentation', p: '36 hours from flour to crust. No shortcuts, no additives, just time.' },
          { h: 'Order ahead', p: 'Reserve your loaf the night before — it’s waiting for you by 8am.' },
          { h: 'Wholesale too', p: 'Cafés and restaurants: standing orders with morning delivery.' },
        ],
      },
      positioning: 'The bakery your street has been missing.',
    },
  },
];

const GENERIC: SiteSpec = {
  brand: {
    name: 'Brightside',
    tagline: 'Your business, properly online.',
    palette: ['#4D5DD9', '#9DB0F2', '#1D2030', '#F4F4F8'],
    voice: ['Clear', 'Trustworthy', 'Direct'],
  },
  copy: {
    hero: 'Everything your customers need, one page away.',
    sub: 'What you do, why you’re good at it, and how to reach you — presented clearly, working on every device.',
    cta: 'Get in touch',
    sections: [
      { h: 'What you offer', p: 'Your services explained in plain language, so the right customers know they’re in the right place.' },
      { h: 'Why people choose you', p: 'The experience and care behind your work, front and center.' },
      { h: 'Easy to reach', p: 'Contact, hours and location — one tap away on any phone.' },
    ],
  },
  positioning: 'Clarity over noise.',
};

/** Derive a plausible business name from the description (very rough — mock only). */
function inventName(desc: string): string | null {
  const m = desc.match(/(?:called|named)\s+["']?([A-Z][\w&' -]{2,28})["']?/i);
  return m ? m[1].trim() : null;
}

export function mockSpecFromDescription(description: string): SiteSpec {
  const flavor = FLAVORS.find((f) => f.match.test(description));
  const base = structuredClone(flavor ? flavor.spec : GENERIC);
  const name = inventName(description);
  if (name) base.brand.name = name;
  return base;
}

/** Deterministic mock refinement — nudges the spec so refinement UX is testable offline. */
export function applyMockRefinement(spec: SiteSpec, prompt: string): SiteSpec {
  const next = structuredClone(spec);
  if (/darker|bold/i.test(prompt)) {
    next.brand.palette = ['#22263B', next.brand.palette[0], '#EDEDF2', '#14161F'];
    next.brand.voice = ['Bold', ...next.brand.voice.slice(0, 2)];
  } else if (/warm|friendly|playful/i.test(prompt)) {
    next.brand.palette = ['#E0846A', '#F2C24C', '#3A3128', '#FBF4EA'];
    next.brand.voice = ['Friendly', ...next.brand.voice.slice(0, 2)];
  } else if (/short|punchy|simpler/i.test(prompt)) {
    next.copy.hero = next.copy.hero.split(/[,.]/)[0] + '.';
    next.copy.sub = next.copy.sub.split('.')[0] + '.';
  } else {
    next.copy.hero = `${next.copy.hero.replace(/\.$/, '')} — done your way.`;
  }
  return next;
}
