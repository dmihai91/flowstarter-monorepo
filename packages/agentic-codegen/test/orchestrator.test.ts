import { describe, it, expect } from 'vitest';
import {
  orchestrateGeneration,
  orchestrateEdit,
  parseJsonLoose,
} from '../src/orchestrator';
import { topLevelKeys } from '../src/yaml-blocks';
import type { DiscoverySpec } from '../src/spec';
import {
  FIXTURE,
  FIXTURE_KEYS,
  makeGenerate,
  counts,
  personalizeWave,
  personalizeEdit,
} from './helpers';

const SPEC: DiscoverySpec = {
  businessName: 'Acme Studio',
  industry: 'Design',
  description: 'A small product design studio.',
  targetAudience: 'Startups',
  goal: 'leads',
  brandTone: 'bold',
};

const GOOD_PLAN = JSON.stringify({
  templateId: 'creative-portfolio',
  angle: 'Sharp product design for startups.',
  sectionBriefs: { hero: 'Lead with outcomes.' },
});
const PASS = JSON.stringify({ passed: true, score: 5, weakSections: [], notes: '' });

describe('parseJsonLoose', () => {
  it('parses fenced JSON', () => {
    expect(parseJsonLoose<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('parses JSON with surrounding prose', () => {
    expect(parseJsonLoose<{ a: number }>('Sure! {"a":2} done')).toEqual({ a: 2 });
  });
  it('returns null on garbage', () => {
    expect(parseJsonLoose('no json here')).toBeNull();
  });
});

describe('orchestrateGeneration — happy path', () => {
  it('plans, runs both waves, critiques, and personalizes the file', async () => {
    const { fn, calls } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: personalizeWave,
      critique: () => PASS,
    });
    const waveEvents: string[] = [];
    const r = await orchestrateGeneration(SPEC, FIXTURE, {
      generate: fn,
      onWave: (e) => {
        waveEvents.push(e.waveId);
      },
    });

    expect(r.ok).toBe(true);
    expect(r.content).not.toBe(FIXTURE);
    expect(topLevelKeys(r.content)).toEqual(FIXTURE_KEYS); // key set + order unchanged
    expect(r.plan?.templateId).toBe('creative-portfolio');
    expect(r.critique?.passed).toBe(true);
    expect(waveEvents).toEqual(['above-fold', 'rest']); // streamed in order
    const c = counts(calls);
    expect(c).toMatchObject({ plan: 1, implementer: 2, critique: 1 });
    // cost + usage aggregated across Sonnet (brain) and Kimi (implementer)
    expect(r.costUsd).toBeCloseTo(0.004); // 1 plan + 2 waves + 1 critique
    expect(Object.keys(r.usageByModel).sort()).toEqual([
      'anthropic/claude-sonnet-4',
      'moonshotai/kimi-k2.6',
    ]);
    expect(r.usageByModel['moonshotai/kimi-k2.6']!.outputTokens).toBe(100); // 2 waves × 50
  });

  it('streams partial content that is always structurally valid', async () => {
    const { fn } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: personalizeWave,
      critique: () => PASS,
    });
    await orchestrateGeneration(SPEC, FIXTURE, {
      generate: fn,
      onWave: (e) => {
        // every emitted wave is the full file with all keys intact
        expect(topLevelKeys(e.content)).toEqual(FIXTURE_KEYS);
      },
    });
  });
});

describe('orchestrateGeneration — planner fail-open', () => {
  it('proceeds with null plan when the planner returns junk', async () => {
    const { fn } = makeGenerate({
      plan: () => 'not json at all',
      implementer: personalizeWave,
      critique: () => PASS,
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.plan).toBeNull();
    expect(r.ok).toBe(true); // waves still ran
  });

  it('proceeds when the planner call errors', async () => {
    const { fn } = makeGenerate({
      plan: () => ({ ok: false, error: 'timeout' }),
      implementer: personalizeWave,
      critique: () => PASS,
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.plan).toBeNull();
    expect(r.ok).toBe(true);
  });
});

describe('orchestrateGeneration — worker fail-open', () => {
  it('keeps a wave as template when the implementer returns nothing, applies the other', async () => {
    let call = 0;
    const { fn } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: (input) => (call++ === 0 ? { ok: false, error: 'timeout' } : personalizeWave(input)),
      critique: () => PASS,
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.waves.map((w) => w.ok)).toEqual([false, true]);
    expect(r.ok).toBe(true); // second wave personalized something
  });

  it('rejects a wave that drops structure', async () => {
    const { fn } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: () => 'hero:\n  title: "x"', // missing the other above-fold keys + too short
      critique: () => PASS,
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.waves.every((w) => !w.ok)).toBe(true);
    expect(r.ok).toBe(false); // nothing applied → fail open to base
    expect(r.content.trim()).toBe(FIXTURE.trim());
  });

  it('never throws and falls open when every call fails', async () => {
    const { fn } = makeGenerate({
      plan: () => ({ ok: false, error: 'timeout' }),
      implementer: () => ({ ok: false, error: 'timeout' }),
      critique: () => ({ ok: false, error: 'timeout' }),
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.ok).toBe(false);
    expect(r.content.trim()).toBe(FIXTURE.trim());
  });
});

describe('orchestrateGeneration — critique + bounded revision', () => {
  it('runs exactly one revision when the critic fails with weak sections', async () => {
    const { fn, calls } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: personalizeWave,
      critique: () => JSON.stringify({ passed: false, score: 2, weakSections: ['hero'], notes: 'too generic' }),
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn, maxRevisions: 1 });
    const c = counts(calls);
    expect(c.implementer).toBe(3); // 2 waves + 1 revision
    expect(c.critique).toBe(1);
    expect(r.attempts).toBe(3);
  });

  it('does not revise when weakSections are empty', async () => {
    const { fn, calls } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: personalizeWave,
      critique: () => JSON.stringify({ passed: false, score: 2, weakSections: [], notes: 'meh' }),
    });
    await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(counts(calls).implementer).toBe(2); // no revision
  });

  it('accepts the result when the critic itself errors (never blocks)', async () => {
    const { fn, calls } = makeGenerate({
      plan: () => GOOD_PLAN,
      implementer: personalizeWave,
      critique: () => ({ ok: false, error: 'timeout' }),
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn });
    expect(r.ok).toBe(true);
    expect(r.critique).toBeNull();
    expect(counts(calls).implementer).toBe(2); // no revision triggered
  });
});

describe('orchestrateGeneration — lite / budget degrade', () => {
  it('makes zero brain calls and a single implementer pass', async () => {
    const { fn, calls } = makeGenerate({
      plan: () => GOOD_PLAN, // should never be called
      implementer: personalizeWave,
      critique: () => PASS, // should never be called
    });
    const r = await orchestrateGeneration(SPEC, FIXTURE, { generate: fn, lite: true });
    const c = counts(calls);
    expect(c.plan).toBe(0);
    expect(c.critique).toBe(0);
    expect(c.implementer).toBe(1); // one pass over the whole file
    expect(r.ok).toBe(true);
    expect(r.plan).toBeNull();
  });
});

describe('orchestrateEdit', () => {
  it('applies a change and accepts when the snappy critic is happy', async () => {
    const { fn, calls } = makeGenerate({
      implementer: personalizeEdit,
      fast: () => JSON.stringify({ applied: true, intact: true }),
    });
    const r = await orchestrateEdit(FIXTURE, 'make the hero punchier', { generate: fn });
    expect(r.ok).toBe(true);
    expect(r.changed).toBe(true);
    expect(topLevelKeys(r.content!)).toEqual(FIXTURE_KEYS);
    expect(counts(calls)).toMatchObject({ implementer: 1, fast: 1 });
  });

  it('retries once when the implementer first returns broken output', async () => {
    let call = 0;
    const { fn, calls } = makeGenerate({
      implementer: (input) => (call++ === 0 ? 'broken' : personalizeEdit(input)),
      fast: () => JSON.stringify({ applied: true, intact: true }),
    });
    const r = await orchestrateEdit(FIXTURE, 'tweak copy', { generate: fn, maxRetries: 1 });
    expect(r.ok).toBe(true);
    expect(counts(calls).implementer).toBe(2);
  });

  it('fails open (no throw) when the implementer never produces valid output', async () => {
    const { fn } = makeGenerate({
      implementer: () => 'broken',
      fast: () => JSON.stringify({ applied: true, intact: true }),
    });
    const r = await orchestrateEdit(FIXTURE, 'x', { generate: fn, maxRetries: 1 });
    expect(r.ok).toBe(false);
    expect(r.content).toBeUndefined();
  });

  it('accepts a structurally-valid result when the critic is unavailable', async () => {
    const { fn } = makeGenerate({
      implementer: personalizeEdit,
      fast: () => ({ ok: false, error: 'timeout' }),
    });
    const r = await orchestrateEdit(FIXTURE, 'x', { generate: fn });
    expect(r.ok).toBe(true); // fail-open: don't block on the critic
  });
});
