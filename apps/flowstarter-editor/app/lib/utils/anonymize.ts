/**
 * Anonymize user queries for logging
 * Removes PII while preserving query intent for analytics
 */

// Patterns to detect and redact
const PII_PATTERNS = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, replacement: '[EMAIL]' },
  
  // Phone numbers (various international formats)
  { pattern: /\b(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, replacement: '[PHONE]' },
  
  // URLs and domains
  { pattern: /https?:\/\/[^\s]+/gi, replacement: '[URL]' },
  { pattern: /\b(www\.)?[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|uk|de|fr|app|dev|ai)\b/gi, replacement: '[DOMAIN]' },
  
  // Social media handles
  { pattern: /@[a-zA-Z0-9_]{1,50}\b/g, replacement: '[SOCIAL_HANDLE]' },
  
  // Credit card numbers
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD]' },
  { pattern: /\b\d{15,16}\b/g, replacement: '[CARD]' },
  
  // SSN / National ID (US, UK NI, etc.)
  { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: '[ID_NUMBER]' },
  { pattern: /\b[A-Z]{2}\s?\d{6}\s?[A-Z]\b/gi, replacement: '[ID_NUMBER]' },
  
  // Passport numbers
  { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, replacement: '[PASSPORT]' },
  
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP]' },
  
  // Dates (various formats) - could be DOB
  { pattern: /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g, replacement: '[DATE]' },
  { pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, replacement: '[DATE]' },
  
  // Street addresses
  { pattern: /\b\d{1,5}\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir)\b\.?/gi, replacement: '[ADDRESS]' },
  
  // Postal/ZIP codes
  { pattern: /\b\d{5}(-\d{4})?\b/g, replacement: '[ZIP]' }, // US
  { pattern: /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/gi, replacement: '[POSTCODE]' }, // UK
  
  // Bank account / routing numbers
  { pattern: /\b\d{8,17}\b/g, replacement: '[ACCOUNT]' },
  
  // Age patterns
  { pattern: /\b(I am|I'm|aged?)\s+\d{1,3}\s*(years?(\s+old)?|yo)?\b/gi, replacement: '$1 [AGE]' },
];

// Name-related patterns (applied after main patterns)
const NAME_PATTERNS = [
  // "My name is X" / "I'm X" / "Call me X"
  { pattern: /\b(my name is|i'm|i am|call me|this is|name:)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/gi, replacement: '$1 [NAME]' },
  
  // "I, John Smith, ..."
  { pattern: /\bI,\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),/gi, replacement: 'I, [NAME],' },
  
  // Contact patterns: "reach me at", "contact X at"
  { pattern: /\b(contact|reach|email|call)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(at|on)\b/gi, replacement: '$1 [NAME] $3' },
  
  // Signatures: "Thanks, John" / "Best, John Smith"
  { pattern: /\b(thanks|thank you|regards|best|sincerely|cheers),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/gim, replacement: '$1, [NAME]' },
  
  // "X's business/company" patterns
  { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(business|company|shop|store|studio|clinic|practice|website|site|brand)/gi, replacement: "[OWNER]'s $2" },
  
  // Company legal suffixes
  { pattern: /\b([A-Z][a-zA-Z\s&]+)\s+(LLC|Inc|Corp|Ltd|Co|GmbH|Pty|PLC|SA|AG)\b\.?/g, replacement: '[COMPANY] $2' },
  
  // "for X" where X is a business
  { pattern: /\b(for|about)\s+([A-Z][a-zA-Z\s&]{2,30})\s+(business|company|brand|shop|studio|clinic)\b/gi, replacement: '$1 [BUSINESS] $3' },
];

/**
 * Anonymize a user query string
 * Removes PII while preserving query intent for analytics
 * 
 * @param query The raw user input
 * @param maxLength Maximum length to return (truncates if exceeded)
 * @returns Anonymized query safe for logging
 */
export function anonymizeQuery(query: string, maxLength: number = 500): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  let result = query;
  
  // Apply main PII pattern replacements
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  // Apply name-related patterns
  for (const { pattern, replacement } of NAME_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  // Clean up multiple consecutive placeholders
  result = result.replace(/(\[[A-Z_]+\])\s*\1+/g, '$1');
  
  // Clean up any remaining potential names at start of sentences (capitalized words)
  // Only if they look like names (2-15 chars, followed by common verbs)
  result = result.replace(/\b([A-Z][a-z]{1,14})\s+(is|was|has|had|will|would|can|could|wants?|needs?|said|asked)\b/g, '[NAME] $2');
  
  // Truncate if too long
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...';
  }
  
  return result.trim();
}

/**
 * Create a query fingerprint for deduplication/grouping
 * Returns a normalized, lowercase version without specific values
 */
export function createQueryFingerprint(query: string): string {
  if (!query) return '';
  
  // First anonymize, then create fingerprint
  const anonymized = anonymizeQuery(query, 200);
  
  return anonymized
    .toLowerCase()
    .replace(/\[[a-z_]+\]/g, '[X]') // Normalize all placeholders
    .replace(/\d+/g, '#') // Replace remaining numbers with #
    .replace(/[^\w\s#\[\]]/g, '') // Remove punctuation except brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100);
}

/**
 * Check if a string contains potential PII
 * Useful for validation/warnings
 */
export function containsPII(text: string): boolean {
  if (!text) return false;
  
  const original = text;
  const anonymized = anonymizeQuery(text, text.length + 100);
  
  // If anonymization changed the text, it contained PII
  return original !== anonymized;
}

/**
 * Get list of PII types found in text
 */
export function detectPIITypes(text: string): string[] {
  if (!text) return [];
  
  const types: Set<string> = new Set();
  
  // Check each pattern
  for (const { pattern, replacement } of PII_PATTERNS) {
    if (pattern.test(text)) {
      const type = replacement.replace(/[\[\]]/g, '');
      types.add(type);
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
  }
  
  for (const { pattern, replacement } of NAME_PATTERNS) {
    if (pattern.test(text)) {
      types.add('NAME');
    }
    pattern.lastIndex = 0;
  }
  
  return Array.from(types);
}
