/**
 * Project Name Helpers — Unit Tests
 *
 * Tests the pure functions extracted from useProjectNameHandlers
 * and projectNameAgent for the naming step:
 * - Confirmation detection
 * - Name extraction from user input patterns
 * - Refinement request detection
 * - Banned word filtering
 * - Description context resolution (the stale-description fix)
 * - Name history tracking
 * - Name sanitization
 */

import { describe, it, expect } from 'vitest';
import {
  containsBannedWord,
  getBannedWord,
  isConfirmation,
  extractNameFromPatterns,
  isRefinementRequest,
  resolveDescriptionContext,
  addToHistory,
  wasAlreadySuggested,
  sanitizeName,
} from './projectNameHelpers';

// ═══════════════════════════════════════════════════════════════════════════════
// containsBannedWord / getBannedWord
// ═══════════════════════════════════════════════════════════════════════════════

describe('containsBannedWord', () => {
  it('catches corporate motivation words', () => {
    expect(containsBannedWord('Thrive Coaching')).toBe(true);
    expect(containsBannedWord('Elevate Studio')).toBe(true);
    expect(containsBannedWord('Empower Solutions')).toBe(true);
    expect(containsBannedWord('Transform Labs')).toBe(true);
  });

  it('catches cold corporate words', () => {
    expect(containsBannedWord('Sterling Group')).toBe(true);
    expect(containsBannedWord('Prime Solutions')).toBe(true);
    expect(containsBannedWord('Elite Coaching')).toBe(true);
    expect(containsBannedWord('Dynamic Strategy')).toBe(true);
  });

  it('catches overused metaphor words', () => {
    expect(containsBannedWord('The Compass')).toBe(true);
    expect(containsBannedWord('Beacon Health')).toBe(true);
    expect(containsBannedWord('Gateway Coaching')).toBe(true);
    expect(containsBannedWord('Launchpad Studio')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsBannedWord('thrive')).toBe(true);
    expect(containsBannedWord('ELEVATE')).toBe(true);
    expect(containsBannedWord('STERLING group')).toBe(true);
  });

  it('allows good warm names', () => {
    expect(containsBannedWord('Clara')).toBe(false);
    expect(containsBannedWord('Fern')).toBe(false);
    expect(containsBannedWord('Harbor')).toBe(false);
    expect(containsBannedWord('Sunday Morning')).toBe(false);
    expect(containsBannedWord('The Table')).toBe(false);
    expect(containsBannedWord('Bennett')).toBe(false);
    expect(containsBannedWord('Kinetic')).toBe(false);
  });
});

describe('getBannedWord', () => {
  it('returns the matching banned word', () => {
    expect(getBannedWord('Thrive Coaching')).toBe('Thrive');
    expect(getBannedWord('Elevate Studio')).toBe('Elevate');
  });

  it('returns null for clean names', () => {
    expect(getBannedWord('Clara')).toBeNull();
    expect(getBannedWord('Harbor View')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isConfirmation
// ═══════════════════════════════════════════════════════════════════════════════

describe('isConfirmation', () => {
  describe('recognizes confirmation words', () => {
    it.each([
      'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'perfect', 'great', 'good',
    ])('"%s" is a confirmation', (word) => {
      expect(isConfirmation(word)).toBe(true);
    });
  });

  describe('recognizes confirmation phrases', () => {
    it.each([
      'that works', 'sounds good', 'sounds great', 'i like it', 'love it',
      "let's go with that", "use it",
    ])('"%s" is a confirmation', (phrase) => {
      expect(isConfirmation(phrase)).toBe(true);
    });
  });

  it('handles leading/trailing whitespace', () => {
    expect(isConfirmation('  yes  ')).toBe(true);
    expect(isConfirmation('  sounds good  ')).toBe(true);
  });

  it('handles case-insensitivity', () => {
    expect(isConfirmation('YES')).toBe(true);
    expect(isConfirmation('Sounds Good')).toBe(true);
    expect(isConfirmation('PERFECT')).toBe(true);
  });

  it('handles confirmation with additional words', () => {
    expect(isConfirmation('yes, I like it')).toBe(true);
    expect(isConfirmation('yeah that works')).toBe(true);
    expect(isConfirmation("yes! let's go with that")).toBe(true);
  });

  it('rejects non-confirmations', () => {
    expect(isConfirmation('make it shorter')).toBe(false);
    expect(isConfirmation('Call it Fern')).toBe(false);
    expect(isConfirmation('try another')).toBe(false);
    expect(isConfirmation('no, change it')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isConfirmation('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// extractNameFromPatterns
// ═══════════════════════════════════════════════════════════════════════════════

describe('extractNameFromPatterns', () => {
  it('extracts from "call it X"', () => {
    expect(extractNameFromPatterns('Call it Fern')).toBe('Fern');
    expect(extractNameFromPatterns("let's call it Harbor")).toBe('Harbor');
  });

  it('extracts from "name it X"', () => {
    expect(extractNameFromPatterns('Name it Clara')).toBe('Clara');
    expect(extractNameFromPatterns("let's name it Sunday Morning")).toBe('Sunday Morning');
  });

  it('extracts from "go with X"', () => {
    expect(extractNameFromPatterns("let's go with Atlas")).toBe('Atlas');
    expect(extractNameFromPatterns('go with Bennett')).toBe('Bennett');
  });

  it('extracts from "how about X"', () => {
    expect(extractNameFromPatterns('how about Wren')).toBe('Wren');
  });

  it('extracts from "the name is X"', () => {
    expect(extractNameFromPatterns('the name is Keystone')).toBe('Keystone');
    expect(extractNameFromPatterns('name should be Anchor')).toBe('Anchor');
  });

  it('extracts from "use X"', () => {
    expect(extractNameFromPatterns('use Maple')).toBe('Maple');
  });

  it('extracts from quoted text', () => {
    expect(extractNameFromPatterns('"Daylight"')).toBe('Daylight');
    expect(extractNameFromPatterns("'Lantern'")).toBe('Lantern');
  });

  it('strips surrounding quotes', () => {
    expect(extractNameFromPatterns('Call it "My Brand"')).toBe('My Brand');
    expect(extractNameFromPatterns("Name it 'Studio Nine'")).toBe('Studio Nine');
  });

  it('returns null for non-matching input', () => {
    expect(extractNameFromPatterns('make it shorter')).toBeNull();
    expect(extractNameFromPatterns('I want something more creative')).toBeNull();
    expect(extractNameFromPatterns('yes')).toBeNull();
    expect(extractNameFromPatterns('')).toBeNull();
  });

  it('returns null for plain text that is not a pattern', () => {
    expect(extractNameFromPatterns('FitPro Studio')).toBeNull();
    expect(extractNameFromPatterns('a fitness website')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isRefinementRequest
// ═══════════════════════════════════════════════════════════════════════════════

describe('isRefinementRequest', () => {
  it('detects "make it" requests', () => {
    expect(isRefinementRequest('make it shorter')).toBe(true);
    expect(isRefinementRequest('make it more punchy')).toBe(true);
  });

  it('detects style adjectives', () => {
    expect(isRefinementRequest('more professional')).toBe(true);
    expect(isRefinementRequest('something more creative')).toBe(true);
    expect(isRefinementRequest('make it unique')).toBe(true);
    expect(isRefinementRequest('I want it shorter')).toBe(true);
    expect(isRefinementRequest('more impactful')).toBe(true);
  });

  it('detects retry/different requests', () => {
    expect(isRefinementRequest('try another')).toBe(true);
    expect(isRefinementRequest('something different')).toBe(true);
    expect(isRefinementRequest('suggest another name')).toBe(true);
  });

  it('rejects name confirmations', () => {
    expect(isRefinementRequest('yes')).toBe(false);
    expect(isRefinementRequest('sounds good')).toBe(false);
    expect(isRefinementRequest('perfect')).toBe(false);
  });

  it('rejects direct name entries', () => {
    expect(isRefinementRequest('Fern')).toBe(false);
    expect(isRefinementRequest('Bennett')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// resolveDescriptionContext — the stale-description fix
// ═══════════════════════════════════════════════════════════════════════════════

describe('resolveDescriptionContext', () => {
  const MESSAGES = [
    { role: 'user' as const, content: 'A fitness coaching website with workout programs' },
    { role: 'assistant' as const, content: 'Got it! What would you like to call your project?' },
    { role: 'user' as const, content: 'Suggest a name' },
  ];

  it('uses explicit description when available', () => {
    expect(resolveDescriptionContext('explicit desc', 'flow desc', MESSAGES)).toBe('explicit desc');
  });

  it('falls back to flow description when explicit is empty', () => {
    expect(resolveDescriptionContext('', 'flow desc', MESSAGES)).toBe('flow desc');
    expect(resolveDescriptionContext(undefined, 'flow desc', MESSAGES)).toBe('flow desc');
  });

  it('falls back to first user message when both descriptions are empty', () => {
    expect(resolveDescriptionContext('', '', MESSAGES)).toBe(
      'A fitness coaching website with workout programs',
    );
  });

  it('skips "suggest a name" when finding first user message', () => {
    const onlySuggest = [
      { role: 'user' as const, content: 'Suggest a name' },
      { role: 'assistant' as const, content: 'How about Fern?' },
    ];
    // No valid user message found
    expect(resolveDescriptionContext('', '', onlySuggest)).toBe('');
  });

  it('returns empty string when nothing is available', () => {
    expect(resolveDescriptionContext('', '', [])).toBe('');
    expect(resolveDescriptionContext(undefined, undefined, [])).toBe('');
  });

  it('ignores whitespace-only descriptions', () => {
    expect(resolveDescriptionContext('   ', '   ', MESSAGES)).toBe(
      'A fitness coaching website with workout programs',
    );
  });

  /**
   * Regression: The original bug was that generateProjectName had an empty
   * dependency array, causing flowHook.projectDescription to always be stale (empty).
   * This test verifies the resolution logic returns the actual description, not ''.
   */
  it('regression: description is never empty when messages exist', () => {
    const messagesWithDescription = [
      { role: 'user' as const, content: 'A hair salon site with stylist portfolios' },
      { role: 'assistant' as const, content: 'Great! Name?' },
      { role: 'user' as const, content: 'Suggest a name' },
    ];
    // Simulate the bug: both explicit and flow descriptions are empty (stale closure)
    const result = resolveDescriptionContext('', '', messagesWithDescription);
    expect(result).toBe('A hair salon site with stylist portfolios');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// addToHistory / wasAlreadySuggested
// ═══════════════════════════════════════════════════════════════════════════════

describe('addToHistory', () => {
  it('adds a new name to empty history', () => {
    expect(addToHistory([], 'Fern')).toEqual(['Fern']);
  });

  it('appends to existing history', () => {
    expect(addToHistory(['Fern'], 'Clara')).toEqual(['Fern', 'Clara']);
  });

  it('does not add duplicates', () => {
    expect(addToHistory(['Fern', 'Clara'], 'Fern')).toEqual(['Fern', 'Clara']);
  });

  it('does not mutate original array', () => {
    const original = ['Fern'];
    const result = addToHistory(original, 'Clara');
    expect(original).toEqual(['Fern']);
    expect(result).toEqual(['Fern', 'Clara']);
  });
});

describe('wasAlreadySuggested', () => {
  it('returns true when name is in history', () => {
    expect(wasAlreadySuggested(['Fern', 'Clara', 'Atlas'], 'Clara')).toBe(true);
  });

  it('returns false when name is not in history', () => {
    expect(wasAlreadySuggested(['Fern', 'Clara'], 'Atlas')).toBe(false);
  });

  it('returns false for empty history', () => {
    expect(wasAlreadySuggested([], 'Fern')).toBe(false);
  });

  it('is case-sensitive (exact match)', () => {
    expect(wasAlreadySuggested(['Fern'], 'fern')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// sanitizeName
// ═══════════════════════════════════════════════════════════════════════════════

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  Fern  ')).toBe('Fern');
  });

  it('removes surrounding quotes', () => {
    expect(sanitizeName('"Fern"')).toBe('Fern');
    expect(sanitizeName("'Fern'")).toBe('Fern');
  });

  it('collapses multiple spaces', () => {
    expect(sanitizeName('Sunday   Morning')).toBe('Sunday Morning');
  });

  it('truncates to 50 characters', () => {
    const long = 'A'.repeat(60);
    expect(sanitizeName(long).length).toBeLessThanOrEqual(50);
  });

  it('handles combined issues', () => {
    expect(sanitizeName('  "My   Brand  Name"  ')).toBe('My Brand Name');
  });

  it('handles empty string', () => {
    expect(sanitizeName('')).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Full Naming Conversation Flow (logic-only integration test)
// ═══════════════════════════════════════════════════════════════════════════════

describe('naming conversation flow (logic)', () => {
  it('generate → confirm flow', () => {
    let history: string[] = [];

    // Step 1: System generates "Fern"
    const generatedName = 'Fern';
    history = addToHistory(history, generatedName);
    expect(wasAlreadySuggested(history, 'Fern')).toBe(true);

    // Step 2: User says "yes"
    expect(isConfirmation('yes, I like it')).toBe(true);
    expect(isRefinementRequest('yes, I like it')).toBe(false);
    expect(extractNameFromPatterns('yes, I like it')).toBeNull(); // no pattern
    // → Confirmed name is "Fern"
  });

  it('generate → refine → confirm flow', () => {
    let history: string[] = [];

    // Step 1: System generates "Willow"
    history = addToHistory(history, 'Willow');

    // Step 2: User asks to refine
    const userInput = 'make it more punchy';
    expect(isConfirmation(userInput)).toBe(false);
    expect(isRefinementRequest(userInput)).toBe(true);
    expect(extractNameFromPatterns(userInput)).toBeNull();

    // Step 3: System suggests "Atlas"
    history = addToHistory(history, 'Atlas');
    expect(wasAlreadySuggested(history, 'Willow')).toBe(true);
    expect(wasAlreadySuggested(history, 'Atlas')).toBe(true);

    // Step 4: User confirms
    expect(isConfirmation('sounds good')).toBe(true);
    // → Confirmed name is "Atlas"
  });

  it('generate → user provides own name flow', () => {
    let history: string[] = [];
    history = addToHistory(history, 'Fern');

    // User provides their own name
    const userInput = 'Call it FitPro Studio';
    expect(isConfirmation(userInput)).toBe(false);
    expect(extractNameFromPatterns(userInput)).toBe('FitPro Studio');
    // → User's name is "FitPro Studio"
  });

  it('generate → multiple refinements → confirm flow', () => {
    let history: string[] = [];

    // Generate
    history = addToHistory(history, 'Willow');

    // Refinement 1
    expect(isRefinementRequest('make it shorter')).toBe(true);
    history = addToHistory(history, 'Kit');

    // Refinement 2
    expect(isRefinementRequest('something more professional')).toBe(true);
    history = addToHistory(history, 'Bennett');

    // History tracks all
    expect(history).toEqual(['Willow', 'Kit', 'Bennett']);
    expect(wasAlreadySuggested(history, 'Willow')).toBe(true);
    expect(wasAlreadySuggested(history, 'Kit')).toBe(true);
    expect(wasAlreadySuggested(history, 'Bennett')).toBe(true);

    // Confirm final
    expect(isConfirmation('perfect')).toBe(true);
  });

  it('user provides name directly (no generation)', () => {
    // User types their name immediately
    const input = 'FitPro Studio';
    // Not a confirmation (no previous suggestion)
    expect(isConfirmation(input)).toBe(false);
    // Not a refinement
    expect(isRefinementRequest(input)).toBe(false);
    // Not a pattern match either — it's just a raw name
    expect(extractNameFromPatterns(input)).toBeNull();
    // → System should use input as-is after sanitization
    expect(sanitizeName(input)).toBe('FitPro Studio');
  });

  it('empty description scenario uses message history fallback', () => {
    const messages = [
      { role: 'user' as const, content: 'A restaurant website with online ordering' },
      { role: 'assistant' as const, content: 'Got it!' },
      { role: 'user' as const, content: 'Suggest a name' },
    ];
    // Simulate stale closure: both descriptions empty
    const desc = resolveDescriptionContext('', '', messages);
    expect(desc).toBe('A restaurant website with online ordering');
    expect(desc).not.toBe('');
    expect(desc).not.toContain('Suggest a name');
  });

  it('banned word in generated name triggers filter', () => {
    expect(containsBannedWord('Thrive Coaching')).toBe(true);
    expect(containsBannedWord('Bennett')).toBe(false);
    // Only clean names should be used
    const candidate = 'Elevate Studio';
    if (containsBannedWord(candidate)) {
      // Should fall back to a safe name instead
      expect(getBannedWord(candidate)).toBe('Elevate');
    }
  });
});

