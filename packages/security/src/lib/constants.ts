/**
 * @fileoverview Security constants and configuration values.
 * @module @flowstarter/security/constants
 */

import { BlockedCategory, Severity } from './types.js';

/**
 * Detailed descriptions for each blocked category.
 */
export const BLOCKED_CATEGORIES: Record<
  BlockedCategory,
  { name: string; description: string; examples: string[] }
> = {
  [BlockedCategory.PHISHING]: {
    name: 'Phishing',
    description: 'Fake login pages, credential harvesting, and identity theft attempts',
    examples: ['Fake PayPal login', 'Bank credential forms', 'SSN collection'],
  },
  [BlockedCategory.SCAM]: {
    name: 'Scam',
    description: 'Financial fraud, fake investments, advance fee scams',
    examples: ['Nigerian prince emails', 'Fake lotteries', 'Romance scams'],
  },
  [BlockedCategory.DRUGS]: {
    name: 'Drugs',
    description: 'Illegal drug sales, manufacturing instructions, or promotion',
    examples: ['Drug marketplaces', 'Synthesis guides', 'Coded drug terminology'],
  },
  [BlockedCategory.WEAPONS]: {
    name: 'Weapons',
    description: 'Illegal weapon sales, 3D-printed guns, explosives',
    examples: ['Gun sales', 'Explosive recipes', 'Weapon modifications'],
  },
  [BlockedCategory.GAMBLING]: {
    name: 'Gambling',
    description: 'Unlicensed gambling operations, betting sites',
    examples: ['Underground casinos', 'Sports betting', 'Crypto gambling'],
  },
  [BlockedCategory.ADULT]: {
    name: 'Adult/Escort',
    description: 'Escort services, adult content marketplaces',
    examples: ['Escort listings', 'Adult services', 'Suggestive ads'],
  },
  [BlockedCategory.TERRORISM]: {
    name: 'Terrorism',
    description: 'Terrorist content, extremist recruitment, violent extremism',
    examples: ['Propaganda', 'Recruitment', 'Attack planning'],
  },
  [BlockedCategory.COUNTERFEIT]: {
    name: 'Counterfeit',
    description: 'Fake documents, currency, luxury goods',
    examples: ['Fake IDs', 'Counterfeit currency', 'Replica goods'],
  },
  [BlockedCategory.MALWARE]: {
    name: 'Malware',
    description: 'Viruses, trojans, ransomware, hacking tools',
    examples: ['Keyloggers', 'RATs', 'Exploit kits'],
  },
  [BlockedCategory.BRAND_IMPERSONATION]: {
    name: 'Brand Impersonation',
    description: 'Fake brand websites, lookalike domains, trademark abuse',
    examples: ['paypa1.com', 'amaz0n.com', 'Fake tech support'],
  },
  [BlockedCategory.PROMPT_INJECTION]: {
    name: 'Prompt Injection',
    description: 'Attempts to manipulate AI behavior through crafted inputs',
    examples: ['Ignore previous instructions', 'System prompt extraction', 'Jailbreaks'],
  },
};

/**
 * Security weights for scoring different categories.
 * Higher weight = more severe when detected.
 */
export const SECURITY_WEIGHTS: Record<BlockedCategory, number> = {
  [BlockedCategory.PHISHING]: 0.95,
  [BlockedCategory.SCAM]: 0.85,
  [BlockedCategory.DRUGS]: 0.9,
  [BlockedCategory.WEAPONS]: 0.95,
  [BlockedCategory.GAMBLING]: 0.6,
  [BlockedCategory.ADULT]: 0.7,
  [BlockedCategory.TERRORISM]: 1.0,
  [BlockedCategory.COUNTERFEIT]: 0.85,
  [BlockedCategory.MALWARE]: 1.0,
  [BlockedCategory.BRAND_IMPERSONATION]: 0.9,
  [BlockedCategory.PROMPT_INJECTION]: 0.95,
};

/**
 * Severity thresholds for risk scores.
 */
export const SEVERITY_THRESHOLDS: Record<Severity, number> = {
  [Severity.LOW]: 0.25,
  [Severity.MEDIUM]: 0.5,
  [Severity.HIGH]: 0.75,
  [Severity.CRITICAL]: 0.9,
};

/**
 * Common brand names to detect impersonation attempts.
 */
export const PROTECTED_BRANDS = [
  'paypal',
  'amazon',
  'apple',
  'google',
  'microsoft',
  'facebook',
  'instagram',
  'netflix',
  'spotify',
  'uber',
  'airbnb',
  'venmo',
  'cashapp',
  'zelle',
  'chase',
  'bankofamerica',
  'wellsfargo',
  'citibank',
  'stripe',
  'coinbase',
  'binance',
  'robinhood',
] as const;

/**
 * Default moderation threshold.
 */
export const DEFAULT_THRESHOLD = 0.5;

/**
 * Maximum text length to process in one moderation call.
 */
export const MAX_TEXT_LENGTH = 100_000;
