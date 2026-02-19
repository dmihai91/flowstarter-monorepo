/**
 * Personalization Helpers - Unit Tests
 *
 * Tests the pure functions for palette/font conversion,
 * validation, logo creation, and section navigation.
 */

import { describe, it, expect } from 'vitest';
import {
  toColorPalette,
  toSystemFont,
  isValidColorPalette,
  isValidSystemFont,
  createSkipLogo,
  createUploadedLogo,
  createGeneratedLogo,
  getSectionIndex,
  getNextSection,
  PERSONALIZATION_SECTIONS,
} from './personalizationHelpers';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_TEMPLATE_PALETTE = {
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

const MOCK_TEMPLATE_FONT = {
  id: 'modern',
  name: 'Modern',
  heading: 'Inter',
  body: 'Inter',
  googleFonts: 'Inter:wght@400;500;600;700',
};

// ─── toColorPalette ───────────────────────────────────────────────────────────

describe('toColorPalette', () => {
  it('converts TemplatePalette to ColorPalette', () => {
    const result = toColorPalette(MOCK_TEMPLATE_PALETTE);
    expect(result.id).toBe('ocean-blue');
    expect(result.name).toBe('Ocean Blue');
    expect(result.colors).toEqual(['#0ea5e9', '#06b6d4', '#3b82f6', '#0f172a']);
  });

  it('returns 4 colors (no text color)', () => {
    const result = toColorPalette(MOCK_TEMPLATE_PALETTE);
    expect(result.colors).toHaveLength(4);
  });

  it('preserves color order: primary, secondary, accent, background', () => {
    const result = toColorPalette(MOCK_TEMPLATE_PALETTE);
    expect(result.colors[0]).toBe(MOCK_TEMPLATE_PALETTE.colors.primary);
    expect(result.colors[1]).toBe(MOCK_TEMPLATE_PALETTE.colors.secondary);
    expect(result.colors[2]).toBe(MOCK_TEMPLATE_PALETTE.colors.accent);
    expect(result.colors[3]).toBe(MOCK_TEMPLATE_PALETTE.colors.background);
  });
});

// ─── toSystemFont ─────────────────────────────────────────────────────────────

describe('toSystemFont', () => {
  it('converts TemplateFont to SystemFont', () => {
    const result = toSystemFont(MOCK_TEMPLATE_FONT);
    expect(result.id).toBe('modern');
    expect(result.name).toBe('Modern');
    expect(result.heading).toBe('Inter');
    expect(result.body).toBe('Inter');
  });

  it('does not include googleFonts in output', () => {
    const result = toSystemFont(MOCK_TEMPLATE_FONT);
    // The type allows googleFonts but toSystemFont doesn't copy it
    expect(result).toEqual({
      id: 'modern',
      name: 'Modern',
      heading: 'Inter',
      body: 'Inter',
    });
  });

  it('handles different heading/body fonts', () => {
    const font = { id: 'classic', name: 'Classic', heading: 'Playfair Display', body: 'Source Sans Pro' };
    const result = toSystemFont(font);
    expect(result.heading).toBe('Playfair Display');
    expect(result.body).toBe('Source Sans Pro');
  });
});

// ─── isValidColorPalette ──────────────────────────────────────────────────────

describe('isValidColorPalette', () => {
  it('returns true for valid palette', () => {
    expect(
      isValidColorPalette({
        id: 'test',
        name: 'Test',
        colors: ['#000', '#111', '#222', '#333'],
      }),
    ).toBe(true);
  });

  it('returns true for palette with 5 colors', () => {
    expect(
      isValidColorPalette({
        id: 'test',
        name: 'Test',
        colors: ['#000', '#111', '#222', '#333', '#444'],
      }),
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidColorPalette(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidColorPalette(undefined)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isValidColorPalette('not a palette')).toBe(false);
  });

  it('returns false when id is missing', () => {
    expect(isValidColorPalette({ name: 'Test', colors: ['#000', '#111', '#222', '#333'] })).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(isValidColorPalette({ id: 'test', colors: ['#000', '#111', '#222', '#333'] })).toBe(false);
  });

  it('returns false when colors has fewer than 4 items', () => {
    expect(isValidColorPalette({ id: 'test', name: 'Test', colors: ['#000', '#111'] })).toBe(false);
  });

  it('returns false when colors is not an array', () => {
    expect(isValidColorPalette({ id: 'test', name: 'Test', colors: 'not an array' })).toBe(false);
  });

  it('returns false when colors contains non-strings', () => {
    expect(isValidColorPalette({ id: 'test', name: 'Test', colors: [123, 456, 789, 0] })).toBe(false);
  });
});

// ─── isValidSystemFont ────────────────────────────────────────────────────────

describe('isValidSystemFont', () => {
  it('returns true for valid font', () => {
    expect(
      isValidSystemFont({
        id: 'modern',
        name: 'Modern',
        heading: 'Inter',
        body: 'Inter',
      }),
    ).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSystemFont(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidSystemFont(undefined)).toBe(false);
  });

  it('returns false when id is missing', () => {
    expect(isValidSystemFont({ name: 'Modern', heading: 'Inter', body: 'Inter' })).toBe(false);
  });

  it('returns false when heading is missing', () => {
    expect(isValidSystemFont({ id: 'modern', name: 'Modern', body: 'Inter' })).toBe(false);
  });

  it('returns false when body is missing', () => {
    expect(isValidSystemFont({ id: 'modern', name: 'Modern', heading: 'Inter' })).toBe(false);
  });

  it('returns false when fields are wrong type', () => {
    expect(isValidSystemFont({ id: 123, name: 'Modern', heading: 'Inter', body: 'Inter' })).toBe(false);
  });
});

// ─── Logo Creation ────────────────────────────────────────────────────────────

describe('createSkipLogo', () => {
  it('returns type "none"', () => {
    const logo = createSkipLogo();
    expect(logo.type).toBe('none');
  });

  it('has no url, file, or prompt', () => {
    const logo = createSkipLogo();
    expect(logo.url).toBeUndefined();
    expect(logo.file).toBeUndefined();
    expect(logo.prompt).toBeUndefined();
  });
});

describe('createUploadedLogo', () => {
  it('returns type "uploaded" with url', () => {
    const logo = createUploadedLogo('https://example.com/logo.png');
    expect(logo.type).toBe('uploaded');
    expect(logo.url).toBe('https://example.com/logo.png');
  });

  it('includes file when provided', () => {
    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const logo = createUploadedLogo('https://example.com/logo.png', file);
    expect(logo.file).toBe(file);
  });
});

describe('createGeneratedLogo', () => {
  it('returns type "generated" with url and prompt', () => {
    const logo = createGeneratedLogo('https://example.com/gen.png', 'minimalist fitness logo');
    expect(logo.type).toBe('generated');
    expect(logo.url).toBe('https://example.com/gen.png');
    expect(logo.prompt).toBe('minimalist fitness logo');
  });
});

// ─── Section Navigation ─────────────────────────────────────────────────────

describe('PERSONALIZATION_SECTIONS', () => {
  it('has exactly 3 sections', () => {
    expect(PERSONALIZATION_SECTIONS).toHaveLength(3);
  });

  it('is in correct order: palette → font → logo', () => {
    expect(PERSONALIZATION_SECTIONS).toEqual(['palette', 'font', 'logo']);
  });
});

describe('getSectionIndex', () => {
  it('returns 0 for palette', () => {
    expect(getSectionIndex('palette')).toBe(0);
  });

  it('returns 1 for font', () => {
    expect(getSectionIndex('font')).toBe(1);
  });

  it('returns 2 for logo', () => {
    expect(getSectionIndex('logo')).toBe(2);
  });
});

describe('getNextSection', () => {
  it('returns "font" after "palette"', () => {
    expect(getNextSection('palette')).toBe('font');
  });

  it('returns "logo" after "font"', () => {
    expect(getNextSection('font')).toBe('logo');
  });

  it('returns null after "logo" (last section)', () => {
    expect(getNextSection('logo')).toBeNull();
  });
});

