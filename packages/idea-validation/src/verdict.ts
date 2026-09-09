/**
 * The structured idea-validation verdict — the "report card" the loop produces.
 * Modeled on ask-sage's consultation/verdict shape, repointed to a business
 * idea (PMF, competitors, market size, go/no-go).
 *
 * This file is the schema + the evidence-floor clamp. The clamp is the single
 * most important trust mechanism: `verdict` and `confidence` are CAPPED by the
 * strength of the corroborated evidence, so the model cannot ship a confident
 * "strong go" on a number that only one source reported. The loop's synthesis
 * node (next increment) fills these fields; this module guarantees they can't
 * over-claim.
 */

import { type Confidence, type CorroboratedFact, hasValue } from './records';

/** Headline tier. */
export type Verdict = 'strong_go' | 'go' | 'proceed_with_caution' | 'pivot' | 'no_go';

/** Next action — distinct from the tier ("high confidence / no_go" is real). */
export type Recommendation = 'build' | 'pivot' | 'kill' | 'research_more';

export interface ScorecardRow {
  criterion: string;
  score: number; // 0-100
  note: string;
}

export interface MarketSize {
  tam: number | null;
  sam: number | null;
  som: number | null;
  unit: string;
  basis: string;
}

export interface Competitor {
  name: string;
  url?: string;
  /** Source-backed metric rows only (pricing/funding/positioning). */
  metrics: Array<{ key: string; value: string }>;
}

export interface SourceRef {
  title: string;
  url: string;
  /** Per-claim corroboration confidence, surfaced so thin evidence is visible. */
  confidence?: Confidence;
  nSources?: number;
}

export interface BusinessIdeaVerdict {
  idea: string;
  verdict: Verdict;
  recommendation: Recommendation;
  confidence: number; // 0-100
  pmfScore: number; // 0-100
  scorecard: ScorecardRow[];
  marketSize: MarketSize | null;
  competitors: Competitor[];
  keyFactors: string[];
  risks: string[];
  /** Adjacent niches — the "never end on no" path for a kill verdict. */
  alternatives: string[];
  sources: SourceRef[];
}

const TIER_ORDER: Verdict[] = ['no_go', 'pivot', 'proceed_with_caution', 'go', 'strong_go'];

function tierRank(v: Verdict): number {
  const i = TIER_ORDER.indexOf(v);
  return i < 0 ? 0 : i;
}

function capTier(v: Verdict, ceiling: Verdict): Verdict {
  return tierRank(v) > tierRank(ceiling) ? ceiling : v;
}

/**
 * Evidence-floor clamp. A `strong_go`/`go` requires at least one supporting
 * metric corroborated (or a defensible range) from enough independent sources;
 * otherwise the tier is mechanically capped at `proceed_with_caution`, and with
 * no usable evidence at all, at `research_more`/`pivot`. Confidence is likewise
 * pulled down to the evidence. This runs AFTER the model proposes a verdict — it
 * can only lower a claim, never raise it.
 */
export function clampVerdictToEvidence(
  verdict: BusinessIdeaVerdict,
  facts: readonly CorroboratedFact[],
): BusinessIdeaVerdict {
  const usable = facts.filter(hasValue);
  const strong = usable.filter((f) => f.status === 'corroborated' || f.status === 'range_only');

  let ceiling: Verdict = 'strong_go';
  let confidenceCap = 100;

  if (usable.length === 0) {
    // No evidence at all: cannot recommend building.
    return {
      ...verdict,
      verdict: capTier(verdict.verdict, 'pivot'),
      recommendation: verdict.recommendation === 'build' ? 'research_more' : verdict.recommendation,
      confidence: Math.min(verdict.confidence, 30),
    };
  }

  if (strong.length === 0) {
    ceiling = 'proceed_with_caution';
    confidenceCap = 55;
  }

  const capped = capTier(verdict.verdict, ceiling);
  return {
    ...verdict,
    verdict: capped,
    recommendation:
      capped === 'no_go' || capped === 'pivot'
        ? verdict.recommendation === 'build'
          ? 'research_more'
          : verdict.recommendation
        : verdict.recommendation,
    confidence: Math.min(verdict.confidence, confidenceCap),
  };
}
