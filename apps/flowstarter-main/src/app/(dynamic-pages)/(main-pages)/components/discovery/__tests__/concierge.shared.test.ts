/**
 * The two things the concierge stage has to get right in words rather than
 * pixels: who is credited with which pipeline phase, and what the visitor is
 * told the preview costs to turn into a real site.
 *
 * The amounts are asserted literally. They are the numbers a visitor decides
 * on, so a change to the tier prices or to the deposit split should break a
 * test and be re-read, not slip out silently in a sentence.
 */
import { describe, expect, it } from 'vitest';
import {
  KEEP_EXPLORING_LABEL,
  agentForPhase,
  depositCtaLabel,
  depositQuote,
  previewMeaningMessage,
  previewReadyMessage,
  setupMinorForTier,
} from '../concierge.shared';

/** Verbatim from `workflows.ts` — the only phase strings the funnel shows. */
const SERVER_PHASES = [
  'Learning your voice and visual direction',
  'Choosing the best starting design',
  'Preparing your selected design',
  'Personalizing the site with your business',
  'Polishing voice and honesty',
  'Refining the personalization',
  'Placing your own photos',
  'Choosing the right hero image',
  'Checking the preview',
  'Repairing the preview',
  'Preparing the preview teaser',
  'Publishing your live preview',
  'Reviewing the rendered preview',
  'Repairing rendered issues',
  'Done, your site is ready',
];

/** The landing page's own roster (`landing-copy.ts` → team.agents). */
const LANDING_AGENTS = [
  'Brand analyst',
  'Design matcher',
  'Site builder',
  'Honesty editor',
  'Build checker',
];

describe('who is credited with a phase', () => {
  it('signs every real pipeline phase with an agent the landing page names', () => {
    for (const phase of SERVER_PHASES) {
      expect(LANDING_AGENTS).toContain(agentForPhase(phase));
    }
  });

  it('gives the brand, design, honesty and QA phases to their specialists', () => {
    expect(agentForPhase('Learning your voice and visual direction')).toBe(
      'Brand analyst'
    );
    expect(agentForPhase('Choosing the right hero image')).toBe(
      'Brand analyst'
    );
    expect(agentForPhase('Choosing the best starting design')).toBe(
      'Design matcher'
    );
    expect(agentForPhase('Polishing voice and honesty')).toBe('Honesty editor');
    expect(agentForPhase('Reviewing the rendered preview')).toBe(
      'Build checker'
    );
    expect(agentForPhase('Checking the preview')).toBe('Build checker');
  });

  it('falls back to the builder rather than inventing a role', () => {
    expect(agentForPhase('Personalizing the site with your business')).toBe(
      'Site builder'
    );
    expect(agentForPhase('Something the pipeline added later')).toBe(
      'Site builder'
    );
  });
});

describe('what the visitor is quoted', () => {
  it('reads the published setup fee through its thousands separator', () => {
    // "€1,199" must not parse as €1.20 — the comma is a grouping mark here.
    expect(setupMinorForTier('starter')).toBe(79_900);
    expect(setupMinorForTier('pro')).toBe(119_900);
    expect(setupMinorForTier('commerce')).toBe(149_900);
    expect(setupMinorForTier('custom')).toBe(249_900);
  });

  it('splits every tier 20/80, the same split the deposit Checkout charges', () => {
    expect(depositQuote('starter')).toMatchObject({
      setupLabel: '€799',
      depositLabel: '€159.80',
      balanceLabel: '€639.20',
      fromPrice: false,
    });
    expect(depositQuote('pro')).toMatchObject({
      depositLabel: '€239.80',
      balanceLabel: '€959.20',
    });
    expect(depositQuote('commerce')).toMatchObject({
      depositLabel: '€299.80',
      balanceLabel: '€1,199.20',
    });
    expect(depositQuote('custom')).toMatchObject({
      depositLabel: '€499.80',
      balanceLabel: '€1,999.20',
      // Custom is an open-ended scope, so its figure is a starting point.
      fromPrice: true,
    });
  });

  it('has no quote at all when no tier is confirmed', () => {
    expect(depositQuote('')).toBeNull();
    expect(depositQuote(undefined)).toBeNull();
  });
});

describe('what the visitor is told', () => {
  const starter = depositQuote('starter');

  it('says before the build that this is a preview of the full site', () => {
    const message = previewMeaningMessage(starter);
    expect(message).toMatch(/preview of your full site/i);
    expect(message).toMatch(/20% deposit of €159\.80/);
    expect(message).toMatch(/€639\.20 balance is due only when it is finished/);
  });

  it('says it again when the preview is on screen', () => {
    const message = previewReadyMessage(starter);
    expect(message).toMatch(/not the whole site/i);
    expect(message).toMatch(/20% deposit is €159\.80/);
    expect(message).toMatch(/€639\.20 balance/);
    expect(message).toMatch(/only once it is finished/i);
  });

  it('still states the terms when there is no tier to quote', () => {
    expect(previewMeaningMessage(null)).toMatch(/20% deposit/);
    expect(previewMeaningMessage(null)).toMatch(/balance is due only when/i);
    expect(previewReadyMessage(null)).toMatch(/20% deposit/);
  });

  it('marks a custom build as a starting figure, not a price', () => {
    const custom = depositQuote('custom');
    expect(previewMeaningMessage(custom)).toMatch(/starts at €2,499/);
    expect(previewReadyMessage(custom)).toMatch(
      /agree the exact figure with you before anything is charged/i
    );
  });

  it('puts the real amount on the button, and always offers the way out', () => {
    expect(depositCtaLabel(starter)).toBe(
      'Reserve my full site: pay the €159.80 deposit'
    );
    expect(depositCtaLabel(null)).toBe(
      'Reserve my full site: pay the 20% deposit'
    );
    expect(KEEP_EXPLORING_LABEL).toMatch(/keep exploring the preview/i);
  });
});
