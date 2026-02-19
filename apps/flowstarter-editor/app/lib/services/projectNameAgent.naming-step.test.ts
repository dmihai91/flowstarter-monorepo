/**
 * Project Name Agent — Additional Naming Step Tests
 *
 * Supplements the existing projectNameAgent.test.ts with tests focused on:
 * - Fallback extraction (simpleFallbackExtraction logic)
 * - Banned word code-level filtering
 * - Conversation context (previouslySuggested, accumulatedRequirements)
 * - Refinement with conversation history
 * - Edge cases in the extract flow
 *
 * Does NOT overwrite the existing test file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateProjectName,
  generateFallbackName,
  extractProjectName,
  refineProjectName,
} from './projectNameAgent';

// Mock the LLM module
vi.mock('./llm', () => ({
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from './llm';
const mockGenerateCompletion = vi.mocked(generateCompletion);

// ═══════════════════════════════════════════════════════════════════════════════
// Fallback extraction — confirmation detection without LLM
// ═══════════════════════════════════════════════════════════════════════════════

describe('extractProjectName: fallback confirmation detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('confirms previous suggestion on "yes"', async () => {
    // Make LLM fail so fallback is used
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('yes', {
      previousSuggestion: 'Fern',
    });

    expect(result.projectName).toBe('Fern');
  });

  it('confirms previous suggestion on "sounds good"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('sounds good', {
      previousSuggestion: 'Harbor',
    });

    expect(result.projectName).toBe('Harbor');
  });

  it('confirms previous suggestion on "perfect"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('perfect', {
      previousSuggestion: 'Atlas',
    });

    expect(result.projectName).toBe('Atlas');
  });

  it('confirms previous suggestion on "that works"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('that works for me', {
      previousSuggestion: 'Clara',
    });

    expect(result.projectName).toBe('Clara');
  });

  it('confirms on "i like it"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('yeah I like it', {
      previousSuggestion: 'Wren',
    });

    expect(result.projectName).toBe('Wren');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Fallback extraction — pattern-based name extraction without LLM
// ═══════════════════════════════════════════════════════════════════════════════

describe('extractProjectName: fallback pattern extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('extracts name from "call it X"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('Call it FitPro Studio', {});

    expect(result.projectName).toBe('FitPro Studio');
  });

  it('extracts name from "name it X"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('Name it Sunday Morning', {});

    expect(result.projectName).toBe('Sunday Morning');
  });

  it('extracts name from quoted text', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('"The Studio"', {});

    expect(result.projectName).toBe('The Studio');
  });

  it('extracts name from "go with X"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName("let's go with Bennett", {});

    expect(result.projectName).toBe('Bennett');
  });

  it('extracts name from "use X"', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('use Keystone', {});

    expect(result.projectName).toBe('Keystone');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Banned word code-level filtering
// ═══════════════════════════════════════════════════════════════════════════════

describe('generateProjectName: banned word code-level filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('filters out names containing banned words from LLM response', async () => {
    // LLM returns a mix of good and banned names
    mockGenerateCompletion.mockResolvedValueOnce('Thrive Coaching\nFern\nElevate Studio');

    const result = await generateProjectName('life coach', undefined, true);

    expect(result.success).toBe(true);
    // Only "Fern" should survive the filter
    expect(result.allOptions).toEqual(['Fern']);
    expect(result.projectName).toBe('Fern');
  });

  it('uses fallback when ALL LLM names are banned', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Thrive\nElevate\nEmpower');

    const result = await generateProjectName('coaching');

    expect(result.success).toBe(false); // fell back
    expect(result.projectName).toBeDefined();
    expect(result.projectName.length).toBeGreaterThan(0);
  });
});

describe('extractProjectName: banned word filtering in refinements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('rejects banned name in follow-up suggestion and uses fallback', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(
      '{"type":"question","name":"Thrive Studio","message":"How about **Thrive Studio**?"}',
    );

    const result = await extractProjectName('make it more impactful', {
      previousSuggestion: 'Willow',
      projectDescription: 'coaching business',
    });

    expect(result.needsFollowUp).toBe(true);
    // Should NOT be "Thrive Studio" — should be a safe fallback
    expect(result.suggestedName).not.toBe('Thrive Studio');
    expect(result.suggestedName).toBeDefined();
    expect(result.suggestedName!.length).toBeGreaterThan(0);
  });
});

describe('refineProjectName: banned word filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('rejects banned name from refinement and uses fallback', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name":"Elevate Studio"}');

    const result = await refineProjectName({
      previousName: 'Willow',
      refinementFeedback: 'more impactful',
      projectDescription: 'coaching',
    });

    expect(result.success).toBe(false); // fell back
    expect(result.projectName).not.toBe('Elevate Studio');
    expect(result.projectName).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Conversation context — previouslySuggested and accumulatedRequirements
// ═══════════════════════════════════════════════════════════════════════════════

describe('extractProjectName: conversation context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('passes previouslySuggested to LLM prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Knox"}');

    await extractProjectName('something different', {
      previousSuggestion: 'Atlas',
      previouslySuggested: ['Willow', 'Atlas', 'Fern'],
      projectDescription: 'fitness coaching',
    });

    // The system prompt should have been called with the suggested names
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(1);
    const systemPrompt = mockGenerateCompletion.mock.calls[0][0][0].content;
    expect(systemPrompt).toContain('Willow');
    expect(systemPrompt).toContain('Atlas');
    expect(systemPrompt).toContain('Fern');
  });

  it('passes accumulatedRequirements to LLM prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Knox"}');

    await extractProjectName('try again', {
      previousSuggestion: 'Atlas',
      accumulatedRequirements: ['punchy', 'single word'],
      projectDescription: 'fitness coaching',
    });

    expect(mockGenerateCompletion).toHaveBeenCalledTimes(1);
    const systemPrompt = mockGenerateCompletion.mock.calls[0][0][0].content;
    expect(systemPrompt).toContain('punchy');
    expect(systemPrompt).toContain('single word');
  });

  it('returns extractedRequirements from LLM response', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(
      '{"type":"question","name":"Knox","message":"How about **Knox**?","extractedRequirements":["short","powerful"]}',
    );

    const result = await extractProjectName('make it punchy and short', {
      previousSuggestion: 'Sunday Morning',
    });

    expect(result.needsFollowUp).toBe(true);
    expect(result.extractedRequirements).toEqual(['short', 'powerful']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Refinement with conversation history
// ═══════════════════════════════════════════════════════════════════════════════

describe('refineProjectName: with conversation history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('passes previouslySuggested to refinement prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name":"Knox"}');

    await refineProjectName({
      previousName: 'Atlas',
      refinementFeedback: 'shorter',
      projectDescription: 'fitness',
      previouslySuggested: ['Willow', 'Atlas'],
      accumulatedRequirements: ['punchy'],
    });

    const systemPrompt = mockGenerateCompletion.mock.calls[0][0][0].content;
    expect(systemPrompt).toContain('Willow');
    expect(systemPrompt).toContain('Atlas');
    expect(systemPrompt).toContain('punchy');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// generateFallbackName: comprehensive coverage
// ═══════════════════════════════════════════════════════════════════════════════

describe('generateFallbackName: industry matching', () => {
  it('generates appropriate names for each industry keyword', () => {
    const industries = [
      'massage', 'therapy', 'spa', 'yoga', 'fitness', 'gym',
      'restaurant', 'cafe', 'coffee', 'bakery',
      'photography', 'design',
      'consulting', 'coaching', 'life coach',
      'cleaning', 'landscaping', 'plumbing',
      'real estate', 'dental', 'medical', 'legal', 'accounting',
      'ecommerce', 'tech', 'saas',
    ];

    for (const industry of industries) {
      const name = generateFallbackName(`a ${industry} website`);
      expect(name, `No name generated for "${industry}"`).toBeDefined();
      expect(name.length, `Empty name for "${industry}"`).toBeGreaterThan(0);
      expect(name.length, `Name too long for "${industry}": ${name}`).toBeLessThan(30);
    }
  });

  it('returns generic fallback for unrecognized descriptions', () => {
    const name = generateFallbackName('something completely unknown xyz');
    expect(name).toBeDefined();
    expect(name.length).toBeGreaterThan(0);
  });

  it('returns a name even for empty string', () => {
    const name = generateFallbackName('');
    expect(name).toBeDefined();
    expect(name.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('extractProjectName: additional edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  it('handles whitespace-only input', async () => {
    const result = await extractProjectName('   ', {});
    expect(result.error).toBe(true);
    expect(result.canRetry).toBe(true);
  });

  it('handles very long input gracefully', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const longInput = 'A'.repeat(200);
    const result = await extractProjectName(longInput, {});

    expect(result).toBeDefined();
    // Either extracts a name or gives a follow-up
    expect(result.projectName || result.suggestedName || result.needsFollowUp).toBeTruthy();
  });

  it('handles input with only emojis', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM down'));

    const result = await extractProjectName('🚀🔥', {});

    expect(result).toBeDefined();
    // Should get a follow-up since emojis aren't a valid name
  });
});

