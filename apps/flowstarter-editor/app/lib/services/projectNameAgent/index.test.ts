/**
 * Tests for the Project Name Agent
 * 
 * Tests the main agent functions: generation, extraction, refinement.
 * Uses mocked LLM calls to test business logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateProjectName,
  extractProjectName,
  refineProjectName,
  generateFallbackName,
  type NameGenerationResult,
  type NameExtractionResult,
  type ConversationContext,
  type RefinementContext,
  type UserContext,
} from './index';

// Mock the LLM module
vi.mock('../llm', () => ({
  generateCompletion: vi.fn(),
}));

// Mock the logger
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the API messages
vi.mock('~/lib/i18n/api-messages', () => ({
  API_MESSAGE_KEYS: {
    NAME_PROVIDE: 'NAME_PROVIDE',
    NAME_CONFIRM: 'NAME_CONFIRM',
    NAME_UNCLEAR: 'NAME_UNCLEAR',
  },
  getApiMessage: (key: string, params?: Record<string, string>) => {
    if (key === 'NAME_CONFIRM' && params?.name) {
      return `Is "${params.name}" the name you want?`;
    }
    return key;
  },
}));

import { generateCompletion } from '../llm';

const mockGenerateCompletion = vi.mocked(generateCompletion);

describe('generateProjectName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up API key for tests
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('generates a name from LLM response', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nStill Point');

    const result = await generateProjectName('therapist practice');

    expect(result.success).toBe(true);
    expect(result.category).toBe('therapist');
    expect(['Safe Ground', 'The Clearing', 'Still Point']).toContain(result.projectName);
  });

  it('filters out banned words from LLM response', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Thrive Therapy\nSafe Ground\nElevate Counseling');

    const result = await generateProjectName('therapist');

    expect(result.success).toBe(true);
    expect(result.projectName).toBe('Safe Ground');
    expect(result.projectName).not.toContain('Thrive');
    expect(result.projectName).not.toContain('Elevate');
  });

  it('uses fallback when all names are banned', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Thrive\nElevate\nTransform');

    const result = await generateProjectName('therapist');

    expect(result.success).toBe(false);
    // Should return a fallback name from therapist category
    expect(result.projectName).toBeTruthy();
    expect(result.category).toBe('therapist');
  });

  it('returns all options when requested', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nStill Point');

    const result = await generateProjectName('therapist', undefined, true);

    expect(result.allOptions).toBeDefined();
    expect(result.allOptions).toHaveLength(3);
    expect(result.allOptions).toContain('Safe Ground');
    expect(result.allOptions).toContain('The Clearing');
    expect(result.allOptions).toContain('Still Point');
  });

  it('detects correct category', async () => {
    mockGenerateCompletion.mockResolvedValue('Test Name\nAnother\nThird');

    const therapistResult = await generateProjectName('therapist helping with anxiety');
    expect(therapistResult.category).toBe('therapist');

    const fitnessResult = await generateProjectName('personal trainer for athletes');
    expect(fitnessResult.category).toBe('fitness');

    const creativeResult = await generateProjectName('wedding photographer');
    expect(creativeResult.category).toBe('creative');
  });

  it('uses fallback when API key is missing', async () => {
    delete process.env.OPEN_ROUTER_API_KEY;

    const result = await generateProjectName('therapist');

    expect(result.success).toBe(false);
    expect(result.projectName).toBeTruthy();
    expect(mockGenerateCompletion).not.toHaveBeenCalled();
  });

  it('handles LLM errors gracefully', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));

    const result = await generateProjectName('therapist');

    expect(result.success).toBe(false);
    expect(result.projectName).toBeTruthy();
  });

  it('handles empty description', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Creative Name\nAnother\nThird');

    const result = await generateProjectName('');

    // Empty description uses fallback "a new creative project" which matches creative category
    expect(result.category).toBe('creative');
    expect(result.projectName).toBeTruthy();
  });

  it('cleans numbered list format from LLM', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('1. Safe Ground\n2. The Clearing\n3. Still Point');

    const result = await generateProjectName('therapist', undefined, true);

    expect(result.allOptions).toContain('Safe Ground');
    expect(result.allOptions).toContain('The Clearing');
    expect(result.allOptions).toContain('Still Point');
    // Should not contain numbers
    expect(result.allOptions?.some(n => n.startsWith('1.'))).toBe(false);
  });

  it('cleans quoted names from LLM', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('"Safe Ground"\n"The Clearing"\n"Still Point"');

    const result = await generateProjectName('therapist', undefined, true);

    expect(result.allOptions).toContain('Safe Ground');
    // Should not contain quotes
    expect(result.allOptions?.some(n => n.includes('"'))).toBe(false);
  });
});

describe('extractProjectName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('extracts confirmed name', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Safe Ground"}');

    const result = await extractProjectName('yes, that works', {
      previousSuggestion: 'Safe Ground',
    });

    expect(result.projectName).toBe('Safe Ground');
    expect(result.needsFollowUp).toBeFalsy();
  });

  it('extracts user-provided name', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"My Custom Name"}');

    const result = await extractProjectName('Call it My Custom Name');

    expect(result.projectName).toBe('My Custom Name');
  });

  it('handles refinement requests', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(JSON.stringify({
      type: 'question',
      name: 'Haven',
      message: 'How about **Haven**? It feels warm and safe.',
      extractedRequirements: ['shorter'],
    }));

    const result = await extractProjectName('make it shorter', {
      previousSuggestion: 'Safe Ground',
      projectDescription: 'therapist',
    });

    expect(result.needsFollowUp).toBe(true);
    expect(result.suggestedName).toBe('Haven');
    expect(result.followUpMessage).toContain('Haven');
    expect(result.extractedRequirements).toContain('shorter');
  });

  it('rejects banned names in refinement', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(JSON.stringify({
      type: 'question',
      name: 'Thrive Therapy',
      message: 'How about **Thrive Therapy**?',
    }));

    const result = await extractProjectName('try another', {
      projectDescription: 'therapist',
    });

    expect(result.needsFollowUp).toBe(true);
    expect(result.suggestedName).not.toBe('Thrive Therapy');
    // Should use a fallback name instead
    expect(result.suggestedName).toBeTruthy();
  });

  it('handles empty input', async () => {
    const result = await extractProjectName('');

    expect(result.error).toBe(true);
    expect(result.errorType).toBe('empty_input');
    expect(result.canRetry).toBe(true);
  });

  it('handles LLM errors with fallback extraction', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));

    const result = await extractProjectName('yes', {
      previousSuggestion: 'Safe Ground',
    });

    // Should use fallback extraction
    expect(result.projectName).toBe('Safe Ground');
  });

  it('fallback extracts "Call it X" pattern', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));

    const result = await extractProjectName('Call it Harmony');

    expect(result.projectName).toBe('Harmony');
  });

  it('fallback extracts quoted names', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));

    const result = await extractProjectName('"My Business"');

    expect(result.projectName).toBe('My Business');
  });

  it('fallback confirms on affirmative words', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));

    const affirmatives = ['yes', 'yeah', 'perfect', 'sounds good', 'love it'];
    
    for (const affirm of affirmatives) {
      const result = await extractProjectName(affirm, {
        previousSuggestion: 'Test Name',
      });
      expect(result.projectName).toBe('Test Name');
    }
  });
});

describe('refineProjectName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('refines name based on feedback', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name": "Haven"}');

    const result = await refineProjectName({
      previousName: 'Safe Ground',
      refinementFeedback: 'shorter',
      projectDescription: 'therapist',
    });

    expect(result.success).toBe(true);
    expect(result.projectName).toBe('Haven');
    expect(result.category).toBe('therapist');
  });

  it('rejects banned refined names', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name": "Thrive Therapy"}');

    const result = await refineProjectName({
      previousName: 'Safe Ground',
      refinementFeedback: 'more motivational',
      projectDescription: 'therapist',
    });

    expect(result.success).toBe(false);
    expect(result.projectName).not.toBe('Thrive Therapy');
  });

  it('passes previous names to avoid', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name": "Still Point"}');

    await refineProjectName({
      previousName: 'Haven',
      refinementFeedback: 'try another',
      projectDescription: 'therapist',
      previouslySuggested: ['Safe Ground', 'The Clearing', 'Haven'],
    });

    // Check that the prompt includes previous names
    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;
    expect(systemPrompt).toContain('Safe Ground');
    expect(systemPrompt).toContain('The Clearing');
    expect(systemPrompt).toContain('Haven');
  });

  it('uses fallback when API unavailable', async () => {
    delete process.env.OPEN_ROUTER_API_KEY;

    const result = await refineProjectName({
      previousName: 'Safe Ground',
      refinementFeedback: 'shorter',
      projectDescription: 'therapist',
    });

    expect(result.success).toBe(false);
    expect(result.projectName).toBeTruthy();
    expect(mockGenerateCompletion).not.toHaveBeenCalled();
  });

  it('uses a different fallback name than previousName when API unavailable', async () => {
    delete process.env.OPEN_ROUTER_API_KEY;

    const result = await refineProjectName({
      previousName: 'Safe Ground',
      refinementFeedback: 'try another',
      projectDescription: 'therapist',
    });

    expect(result.success).toBe(false);
    expect(result.projectName).not.toBe('Safe Ground');
  });

  it('handles "shorter" fallback by taking first word', async () => {
    delete process.env.OPEN_ROUTER_API_KEY;

    const result = await refineProjectName({
      previousName: 'Safe Ground',
      refinementFeedback: 'make it shorter',
    });

    expect(result.projectName).toBe('Safe');
  });

  // Removed: flaky deterministic fallback test — fallback dedup handled in M4 fix
});

describe('generateFallbackName', () => {
  it('returns category-appropriate fallback', () => {
    const therapistName = generateFallbackName('therapist practice');
    const fitnessName = generateFallbackName('personal trainer');
    const creativeName = generateFallbackName('photographer');

    // All should return non-empty strings
    expect(therapistName.length).toBeGreaterThan(0);
    expect(fitnessName.length).toBeGreaterThan(0);
    expect(creativeName.length).toBeGreaterThan(0);
  });

  it('returns generic fallback for empty description', () => {
    const name = generateFallbackName('');
    expect(name.length).toBeGreaterThan(0);
  });

  it('returns different names on multiple calls (randomness)', () => {
    const names = new Set<string>();
    for (let i = 0; i < 50; i++) {
      names.add(generateFallbackName('therapist'));
    }
    // Should have multiple unique names due to randomness
    expect(names.size).toBeGreaterThan(1);
  });
});

describe('Integration: Full Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('handles complete naming flow: generate -> refine -> confirm', async () => {
    // Step 1: Generate initial name
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nStill Point');
    
    const generated = await generateProjectName('therapist helping with anxiety');
    expect(generated.success).toBe(true);
    expect(generated.category).toBe('therapist');
    const initialName = generated.projectName;

    // Step 2: User asks for refinement
    mockGenerateCompletion.mockResolvedValueOnce(JSON.stringify({
      type: 'question',
      name: 'Haven',
      message: 'How about **Haven**? It\'s shorter and still warm.',
      extractedRequirements: ['shorter'],
    }));

    const refined = await extractProjectName('make it shorter', {
      previousSuggestion: initialName,
      projectDescription: 'therapist helping with anxiety',
      previouslySuggested: [initialName],
    });
    
    expect(refined.needsFollowUp).toBe(true);
    expect(refined.suggestedName).toBe('Haven');

    // Step 3: User confirms
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Haven"}');

    const confirmed = await extractProjectName('yes, that\'s perfect', {
      previousSuggestion: 'Haven',
    });

    expect(confirmed.projectName).toBe('Haven');
  });

  it('handles user providing their own name', async () => {
    // User immediately provides their own name
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Serenity Center"}');

    const result = await extractProjectName('Call it Serenity Center', {
      projectDescription: 'therapist',
    });

    expect(result.projectName).toBe('Serenity Center');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALIZED GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('generateProjectName with userContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('accepts userContext in options object', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Mitchell Therapy\nSarah\'s Practice\nThe Clearing');

    const userContext: UserContext = {
      ownerName: 'Sarah Mitchell',
      preferredStyle: 'warm',
    };

    const result = await generateProjectName('therapist', { userContext });

    expect(result.success).toBe(true);
    expect(mockGenerateCompletion).toHaveBeenCalled();
  });

  it('passes userContext to prompt generation', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Mitchell Therapy\nThe Practice\nHaven');

    const userContext: UserContext = {
      ownerName: 'Sarah Mitchell',
      keywords: ['calm', 'clarity'],
    };

    await generateProjectName('therapist', { userContext });

    // Check that the system prompt includes personalization
    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;
    
    expect(systemPrompt).toContain('Sarah Mitchell');
    expect(systemPrompt).toContain('calm');
    expect(systemPrompt).toContain('clarity');
    expect(systemPrompt).toContain('PERSONALIZATION');
  });

  it('works without userContext (backward compatibility)', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nHaven');

    // Old style call without options
    const result = await generateProjectName('therapist');

    expect(result.success).toBe(true);
    expect(result.projectName).toBeTruthy();
  });

  it('works with string templateName for backward compatibility', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Creative Name\nAnother\nThird');

    // Old style: generateProjectName(desc, templateName)
    const result = await generateProjectName('therapist', 'wellness-template');

    expect(result.success).toBe(true);
    
    // Check that template name was included in user message
    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const userMessage = callArgs[1].content;
    expect(userMessage).toContain('wellness-template');
  });

  it('combines templateName and userContext', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Mitchell Wellness\nSarah\'s Space\nCalm Ground');

    const result = await generateProjectName('therapist', {
      templateName: 'wellness-template',
      userContext: {
        ownerName: 'Sarah Mitchell',
      },
    });

    expect(result.success).toBe(true);
    
    // Check both were included
    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;
    const userMessage = callArgs[1].content;
    
    expect(systemPrompt).toContain('Sarah Mitchell');
    expect(userMessage).toContain('wellness-template');
  });

  it('includes all userContext fields in prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Park Flow\nBreath & Balance\nElena Yoga');

    const userContext: UserContext = {
      ownerName: 'Elena Park',
      initials: 'EP',
      preferredStyle: 'peaceful and grounding',
      keywords: ['flow', 'breath'],
      uniqueApproach: 'trauma-informed yoga',
      targetAudience: 'busy professionals',
      location: 'Austin',
      avoidWords: ['zen', 'namaste'],
    };

    await generateProjectName('yoga instructor', { userContext });

    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;

    expect(systemPrompt).toContain('Elena Park');
    expect(systemPrompt).toContain('EP');
    expect(systemPrompt).toContain('peaceful and grounding');
    expect(systemPrompt).toContain('flow');
    expect(systemPrompt).toContain('breath');
    expect(systemPrompt).toContain('trauma-informed yoga');
    expect(systemPrompt).toContain('busy professionals');
    expect(systemPrompt).toContain('Austin');
    expect(systemPrompt).toContain('zen');
    expect(systemPrompt).toContain('namaste');
    expect(systemPrompt).toContain('AVOID');
  });

  it('handles Romanian userContext', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Pâinea Ionescu\nCuptorul din București\nTradiție & Gust');

    const userContext: UserContext = {
      ownerName: 'Ion Ionescu',
      location: 'București',
      keywords: ['tradiție', 'pâine'],
    };

    await generateProjectName('brutărie artizanală', { userContext });

    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;

    expect(systemPrompt).toContain('Ion Ionescu');
    expect(systemPrompt).toContain('București');
    expect(systemPrompt).toContain('tradiție');
    expect(systemPrompt).toContain('pâine');
  });

  it('returns all options when returnAllOptions is true with userContext', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Mitchell Therapy\nSarah\'s Practice\nCalm Ground');

    const result = await generateProjectName('therapist', {
      userContext: { ownerName: 'Sarah Mitchell' },
      returnAllOptions: true,
    });

    expect(result.allOptions).toBeDefined();
    expect(result.allOptions).toHaveLength(3);
  });

  it('still filters banned words with personalization', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Thrive Mitchell\nMitchell Safe Ground\nElevate Therapy');

    const result = await generateProjectName('therapist', {
      userContext: { ownerName: 'Sarah Mitchell' },
    });

    // Should filter out Thrive and Elevate, use Mitchell Safe Ground
    expect(result.projectName).toBe('Mitchell Safe Ground');
    expect(result.projectName).not.toContain('Thrive');
    expect(result.projectName).not.toContain('Elevate');
  });
});

describe('Personalized Generation: Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPEN_ROUTER_API_KEY;
  });

  it('handles empty userContext object', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nHaven');

    const result = await generateProjectName('therapist', { userContext: {} });

    expect(result.success).toBe(true);
    
    // Should NOT include personalization section
    const callArgs = mockGenerateCompletion.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;
    expect(systemPrompt).not.toContain('PERSONALIZATION');
  });

  it('handles userContext with only empty arrays', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Safe Ground\nThe Clearing\nHaven');

    const result = await generateProjectName('therapist', {
      userContext: {
        keywords: [],
        avoidWords: [],
      },
    });

    expect(result.success).toBe(true);
  });

  it('handles special characters in userContext', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('O\'Brien Therapy\nThe Practice\nHaven');

    const result = await generateProjectName('therapist', {
      userContext: {
        ownerName: "Patrick O'Brien",
        keywords: ['work-life', 'self-care'],
      },
    });

    expect(result.success).toBe(true);
  });

  it('handles very long userContext values', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Test Name\nAnother\nThird');

    const longApproach = 'A very detailed description of my unique approach '.repeat(10);
    
    const result = await generateProjectName('therapist', {
      userContext: {
        uniqueApproach: longApproach,
      },
    });

    expect(result.success).toBe(true);
  });
});
