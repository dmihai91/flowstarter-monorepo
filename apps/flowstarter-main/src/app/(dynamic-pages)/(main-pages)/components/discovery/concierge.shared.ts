/**
 * The concierge stage: one conversation, two panes.
 *
 * Everything in this file is pure, because it is the part of the stage that
 * has to be true rather than merely pretty:
 *
 *   - which agent owns which pipeline phase, so a phase message can be signed
 *     by the specialist the landing page already promised;
 *   - what the visitor is actually being offered — a preview of the full site,
 *     a 20% deposit to have it built, the balance on completion — and the real
 *     figures for the tier they confirmed.
 *
 * The deposit percentage is not written down here. `depositAmountMinor` is the
 * same function the deposit Checkout and the unlock page charge against, so a
 * change to the split cannot leave this sentence quoting the old one.
 */
import {
  balanceAmountMinor,
  depositAmountMinor,
} from '@flowstarter/agentic-codegen/src/flowstarter/state-machine';
import { TIER_SETUP_FROM, type Tier } from './discovery.logic';

/* ─────────────────────────── Who did what ──────────────────────────────── */

/**
 * The pipeline's phase strings are written by the server and shown verbatim.
 * This only decides whose name goes above one. Order matters: first match
 * wins, and the default is the builder, which is the agent that runs for most
 * of the wall clock.
 *
 * Role names are the landing page's own (`landing-copy.ts` → `team.agents`),
 * so the visitor meets the same team twice rather than two casts.
 */
const PHASE_OWNERS: ReadonlyArray<{ match: RegExp; agent: string }> = [
  { match: /voice and visual direction|hero image/i, agent: 'Brand analyst' },
  { match: /starting design/i, agent: 'Design matcher' },
  { match: /voice and honesty/i, agent: 'Honesty editor' },
  { match: /checking|reviewing|repairing/i, agent: 'Build checker' },
];

const DEFAULT_AGENT = 'Site builder';

/** The specialist that owns a phase. Never invents the phase text itself. */
export function agentForPhase(phase: string): string {
  const owner = PHASE_OWNERS.find((candidate) => candidate.match.test(phase));
  return owner ? owner.agent : DEFAULT_AGENT;
}

/* ─────────────────────────── What it costs ─────────────────────────────── */

export interface DepositQuote {
  tier: Tier;
  /** Published setup fee, e.g. "€799". */
  setupLabel: string;
  /** 20% of it, e.g. "€159.80". */
  depositLabel: string;
  /** The rest, e.g. "€639.20". */
  balanceLabel: string;
  /** Custom is quoted "from" — the final figure is agreed, not published. */
  fromPrice: boolean;
}

function formatEur(minor: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/**
 * The tier's published setup fee in minor units.
 *
 * `TIER_SETUP_FROM` is display text with a thousands separator ("€1,199"), so
 * every non-digit goes before it is read — otherwise €1,199 parses as €1.20.
 * Same reasoning as `quoteMinorForTier` in lib/flowstarter/claim.ts, which is
 * the server-side twin of this number.
 */
export function setupMinorForTier(tier: Tier): number | null {
  const label = TIER_SETUP_FROM[tier];
  if (!label) return null;
  const digits = label.replace(/[^0-9.]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

/** The full offer for a confirmed tier, or null when no tier is confirmed. */
export function depositQuote(tier: Tier | '' | undefined): DepositQuote | null {
  if (!tier || !(tier in TIER_SETUP_FROM)) return null;
  const setupMinor = setupMinorForTier(tier as Tier);
  if (setupMinor === null) return null;
  return {
    tier: tier as Tier,
    setupLabel: TIER_SETUP_FROM[tier as Tier],
    depositLabel: formatEur(depositAmountMinor(setupMinor)),
    balanceLabel: formatEur(balanceAmountMinor(setupMinor)),
    fromPrice: tier === 'custom',
  };
}

/**
 * Said before the build starts, so nobody watches four minutes of generation
 * believing they are watching their finished site arrive.
 */
export function previewMeaningMessage(quote: DepositQuote | null): string {
  const what =
    'What you are about to watch is a preview of your full site — one real, ' +
    'working page, built from your answers, so you can judge the direction ' +
    'before you spend anything.';
  if (!quote) {
    return `${what} To have the complete site built you pay a 20% deposit, and the balance is due only when it is finished.`;
  }
  const from = quote.fromPrice ? 'starts at ' : '';
  return (
    `${what} To have the complete site built you pay a 20% deposit of ` +
    `${quote.depositLabel}, and the ${quote.balanceLabel} balance is due only ` +
    `when it is finished. That is ${from}${quote.setupLabel} for the build.`
  );
}

/** Said again once the preview is on screen, next to the CTA. */
export function previewReadyMessage(quote: DepositQuote | null): string {
  const what =
    'That is your preview — a page of your full site, not the whole site.';
  if (!quote) {
    return `${what} To have the rest built, you pay the 20% deposit now and the balance only once it is finished and you have approved it.`;
  }
  const caveat = quote.fromPrice
    ? ' Custom builds start there; we agree the exact figure with you before anything is charged.'
    : '';
  return (
    `${what} To have the rest built, the 20% deposit is ${quote.depositLabel}, ` +
    `and the ${quote.balanceLabel} balance is due only once it is finished and ` +
    `you have approved it.${caveat}`
  );
}

/** The primary button under that message. */
export function depositCtaLabel(quote: DepositQuote | null): string {
  return quote
    ? `Reserve my full site — pay the ${quote.depositLabel} deposit`
    : 'Reserve my full site — pay the 20% deposit';
}

/** The quieter way out, always offered next to it. */
export const KEEP_EXPLORING_LABEL = 'Not yet — keep exploring the preview';
