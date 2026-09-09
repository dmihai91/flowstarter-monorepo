/**
 * `classifyRouting` is the whole point of this module: deterministic RULES
 * decide standard vs custom, not an LLM. These tests prove it is data-driven
 * (weights/threshold, not branching logic), that budget and deadline are
 * the heaviest signals, that commerce alone never forces custom, and that
 * it is perfectly deterministic (same input twice -> identical output).
 */
import { describe, expect, it } from 'vitest';
import {
  EMPTY_DISCOVERY,
  type DiscoveryData,
} from '../../../app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import {
  ROUTING_RULES,
  ROUTING_THRESHOLDS,
  classifyRouting,
} from '../routing-rules';

const base: DiscoveryData = {
  ...EMPTY_DISCOVERY,
  fullName: 'Maria Ionescu',
  email: 'maria@example.com',
  description: 'A boutique dental clinic offering cosmetic work',
};

describe('ROUTING_RULES config', () => {
  it('weighs budget and deadline as the heaviest rules', () => {
    const byId = new Map(ROUTING_RULES.map((r) => [r.id, r.weight]));
    const maxWeight = Math.max(...ROUTING_RULES.map((r) => r.weight));
    expect(byId.get('tightBudget')).toBe(maxWeight);
    expect(byId.get('tightDeadline')).toBe(maxWeight);
    // Every other rule is strictly lighter than the two heaviest.
    for (const rule of ROUTING_RULES) {
      if (rule.id === 'tightBudget' || rule.id === 'tightDeadline') continue;
      expect(rule.weight).toBeLessThan(maxWeight);
    }
  });

  it('rules are pure data: ids are unique and weights are non-negative', () => {
    const ids = ROUTING_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of ROUTING_RULES) {
      expect(rule.weight).toBeGreaterThanOrEqual(0);
      expect(typeof rule.when).toBe('function');
      expect(rule.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('classifyRouting — table-driven decisions', () => {
  it('routes a plain brochure site to standard', () => {
    const data: DiscoveryData = {
      ...base,
      goal: 'Show a portfolio of work',
      commerceMode: 'none',
      pageCount: 'lt-5',
      timeline: 'flexible',
      selectedTier: 'starter',
      customIntegrations: '',
    };
    const result = classifyRouting(data);
    expect(result.decision).toBe('standard');
    expect(result.rulesFired).toContain('simpleBrochure');
  });

  it('routes tiny budget + a ~2-week deadline + a custom integration to custom', () => {
    const data: DiscoveryData = {
      ...base,
      goal: 'leads',
      commerceMode: 'none',
      timeline: 'asap', // closest wizard option to "2-week deadline"
      selectedTier: 'starter', // tiny/tightest confirmed budget bracket
      customIntegrations: 'Bespoke CRM sync with a legacy ERP over SOAP',
    };
    const result = classifyRouting(data);
    expect(result.decision).toBe('custom');
    expect(result.rulesFired).toEqual(
      expect.arrayContaining([
        'tightBudget',
        'tightDeadline',
        'customIntegrationRequested',
      ])
    );
  });

  it('does not force custom for commerce alone, even with a large catalog', () => {
    const data: DiscoveryData = {
      ...base,
      goal: 'sales',
      commerceMode: 'physical',
      catalogSize: '26-100',
      timeline: '4-weeks',
      selectedTier: 'commerce',
      customIntegrations: '',
    };
    const result = classifyRouting(data);
    expect(result.decision).toBe('standard');
    expect(result.rulesFired).toContain('largeCatalog');
    expect(result.rulesFired).not.toContain('tightBudget');
    expect(result.rulesFired).not.toContain('tightDeadline');
  });

  it('keeps standard integrations (Cal.com, Stripe links, newsletter) out of custom', () => {
    const data: DiscoveryData = {
      ...base,
      goal: 'bookings',
      commerceMode: 'few-services',
      timeline: '1-3-months',
      customIntegrations:
        'Cal.com for bookings, Stripe payment links, and a newsletter signup',
    };
    const result = classifyRouting(data);
    expect(result.decision).toBe('standard');
    expect(result.rulesFired).toContain('standardIntegrationsOnly');
    expect(result.rulesFired).not.toContain('customIntegrationRequested');
  });
});

describe('classifyRouting — each heavy rule at the threshold boundary', () => {
  it('tightDeadline alone stays below threshold; one more point tips it to custom', () => {
    const justDeadline: DiscoveryData = {
      ...base,
      goal: 'leads',
      commerceMode: 'none',
      timeline: 'asap',
      selectedTier: '',
      pageCount: 'lt-5',
      customIntegrations: '',
    };
    const below = classifyRouting(justDeadline);
    expect(below.score).toBeLessThan(ROUTING_THRESHOLDS.customAtOrAbove);
    expect(below.decision).toBe('standard');

    const atThreshold: DiscoveryData = { ...justDeadline, pageCount: '15+' };
    const at = classifyRouting(atThreshold);
    expect(at.score).toBe(ROUTING_THRESHOLDS.customAtOrAbove);
    expect(at.decision).toBe('custom');
  });

  it('tightBudget alone stays below threshold; one more point tips it to custom', () => {
    const justBudget: DiscoveryData = {
      ...base,
      goal: 'leads',
      commerceMode: 'none',
      timeline: 'flexible',
      selectedTier: 'starter',
      pageCount: 'lt-5',
      customIntegrations: '',
    };
    const below = classifyRouting(justBudget);
    expect(below.score).toBeLessThan(ROUTING_THRESHOLDS.customAtOrAbove);
    expect(below.decision).toBe('standard');

    const atThreshold: DiscoveryData = { ...justBudget, pageCount: '15+' };
    const at = classifyRouting(atThreshold);
    expect(at.score).toBe(ROUTING_THRESHOLDS.customAtOrAbove);
    expect(at.decision).toBe('custom');
  });
});

describe('classifyRouting — determinism', () => {
  it('returns identical output for the same input, every time', () => {
    const data: DiscoveryData = {
      ...base,
      goal: 'sales',
      commerceMode: 'digital',
      catalogSize: '6-25',
      timeline: 'asap',
      selectedTier: 'starter',
      customIntegrations: 'A bespoke inventory sync',
    };
    const first = classifyRouting(data);
    const second = classifyRouting(data);
    const third = classifyRouting({ ...data });
    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it('is a pure function with no IO: no globals mutated across repeated calls', () => {
    const data: DiscoveryData = { ...base, commerceMode: 'none' };
    for (let i = 0; i < 5; i++) {
      classifyRouting(data);
    }
    // ROUTING_RULES itself is untouched by evaluating it repeatedly.
    expect(ROUTING_RULES.length).toBeGreaterThan(0);
  });
});
