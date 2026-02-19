/**
 * Base prompt components shared across all categories
 */

// Words that feel corporate, motivational, or startup-y - never use them
export const BANNED_WORDS_ARRAY = [
  // Corporate wellness/motivation
  'Thrive', 'Flourish', 'Vitality', 'Nourish', 'Elevate', 'Empower', 'Transform',
  'Inspire', 'Aspire', 'Radiant', 'Vibrant', 'Wellness', 'Journey', 'Path',
  'Peak', 'Summit', 'Rise', 'Glow', 'Bloom', 'Spark', 'Ignite', 'Unleash',
  // Cold/corporate
  'Sterling', 'Prime', 'Edge', 'Apex', 'Pinnacle', 'Premier', 'Elite', 'Optimal',
  'Strategic', 'Dynamic', 'Synergy', 'Leverage', 'Impact', 'Momentum', 'Catalyst',
  // Generic action words
  'Arrow', 'Compass', 'Beacon', 'Bridge', 'Gateway', 'Pathway', 'Launchpad',
];

export const BANNED_WORDS = BANNED_WORDS_ARRAY.join(', ');

export const BANNED_PATTERNS = [
  'Generic suffixes: Studio, Solutions, Services, Group, Co, Labs, Hub, Pro, Plus, Works',
  'Compound startup words (GrowthHub, MindFlow, LifeForge)',
  'Tech patterns: -ify, -ly, -io, -able',
].join('; ');

/**
 * Check if a name contains any banned words
 */
export function containsBannedWord(name: string): boolean {
  const lowerName = name.toLowerCase();
  return BANNED_WORDS_ARRAY.some(word => lowerName.includes(word.toLowerCase()));
}

/**
 * Get which banned word is in the name (for logging)
 */
export function getBannedWord(name: string): string | null {
  const lowerName = name.toLowerCase();
  return BANNED_WORDS_ARRAY.find(word => lowerName.includes(word.toLowerCase())) || null;
}

/**
 * Base rules that apply to ALL name generation
 */
export const BASE_RULES = `
RULES (apply to ALL names):
- 1-3 words maximum
- Title case (e.g., "The Practice", "Iron Hour")
- No punctuation except & when natural (e.g., "Salt & Stone")
- Must sound professional when spoken aloud
- Must be memorable after hearing once

BANNED WORDS (never use): ${BANNED_WORDS}

ALSO AVOID:
- Generic herb names (Sage, Rosemary, Fern, Willow)
- Overused nature clichés (Horizon, Journey, Path)
- Real surnames as business names (Bennett, Crawford, Quinn)
- "[Industry] + generic suffix" patterns (FitPro, HealthPlus, CoachHub)
`;

/**
 * Output format instructions
 */
export const OUTPUT_FORMAT = `
Respond with ONLY 3 names, one per line. No numbering, no explanations.
`;

export const OUTPUT_FORMAT_SINGLE = `
Respond with ONLY: {"name": "YourNewName"}
`;
