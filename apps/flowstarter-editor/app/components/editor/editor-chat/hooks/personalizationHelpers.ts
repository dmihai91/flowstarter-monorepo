/**
 * Personalization Helpers
 *
 * Pure functions extracted from the personalization step
 * (palette, font, logo selection) for testability.
 */

import type { TemplatePalette, TemplateFont } from '~/components/editor/template-preview/types';
import type { ColorPalette, SystemFont, LogoInfo } from '../types';

/**
 * Convert TemplatePalette to the app's ColorPalette format.
 */
export function toColorPalette(palette: TemplatePalette): ColorPalette {
  return {
    id: palette.id,
    name: palette.name,
    colors: [
      palette.colors.primary,
      palette.colors.secondary,
      palette.colors.accent,
      palette.colors.background,
    ],
  };
}

/**
 * Convert TemplateFont to SystemFont format.
 */
export function toSystemFont(font: TemplateFont): SystemFont {
  return {
    id: font.id,
    name: font.name,
    heading: font.heading,
    body: font.body,
  };
}

/**
 * Validate a ColorPalette has all required fields.
 */
export function isValidColorPalette(palette: unknown): palette is ColorPalette {
  if (!palette || typeof palette !== 'object') return false;
  const p = palette as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Array.isArray(p.colors) &&
    p.colors.length >= 4 &&
    p.colors.every((c: unknown) => typeof c === 'string')
  );
}

/**
 * Validate a SystemFont has all required fields.
 */
export function isValidSystemFont(font: unknown): font is SystemFont {
  if (!font || typeof font !== 'object') return false;
  const f = font as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.heading === 'string' &&
    typeof f.body === 'string'
  );
}

/**
 * Create a "skip" LogoInfo object.
 */
export function createSkipLogo(): LogoInfo {
  return { type: 'none' };
}

/**
 * Create an "uploaded" LogoInfo object.
 */
export function createUploadedLogo(url: string, file?: File): LogoInfo {
  return { type: 'uploaded', url, file };
}

/**
 * Create a "generated" LogoInfo object.
 */
export function createGeneratedLogo(url: string, prompt: string): LogoInfo {
  return { type: 'generated', url, prompt };
}

/**
 * Personalization section order.
 */
export const PERSONALIZATION_SECTIONS = ['palette', 'font', 'logo'] as const;

export type PersonalizationSection = (typeof PERSONALIZATION_SECTIONS)[number];

/**
 * Get the progress bar index for a given section.
 */
export function getSectionIndex(section: PersonalizationSection): number {
  return PERSONALIZATION_SECTIONS.indexOf(section);
}

/**
 * Get the next section after the current one.
 */
export function getNextSection(current: PersonalizationSection): PersonalizationSection | null {
  const idx = PERSONALIZATION_SECTIONS.indexOf(current);
  if (idx < 0 || idx >= PERSONALIZATION_SECTIONS.length - 1) return null;
  return PERSONALIZATION_SECTIONS[idx + 1];
}

