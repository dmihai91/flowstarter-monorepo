/**
 * The sufficiency gate.
 *
 * Two properties matter more than any individual threshold. First, the codes
 * are stable: they key the message templates, the `asks` column, and later
 * calibration, so a bare intake must always produce the same set. Second, the
 * gate is deterministic — it never reaches for a model, because a hallucinated
 * "you are missing a logo" is worse than no gate at all.
 */
import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  HERO_MIN_WIDTH,
  MIN_BUSINESS_TEXT_CHARS,
  MISSING_MESSAGES,
  evaluateSufficiency,
  rankSlotsByVisibility,
  requiredImageSlots,
  type SufficiencyInput,
  type TemplateImageSlot,
} from '../sufficiency';

vi.mock('server-only', () => ({}));

/** A slice of what `listSiteImageSlots` returns for wellness-therapy. */
const SLOTS: TemplateImageSlot[] = [
  { id: 'src/content/content.md:12', section: 'blogPage', key: 'image' },
  { id: 'src/content/content.md:40', section: 'caseStudies', key: 'image' },
  { id: 'src/content/content.md:48', section: 'caseStudies', key: 'image' },
  { id: 'src/content/content.md:56', section: 'caseStudies', key: 'image' },
  { id: 'src/content/content.md:4', section: 'hero', key: 'image' },
  { id: 'src/content/content.md:70', section: 'aboutStory', key: 'image' },
  { id: 'src/content/site-labels.md:2', section: 'general', key: 'logo' },
];

const PROSE =
  'We are a two-person physiotherapy clinic in Galway that has been treating ' +
  'sports injuries and post-surgical rehabilitation since 2009. Most of our ' +
  'clients are referred by local GPs and running clubs, and we keep evening ' +
  'appointments open for people who cannot take time off work.';

function completeInput(): SufficiencyInput {
  return {
    slots: SLOTS,
    images: [
      { id: 'a', width: 2400, height: 1400 },
      { id: 'b', width: 1200, height: 900 },
      { id: 'c', width: 1000, height: 1400 },
    ],
    logo: { id: 'logo', width: 800, kind: 'logo' },
    businessText: PROSE,
    contact: { phone: '+353 91 555 0100' },
    services: ['Sports injury rehab', 'Post-surgical rehab', 'Gait analysis'],
  };
}

function codes(input: SufficiencyInput): string[] {
  return evaluateSufficiency(input).missing.map((item) => item.code);
}

describe('evaluateSufficiency — a bare intake', () => {
  const bare: SufficiencyInput = { slots: SLOTS };

  it('returns the full, stable set of codes', () => {
    expect(codes(bare)).toEqual([
      'hero_image_missing',
      'section_images_missing',
      'logo_missing',
      'business_text_thin',
      'contact_signal_missing',
      'services_missing',
    ]);
  });

  it('is not ready, because blocking gaps are outstanding', () => {
    expect(evaluateSufficiency(bare).ready).toBe(false);
  });

  it('produces byte-identical output on a second run', () => {
    expect(JSON.stringify(evaluateSufficiency(bare))).toBe(
      JSON.stringify(evaluateSufficiency(bare))
    );
  });

  it('names the sections each gap holds up', () => {
    const hero = evaluateSufficiency(bare).missing.find(
      (item) => item.code === 'hero_image_missing'
    );
    expect(hero?.affects).toEqual(['hero']);
    const sections = evaluateSufficiency(bare).missing.find(
      (item) => item.code === 'section_images_missing'
    );
    expect(sections?.affects).toEqual(['caseStudies', 'caseStudies']);
  });

  it('asks for something a client can actually go and do', () => {
    for (const item of evaluateSufficiency(bare).missing) {
      expect(item.message).toBe(MISSING_MESSAGES[item.code]);
      // Never "send us photos": each ask names a subject or a measurement.
      expect(item.message.length).toBeGreaterThan(60);
    }
  });
});

describe('evaluateSufficiency — a complete project', () => {
  it('is ready with nothing missing', () => {
    expect(evaluateSufficiency(completeInput())).toEqual({
      ready: true,
      missing: [],
    });
  });

  it('stays ready when only a degrading item is outstanding', () => {
    const result = evaluateSufficiency({ ...completeInput(), logo: null });
    expect(result.ready).toBe(true);
    expect(result.missing.map((item) => item.code)).toEqual(['logo_missing']);
  });

  it('counts a placeholder logo as no logo', () => {
    const input = completeInput();
    input.logo = { id: 'logo', width: 800, kind: 'logo', isPlaceholder: true };
    expect(codes(input)).toEqual(['logo_missing']);
  });
});

describe('evaluateSufficiency — image judgement', () => {
  it('distinguishes "no photo" from "photo too small"', () => {
    const input = completeInput();
    input.images = [{ id: 'a', width: HERO_MIN_WIDTH - 1, height: 900 }];
    expect(codes(input)).toContain('hero_image_low_resolution');
    expect(codes(input)).not.toContain('hero_image_missing');
  });

  it('refuses a portrait crop for a full-width hero', () => {
    const input = completeInput();
    input.images = [{ id: 'a', width: 2000, height: 3000 }];
    expect(codes(input)).toContain('hero_image_low_resolution');
  });

  it('trusts an explicit usable_for over the measurements', () => {
    const input = completeInput();
    input.images = [
      { id: 'a', width: 900, height: 1200, usableFor: ['hero'] },
      { id: 'b', width: 900, usableFor: ['section'] },
      { id: 'c', width: 900, usableFor: ['section'] },
    ];
    expect(codes(input)).toEqual([]);
  });

  it('never counts template artwork as the client’s own photo', () => {
    const input = completeInput();
    input.images = [
      { id: 'a', width: 2400, height: 1400, isPlaceholder: true },
      { id: 'b', width: 2400, height: 1400, isPlaceholder: true },
    ];
    expect(codes(input)).toContain('hero_image_missing');
  });

  it('does not let the hero photo double as a section photo', () => {
    const input = completeInput();
    input.images = [{ id: 'a', width: 2400, height: 1400 }];
    expect(codes(input)).toEqual(['section_images_missing']);
  });

  it('asks for at most two section images, never all 17-21 slots', () => {
    const { sections } = requiredImageSlots(SLOTS);
    expect(sections).toHaveLength(2);
    expect(sections.every((slot) => slot.section === 'caseStudies')).toBe(true);
  });

  it('ranks slots by what a visitor sees first', () => {
    expect(rankSlotsByVisibility(SLOTS).map((slot) => slot.section)).toEqual([
      'hero',
      'caseStudies',
      'caseStudies',
      'caseStudies',
      'aboutStory',
      'blogPage',
      'general',
    ]);
  });

  it('falls back to a hero plus two sections when no template is known', () => {
    const result = evaluateSufficiency({ images: [] });
    expect(result.missing.map((item) => item.code)).toContain(
      'section_images_missing'
    );
  });
});

describe('evaluateSufficiency — words, contact, services', () => {
  it('does not accept whitespace padded up to the threshold', () => {
    const padded = 'We fix bikes.'.padEnd(MIN_BUSINESS_TEXT_CHARS + 50, '\n');
    expect(codes({ ...completeInput(), businessText: padded })).toEqual([
      'business_text_thin',
    ]);
  });

  it('accepts prose spread across several answers', () => {
    const input = completeInput();
    input.businessText = [PROSE.slice(0, 120), PROSE.slice(120)];
    expect(codes(input)).toEqual([]);
  });

  it('accepts any one contact signal', () => {
    for (const contact of [
      { phone: '+353 91 555 0100' },
      { email: 'hello@clinic.ie' },
      { bookingUrl: 'https://booking.example/clinic' },
    ]) {
      expect(codes({ ...completeInput(), contact })).toEqual([]);
    }
  });

  it('treats a blank contact field as no contact at all', () => {
    const input = { ...completeInput(), contact: { phone: '   ', email: '' } };
    expect(codes(input)).toEqual(['contact_signal_missing']);
  });

  it('needs three named services, not two and a blank', () => {
    const input = { ...completeInput(), services: ['Rehab', 'Massage', '  '] };
    expect(codes(input)).toEqual(['services_missing']);
  });
});

describe('the gate never asks a model', () => {
  // Vitest runs both as `vitest --root src` and from the app root, so the
  // module is located by a marker rather than a fixed relative path — the
  // same approach as src/lib/ai/__tests__/no-unbudgeted-llm-calls.test.ts.
  function gateSource(): string {
    const cwd = process.cwd();
    for (const candidate of [
      resolve(cwd, 'lib/flowstarter/sufficiency.ts'),
      resolve(cwd, 'src/lib/flowstarter/sufficiency.ts'),
      resolve(cwd, 'apps/flowstarter-main/src/lib/flowstarter/sufficiency.ts'),
    ]) {
      if (existsSync(candidate)) return readFileSync(candidate, 'utf8');
    }
    throw new Error(`Could not locate sufficiency.ts from ${cwd}`);
  }

  it('imports nothing from the LLM entry point', () => {
    const source = gateSource();
    // The gate decides; a model only ever phrases. If this ever fails, the
    // decision has moved somewhere it cannot be reproduced or calibrated.
    expect(source).not.toMatch(/from\s+['"][^'"]*lib\/ai/);
    expect(source).not.toMatch(
      /callLlm|generateObject|generateText|streamText/
    );
    // No I/O of any kind, so the gate is trivially testable and never flaky.
    expect(source).not.toMatch(/from\s+['"]node:(fs|http|net)/);
    expect(source).not.toMatch(/\bfetch\(/);
  });

  it('does not consult the clock, so two runs a day apart agree', () => {
    const source = gateSource();
    expect(source).not.toMatch(/Date\.now\(\)|new Date\(/);
    expect(source).not.toMatch(/Math\.random\(/);
  });
});
