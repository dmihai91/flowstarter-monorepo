/**
 * Project Name Helpers
 *
 * Pure functions extracted from useProjectNameHandlers and projectNameAgent
 * for testability. These handle:
 * - Name confirmation detection
 * - Name extraction from user input patterns
 * - Banned word filtering
 * - Conversation history tracking
 * - Description context resolution
 */

// ─── Banned Words ────────────────────────────────────────────────────────────

const BANNED_WORDS_ARRAY = [
  'Thrive', 'Flourish', 'Vitality', 'Nourish', 'Elevate', 'Empower', 'Transform',
  'Inspire', 'Aspire', 'Radiant', 'Vibrant', 'Wellness', 'Journey', 'Path',
  'Peak', 'Summit', 'Rise', 'Glow', 'Bloom', 'Spark', 'Ignite', 'Unleash',
  'Sterling', 'Prime', 'Edge', 'Apex', 'Pinnacle', 'Premier', 'Elite', 'Optimal',
  'Strategic', 'Dynamic', 'Synergy', 'Leverage', 'Impact', 'Momentum', 'Catalyst',
  'Arrow', 'Compass', 'Beacon', 'Bridge', 'Gateway', 'Pathway', 'Launchpad',
];

/**
 * Check if a name contains any banned corporate/motivational words.
 */
export function containsBannedWord(name: string): boolean {
  const lowerName = name.toLowerCase();
  return BANNED_WORDS_ARRAY.some(word => lowerName.includes(word.toLowerCase()));
}

/**
 * Get which banned word is in the name (for diagnostics).
 */
export function getBannedWord(name: string): string | null {
  const lowerName = name.toLowerCase();
  return BANNED_WORDS_ARRAY.find(word => lowerName.includes(word.toLowerCase())) || null;
}

// ─── Confirmation Detection ──────────────────────────────────────────────────

const CONFIRMATION_WORDS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'perfect', 'great', 'good'];
const CONFIRMATION_PHRASES = [
  'that works', 'sounds good', 'sounds great', 'i like it', 'love it', 'that one',
  "let's go with that", "use it", "use this", "use that",
];

/**
 * Determine if user input is confirming a previously suggested name.
 */
export function isConfirmation(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return (
    CONFIRMATION_WORDS.some(word => lower === word || lower.startsWith(word + ' ') || lower.startsWith(word + ',') || lower.startsWith(word + '!')) ||
    CONFIRMATION_PHRASES.some(phrase => lower.includes(phrase))
  );
}

// ─── Name Extraction Patterns ────────────────────────────────────────────────

const EXTRACTION_PATTERNS: RegExp[] = [
  /^(?:let'?s?\s+)?call\s+it\s+["']?(.+?)["']?\s*$/i,
  /^(?:let'?s?\s+)?name\s+it\s+["']?(.+?)["']?\s*$/i,
  /^(?:let'?s?\s+)?go\s+with\s+["']?(.+?)["']?\s*$/i,
  /^how\s+about\s+["']?(.+?)["']?\s*$/i,
  /^i'?(?:ll|'d\s+like\s+to)?\s+(?:call|name)\s+it\s+["']?(.+?)["']?\s*$/i,
  /^(?:the\s+)?name\s+(?:is|should\s+be|will\s+be)\s+["']?(.+?)["']?\s*$/i,
  /^use\s+["']?(.+?)["']?\s*$/i,
  /^["'](.+?)["']\s*$/,  // Just quoted text
];

/**
 * Try to extract a project name from user input using common patterns.
 * Returns null if no pattern matches.
 */
export function extractNameFromPatterns(input: string): string | null {
  const trimmed = input.trim();

  for (const pattern of EXTRACTION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// ─── Refinement Detection ────────────────────────────────────────────────────

const REFINEMENT_KEYWORDS = [
  'make it', 'more', 'different', 'try another', 'suggest',
  'shorter', 'punchy', 'professional', 'creative', 'unique',
  'impactful', 'warmer', 'friendlier', 'bolder',
];

/**
 * Determine if user input is a refinement request (not a name itself).
 */
export function isRefinementRequest(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return REFINEMENT_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Description Context ─────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Resolve the best context string for name generation.
 * Priority: explicit description > flowHook description > first user message from history.
 */
export function resolveDescriptionContext(
  explicitDescription: string | undefined,
  flowDescription: string | undefined,
  messages: ChatMessage[],
): string {
  // 1. Use explicit description if available
  if (explicitDescription && explicitDescription.trim().length > 0) {
    return explicitDescription;
  }

  // 2. Use flow description if available
  if (flowDescription && flowDescription.trim().length > 0) {
    return flowDescription;
  }

  // 3. Fallback to first user message that isn't "suggest a name"
  const firstUserMessage = messages.find(
    (m) => m.role === 'user' && !m.content.toLowerCase().includes('suggest a name'),
  );

  if (firstUserMessage) {
    return firstUserMessage.content;
  }

  return '';
}

// ─── Name History ────────────────────────────────────────────────────────────

/**
 * Add a name to the suggestion history, avoiding duplicates.
 */
export function addToHistory(history: string[], name: string): string[] {
  if (history.includes(name)) return history;
  return [...history, name];
}

/**
 * Check if a name has already been suggested.
 */
export function wasAlreadySuggested(history: string[], name: string): boolean {
  return history.includes(name);
}

// ─── Name Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize a name string for use as a project name.
 * Removes excess whitespace, quotes, and truncates if too long.
 */
export function sanitizeName(input: string): string {
  let name = input.trim()
    .replace(/^[\"']|[\"']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (name.length > 50) {
    name = name.substring(0, 50).trim();
  }

  return name;
}

