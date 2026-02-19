import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateProjectName,
  generateFallbackName,
  extractProjectName,
  refineProjectName,
} from './projectNameAgent';

// ─── VALIDATION PATTERNS ───────────────────────────────────────────────────

// Patterns that indicate bad "startup-y" names we want to avoid
const BAD_PATTERNS = [
  // Compound words with aspirational suffixes (but not common words)
  /Flow$/i,
  /Hub$/i,
  /Mate$/i,
  /ify$/i,
  /ware$/i,
  /Pro$/i,
  /Plus$/i,
  /Edge$/i,
  /Labs$/i,
  /Works$/i,
  
  // Corporate motivation compounds
  /^(Peak|Elevate|Thrive|Empower|Transform|Boost|Accelerate)\b/i,
  /(Growth|Forward|Progress|Success|Achieve)$/i,
  
  // Tech startup patterns
  /^(Smart|Quick|Fast|Rapid|Turbo|Ultra|Mega|Super)\b/i,
  /(Tech|Digital|Cyber|Cloud|Data|App)$/i,
  
  // Obvious compound mashups (CamelCase compounds like "GlowForward", "MindFlow")
  /^[A-Z][a-z]+[A-Z][a-z]+$/,
];

// Words that look like bad patterns but are actually fine
const ALLOWED_EXCEPTIONS = [
  'The Table',
  'Studio',   // standalone is fine
  'Foundry',
  'Gallery',
];

// Words/patterns that indicate good warm, human names
const GOOD_INDICATORS = [
  // Nature words
  /^(Fern|Maple|Willow|Oak|Birch|Cedar|Ivy|Sage|Juniper|Olive|Lavender|Rosemary|Clover|Meadow|Harbor|River|Lake|Mountain|Valley|Forest|Garden|Field|Stone|Moss|Amber|Coral)$/i,
  
  // Times/moments
  /^(Morning|Sunday|Daylight|Golden Hour|Dawn|Dusk|Twilight|Noon|Midnight|Sunrise|Sunset)$/i,
  /(Morning|Sunday|Hour|Day|Night|Light)$/i,
  
  // Personal names
  /^(Clara|Ellis|Margot|Felix|Wren|Iris|Maxwell|Bennett|Atlas|Nova|Ember|Opal|Pearl|Ruby|Jade)$/i,
  
  // Warm simple words
  /^(Hearth|Home|Gather|Table|Corner|Door|Window|Light|Warmth|Comfort|Rest|Peace|Calm|Still|Gentle|Honest|True|Good|Simple|Kind)$/i,
  
  // Short single words (1-8 chars, no compounds)
  /^[A-Z][a-z]{2,7}$/,
];

/**
 * Check if a name matches bad patterns we want to avoid
 */
function hasBadPatterns(name: string): string[] {
  // Check exceptions first
  if (ALLOWED_EXCEPTIONS.some(ex => name.includes(ex) || name === ex)) {
    return [];
  }
  
  const violations: string[] = [];
  
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(name)) {
      violations.push(`Matches bad pattern: ${pattern}`);
    }
  }
  
  return violations;
}

/**
 * Check if a name has good qualities
 */
function hasGoodQualities(name: string): boolean {
  // Single word names are generally good
  if (!name.includes(' ') && name.length <= 12) {
    // Check it's not a bad compound
    if (!/^[A-Z][a-z]+[A-Z]/.test(name)) {
      return true;
    }
  }
  
  // Check against good indicators
  for (const pattern of GOOD_INDICATORS) {
    if (pattern.test(name)) {
      return true;
    }
  }
  
  // Two-word names with "The" are often good
  if (/^The [A-Z][a-z]+$/.test(name)) {
    return true;
  }
  
  // Simple two-word combinations
  const words = name.split(' ');
  if (words.length === 2 && words.every(w => w.length <= 8)) {
    return true;
  }
  
  return false;
}

// ─── FALLBACK NAME TESTS ───────────────────────────────────────────────────

describe('generateFallbackName', () => {
  it('should generate warm names for life coach descriptions', () => {
    const descriptions = [
      'life coach website',
      'a life coaching business',
      'personal coaching services',
    ];
    
    const generatedNames = new Set<string>();
    
    // Generate multiple times to check variety
    for (let i = 0; i < 20; i++) {
      for (const desc of descriptions) {
        const name = generateFallbackName(desc);
        generatedNames.add(name);
        
        const violations = hasBadPatterns(name);
        expect(violations, `Name "${name}" has violations: ${violations.join(', ')}`).toHaveLength(0);
      }
    }
    
    // Should have some variety
    expect(generatedNames.size).toBeGreaterThan(1);
  });
  
  it('should generate warm names for spa/wellness descriptions', () => {
    const descriptions = [
      'massage therapy',
      'spa and wellness',
      'yoga studio',
      'therapy practice',
    ];
    
    for (const desc of descriptions) {
      for (let i = 0; i < 5; i++) {
        const name = generateFallbackName(desc);
        const violations = hasBadPatterns(name);
        expect(violations, `Name "${name}" for "${desc}" has violations`).toHaveLength(0);
      }
    }
  });
  
  it('should generate warm names for restaurant/cafe descriptions', () => {
    const descriptions = [
      'restaurant',
      'coffee shop',
      'cafe',
      'bakery',
    ];
    
    for (const desc of descriptions) {
      for (let i = 0; i < 5; i++) {
        const name = generateFallbackName(desc);
        const violations = hasBadPatterns(name);
        expect(violations, `Name "${name}" for "${desc}" has violations`).toHaveLength(0);
      }
    }
  });
  
  it('should not generate corporate-sounding names', () => {
    const badNames = [
      'Peak Performance',
      'GlowForward', 
      'MindFlow',
      'Elevate Growth',
      'Thrive Coaching',
      'VitalEdge',
      'WellnessHub',
    ];
    
    // Generate many fallback names and ensure none match bad examples
    const allGenerated: string[] = [];
    const testDescriptions = [
      'massage',
      'coaching',
      'fitness',
      'tech startup',
      'consulting',
      'generic business',
    ];
    
    for (const desc of testDescriptions) {
      for (let i = 0; i < 10; i++) {
        allGenerated.push(generateFallbackName(desc));
      }
    }
    
    for (const generated of allGenerated) {
      expect(badNames).not.toContain(generated);
    }
  });
  
  it('should generate appropriate generic fallbacks', () => {
    const name = generateFallbackName('something completely random xyz123');
    
    const violations = hasBadPatterns(name);
    expect(violations).toHaveLength(0);
    expect(name.length).toBeLessThan(20);
  });
});

// ─── NAME QUALITY TESTS ────────────────────────────────────────────────────

describe('name quality validation', () => {
  const knownGoodNames = [
    'Clara',
    'Ellis',
    'Fern',
    'Maple',
    'Sunday Morning',
    'Golden Hour',
    'The Table',
    'Honest Work',
    'Daylight',
    'Harbor',
    'Wren',
    'Lantern',
    'Willow',
    'Hearth',
  ];
  
  const knownBadNames = [
    'GlowForward',
    'Peak Thrive',
    'Sterling Progress',
    'MindFlow',
    'VitalEdge',
    'ElevateHub',
    'ThriveFlow',
    'GrowthMate',
    'SmartPath',
    'QuickStart Pro',
  ];
  
  it('should correctly identify good names', () => {
    for (const name of knownGoodNames) {
      const violations = hasBadPatterns(name);
      expect(violations, `Good name "${name}" incorrectly flagged: ${violations.join(', ')}`).toHaveLength(0);
    }
  });
  
  it('should correctly identify bad names', () => {
    for (const name of knownBadNames) {
      const violations = hasBadPatterns(name);
      expect(violations.length, `Bad name "${name}" not caught by patterns`).toBeGreaterThan(0);
    }
  });
  
  it('should recognize warm qualities in good names', () => {
    const warmNames = ['Fern', 'Clara', 'Maple', 'Harbor', 'Sage'];
    
    for (const name of warmNames) {
      expect(hasGoodQualities(name), `Name "${name}" should have good qualities`).toBe(true);
    }
  });
});

// ─── MOCK LLM TESTS ────────────────────────────────────────────────────────

// Mock the LLM module for controlled testing
vi.mock('./llm', () => ({
  generateCompletion: vi.fn(),
}));

import { generateCompletion } from './llm';
const mockGenerateCompletion = vi.mocked(generateCompletion);

describe('generateProjectName with mocked LLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set API key for tests
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });
  
  it('should parse LLM response with good names', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Clara\nSunday Morning\nFern');
    
    const result = await generateProjectName('life coach website', undefined, true);
    
    expect(result.success).toBe(true);
    expect(result.allOptions).toHaveLength(3);
    expect(result.allOptions).toContain('Clara');
    expect(result.allOptions).toContain('Sunday Morning');
    expect(result.allOptions).toContain('Fern');
  });
  
  it('should handle numbered list response', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('1. Willow\n2. Maple\n3. Daylight');
    
    const result = await generateProjectName('coaching business', undefined, true);
    
    expect(result.success).toBe(true);
    expect(result.allOptions).toContain('Willow');
    expect(result.allOptions).toContain('Maple');
    expect(result.allOptions).toContain('Daylight');
  });
  
  it('should fall back gracefully on LLM error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));
    
    const result = await generateProjectName('massage therapy');
    
    expect(result.success).toBe(false);
    expect(result.projectName).toBeDefined();
    
    // Fallback should still be a good name
    const violations = hasBadPatterns(result.projectName);
    expect(violations).toHaveLength(0);
  });
  
  it('should use fallback when API key is missing', async () => {
    delete process.env.OPEN_ROUTER_API_KEY;
    
    const result = await generateProjectName('yoga studio');
    
    expect(result.success).toBe(false);
    expect(result.projectName).toBeDefined();
    
    // Should not call LLM
    expect(mockGenerateCompletion).not.toHaveBeenCalled();
  });
});

describe('extractProjectName with mocked LLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });
  
  it('should extract confirmed name', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Clara"}');
    
    const result = await extractProjectName('yes, I like it', {
      previousSuggestion: 'Clara',
    });
    
    expect(result.projectName).toBe('Clara');
    expect(result.needsFollowUp).toBeFalsy();
  });
  
  it('should handle refinement requests', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(
      '{"type":"question","name":"Atlas","message":"How about **Atlas**? Strong and timeless."}'
    );
    
    const result = await extractProjectName('make it more punchy', {
      previousSuggestion: 'Willow',
      projectDescription: 'fitness coaching',
    });
    
    expect(result.needsFollowUp).toBe(true);
    expect(result.suggestedName).toBe('Atlas');
    expect(result.followUpMessage).toContain('Atlas');
  });
  
  it('should extract user-provided names', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"My Custom Name"}');
    
    const result = await extractProjectName('call it My Custom Name');
    
    expect(result.projectName).toBe('My Custom Name');
  });
  
  it('should handle JSON wrapped in markdown code blocks', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('```json\n{"type":"name","name":"Harbor"}\n```');
    
    const result = await extractProjectName('yes');
    
    expect(result.projectName).toBe('Harbor');
  });
});

describe('refineProjectName with mocked LLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });
  
  it('should refine name based on feedback', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name":"Atlas"}');
    
    const result = await refineProjectName({
      previousName: 'Willow',
      refinementFeedback: 'more punchy and impactful',
      projectDescription: 'fitness business',
    });
    
    expect(result.success).toBe(true);
    expect(result.projectName).toBe('Atlas');
  });
  
  it('should handle refinement to shorter name', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('{"name":"Fern"}');
    
    const result = await refineProjectName({
      previousName: 'Sunday Morning',
      refinementFeedback: 'shorter',
    });
    
    expect(result.success).toBe(true);
    expect(result.projectName).toBe('Fern');
    expect(result.projectName.length).toBeLessThan('Sunday Morning'.length);
  });
  
  it('should fall back gracefully on error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('API error'));
    
    const result = await refineProjectName({
      previousName: 'Willow',
      refinementFeedback: 'different',
      projectDescription: 'spa business',
    });
    
    expect(result.success).toBe(false);
    expect(result.projectName).toBeDefined();
    
    // Fallback should be a good name
    const violations = hasBadPatterns(result.projectName);
    expect(violations).toHaveLength(0);
  });
});

// ─── INTEGRATION-STYLE TESTS ───────────────────────────────────────────────

describe('naming flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPEN_ROUTER_API_KEY = 'test-key';
  });
  
  it('should handle full naming conversation flow', async () => {
    // Step 1: Initial generation
    mockGenerateCompletion.mockResolvedValueOnce('Clara\nWren\nLantern');
    
    const initial = await generateProjectName('life coach website with services and booking');
    expect(initial.success).toBe(true);
    expect(['Clara', 'Wren', 'Lantern']).toContain(initial.projectName);
    
    // Step 2: User asks for refinement
    mockGenerateCompletion.mockResolvedValueOnce(
      '{"type":"question","name":"Atlas","message":"How about **Atlas**? Bold and grounded."}'
    );
    
    const refinementRequest = await extractProjectName('make it more impactful', {
      previousSuggestion: initial.projectName,
      projectDescription: 'life coach website',
    });
    
    expect(refinementRequest.needsFollowUp).toBe(true);
    expect(refinementRequest.suggestedName).toBe('Atlas');
    
    // Step 3: User confirms
    mockGenerateCompletion.mockResolvedValueOnce('{"type":"name","name":"Atlas"}');
    
    const confirmed = await extractProjectName('yes, that works', {
      previousSuggestion: 'Atlas',
    });
    
    expect(confirmed.projectName).toBe('Atlas');
    expect(confirmed.needsFollowUp).toBeFalsy();
  });
  
  it('should never suggest names with bad patterns in mock responses', async () => {
    // Simulate what we expect from the improved prompts
    const goodResponses = [
      'Clara\nHarbor\nFern',
      'Lantern\nWren\nAtlas',
      'Sunday Morning\nGolden Hour\nStill Water',
      'Willow\nMeadow\nSage',
    ];
    
    for (const response of goodResponses) {
      mockGenerateCompletion.mockResolvedValueOnce(response);
      
      const result = await generateProjectName('test description', undefined, true);
      
      if (result.allOptions) {
        for (const name of result.allOptions) {
          const violations = hasBadPatterns(name);
          expect(violations, `Generated name "${name}" has violations`).toHaveLength(0);
        }
      }
    }
  });
});

// ─── EDGE CASES ────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('should handle empty description', async () => {
    const result = await generateProjectName('');
    expect(result.projectName).toBeDefined();
    expect(result.projectName.length).toBeGreaterThan(0);
  });
  
  it('should handle very long description', async () => {
    const longDesc = 'a '.repeat(500) + 'life coach website';
    const name = generateFallbackName(longDesc);
    expect(name).toBeDefined();
    expect(name.length).toBeLessThan(50);
  });
  
  it('should handle special characters in input', async () => {
    const result = await extractProjectName('Call it "My Project!"', {});
    // Should not error
    expect(result).toBeDefined();
  });
  
  it('should handle empty user input in extraction', async () => {
    const result = await extractProjectName('', {});
    expect(result.error).toBe(true);
    expect(result.canRetry).toBe(true);
  });
});

