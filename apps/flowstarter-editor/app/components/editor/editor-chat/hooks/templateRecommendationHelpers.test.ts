/**
 * Template Recommendation Helpers - Unit Tests
 *
 * Tests the pure functions for template recommendation parsing,
 * filtering, and formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  parseRecommendationResponse,
  filterRecommendations,
  templatePaletteToColorPalette,
  getRecommendationHeaderText,
} from './templateRecommendationHelpers';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_RECOMMENDATIONS = [
  { templateId: 'fitness-coach', reasoning: 'Great for fitness coaches', matchScore: 95 },
  { templateId: 'consultant-pro', reasoning: 'Good for service providers', matchScore: 78 },
  { templateId: 'creative-portfolio', reasoning: 'Not ideal for fitness', matchScore: 45 },
  { templateId: 'minimal-landing', reasoning: 'Too generic', matchScore: 35 },
  { templateId: 'saas-product', reasoning: 'Wrong category', matchScore: 20 },
];

const MOCK_PALETTE = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  colors: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#3b82f6',
    background: '#0f172a',
    text: '#f8fafc',
  },
};

// ─── parseRecommendationResponse ──────────────────────────────────────────────

describe('parseRecommendationResponse', () => {
  it('parses raw JSON response', () => {
    const response = JSON.stringify({ recommendations: MOCK_RECOMMENDATIONS });
    const result = parseRecommendationResponse(response);
    expect(result).toHaveLength(5);
    expect(result[0].templateId).toBe('fitness-coach');
    expect(result[0].matchScore).toBe(95);
  });

  it('strips ```json code blocks', () => {
    const response = '```json\n' + JSON.stringify({ recommendations: MOCK_RECOMMENDATIONS }) + '\n```';
    const result = parseRecommendationResponse(response);
    expect(result).toHaveLength(5);
    expect(result[0].templateId).toBe('fitness-coach');
  });

  it('strips plain ``` code blocks', () => {
    const response = '```\n' + JSON.stringify({ recommendations: MOCK_RECOMMENDATIONS }) + '\n```';
    const result = parseRecommendationResponse(response);
    expect(result).toHaveLength(5);
  });

  it('handles whitespace around JSON', () => {
    const response = '\n\n  ' + JSON.stringify({ recommendations: MOCK_RECOMMENDATIONS }) + '  \n\n';
    const result = parseRecommendationResponse(response);
    expect(result).toHaveLength(5);
  });

  it('throws on missing recommendations array', () => {
    expect(() => parseRecommendationResponse('{}')).toThrow('missing recommendations array');
  });

  it('throws on recommendations not being an array', () => {
    expect(() => parseRecommendationResponse('{"recommendations": "not an array"}')).toThrow(
      'missing recommendations array',
    );
  });

  it('throws on invalid JSON', () => {
    expect(() => parseRecommendationResponse('not json at all')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parseRecommendationResponse('')).toThrow();
  });

  it('handles empty recommendations array', () => {
    const response = JSON.stringify({ recommendations: [] });
    const result = parseRecommendationResponse(response);
    expect(result).toHaveLength(0);
  });
});

// ─── filterRecommendations ────────────────────────────────────────────────────

describe('filterRecommendations', () => {
  it('filters by minimum score (default 60)', () => {
    const result = filterRecommendations(MOCK_RECOMMENDATIONS);
    // fitness-coach (95) and consultant-pro (78) are above 60
    // But minimum of 3 means creative-portfolio (45) is included too
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('sorts by score descending', () => {
    const unsorted = [
      { templateId: 'b', reasoning: 'b', matchScore: 50 },
      { templateId: 'a', reasoning: 'a', matchScore: 90 },
      { templateId: 'c', reasoning: 'c', matchScore: 70 },
    ];
    const result = filterRecommendations(unsorted, 0);
    expect(result[0].templateId).toBe('a');
    expect(result[1].templateId).toBe('c');
    expect(result[2].templateId).toBe('b');
  });

  it('always returns at least minRecommendations even if below threshold', () => {
    const lowScores = [
      { templateId: 'a', reasoning: 'a', matchScore: 30 },
      { templateId: 'b', reasoning: 'b', matchScore: 20 },
      { templateId: 'c', reasoning: 'c', matchScore: 10 },
    ];
    const result = filterRecommendations(lowScores, 60, 12, 3);
    expect(result).toHaveLength(3);
  });

  it('respects topN limit', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      templateId: `template-${i}`,
      reasoning: `reason-${i}`,
      matchScore: 90 - i,
    }));
    const result = filterRecommendations(many, 0, 5);
    expect(result).toHaveLength(5);
    expect(result[0].matchScore).toBe(90);
  });

  it('handles custom minScore', () => {
    const result = filterRecommendations(MOCK_RECOMMENDATIONS, 80, 12, 1);
    // Only fitness-coach (95) is above 80
    expect(result).toHaveLength(1);
    expect(result[0].templateId).toBe('fitness-coach');
  });

  it('handles empty array', () => {
    const result = filterRecommendations([]);
    expect(result).toHaveLength(0);
  });

  it('handles all scores above threshold', () => {
    const allHigh = [
      { templateId: 'a', reasoning: 'a', matchScore: 90 },
      { templateId: 'b', reasoning: 'b', matchScore: 85 },
      { templateId: 'c', reasoning: 'c', matchScore: 80 },
    ];
    const result = filterRecommendations(allHigh, 60);
    expect(result).toHaveLength(3);
  });
});

// ─── templatePaletteToColorPalette ────────────────────────────────────────────

describe('templatePaletteToColorPalette', () => {
  it('converts TemplatePalette to ColorPalette format', () => {
    const result = templatePaletteToColorPalette(MOCK_PALETTE);
    expect(result.id).toBe('ocean-blue');
    expect(result.name).toBe('Ocean Blue');
    expect(result.colors).toEqual([
      '#0ea5e9',
      '#06b6d4',
      '#3b82f6',
      '#0f172a',
      '#f8fafc',
    ]);
  });

  it('always returns 5 colors in order: primary, secondary, accent, background, text', () => {
    const result = templatePaletteToColorPalette(MOCK_PALETTE);
    expect(result.colors).toHaveLength(5);
    expect(result.colors[0]).toBe(MOCK_PALETTE.colors.primary);
    expect(result.colors[1]).toBe(MOCK_PALETTE.colors.secondary);
    expect(result.colors[2]).toBe(MOCK_PALETTE.colors.accent);
    expect(result.colors[3]).toBe(MOCK_PALETTE.colors.background);
    expect(result.colors[4]).toBe(MOCK_PALETTE.colors.text);
  });
});

// ─── getRecommendationHeaderText ──────────────────────────────────────────────

describe('getRecommendationHeaderText', () => {
  it('returns singular text for 1 recommendation', () => {
    expect(getRecommendationHeaderText(1)).toBe('Best template for your business');
  });

  it('returns plural text for multiple recommendations', () => {
    expect(getRecommendationHeaderText(3)).toBe('Top 3 recommendations for your business');
  });

  it('returns plural for 2 recommendations', () => {
    expect(getRecommendationHeaderText(2)).toBe('Top 2 recommendations for your business');
  });

  it('returns plural for 10 recommendations', () => {
    expect(getRecommendationHeaderText(10)).toBe('Top 10 recommendations for your business');
  });
});

