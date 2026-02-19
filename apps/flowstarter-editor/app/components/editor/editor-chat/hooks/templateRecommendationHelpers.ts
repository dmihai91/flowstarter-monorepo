/**
 * Template Recommendation Helpers
 *
 * Pure functions extracted from the template recommendation system
 * for testability.
 */

import type { TemplateRecommendation, Template, TemplatePalette } from '~/components/editor/template-preview/types';
import type { ColorPalette } from '../types';

/**
 * Parse LLM response into recommendation array.
 * Handles markdown code blocks and raw JSON.
 */
export function parseRecommendationResponse(
  response: string,
): Array<{ templateId: string; reasoning: string; matchScore: number }> {
  let cleaned = response.trim();

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned) as {
    recommendations?: Array<{ templateId: string; reasoning: string; matchScore: number }>;
  };

  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error('Invalid LLM response format - missing recommendations array');
  }

  return parsed.recommendations;
}

/**
 * Filter and sort recommendations by minimum score threshold.
 * Always returns at least MIN_RECOMMENDATIONS results.
 */
export function filterRecommendations(
  recommendations: Array<{ templateId: string; reasoning: string; matchScore: number }>,
  minScore: number = 60,
  topN: number = 3,
  minRecommendations: number = 3,
): Array<{ templateId: string; reasoning: string; matchScore: number }> {
  // Sort by score descending
  const sorted = [...recommendations].sort((a, b) => b.matchScore - a.matchScore);

  // Filter by minimum score, but always include at least minRecommendations
  const aboveThreshold = sorted.filter((rec) => rec.matchScore >= minScore);

  if (aboveThreshold.length >= minRecommendations) {
    return aboveThreshold.slice(0, topN);
  }

  return sorted.slice(0, Math.max(minRecommendations, aboveThreshold.length)).slice(0, topN);
}

/**
 * Convert TemplatePalette to the app's ColorPalette format.
 */
export function templatePaletteToColorPalette(palette: TemplatePalette): ColorPalette {
  return {
    id: palette.id,
    name: palette.name,
    colors: [
      palette.colors.primary,
      palette.colors.secondary,
      palette.colors.accent,
      palette.colors.background,
      palette.colors.text,
    ],
  };
}

/**
 * Get recommendation gallery header text.
 */
export function getRecommendationHeaderText(count: number): string {
  if (count === 1) {
    return 'Best template for your business';
  }
  return `Top ${count} recommendations for your business`;
}

