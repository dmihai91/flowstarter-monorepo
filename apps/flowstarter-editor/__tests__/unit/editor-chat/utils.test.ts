/**
 * Editor Chat Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateMessageId,
  ColorPaletteToColorPalette,
  normalizePath,
  buildWizardOutput,
} from '~/components/editor/editor-chat/utils';
import type { ColorPalette } from '~/components/editor/editor-chat/types';

describe('generateMessageId', () => {
  it('should generate unique IDs with user prefix', () => {
    const id1 = generateMessageId('user');
    const id2 = generateMessageId('user');

    expect(id1).toMatch(/^user-\d+-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique IDs with msg prefix', () => {
    const id1 = generateMessageId('msg');
    const id2 = generateMessageId('msg');

    expect(id1).toMatch(/^msg-\d+-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const id = generateMessageId('user');
    const after = Date.now();

    const timestamp = parseInt(id.split('-')[1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('ColorPaletteToColorPalette', () => {
  it('should convert valid ColorPalette to StoreColorPalette', () => {
    const palette: ColorPalette = {
      id: 'test-palette',
      name: 'Test Palette',
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF'],
    };

    const result = ColorPaletteToColorPalette(palette);

    expect(result.id).toBe('test-palette');
    expect(result.name).toBe('Test Palette');
    expect(result.colors).toEqual(['#FF0000', '#00FF00', '#0000FF', '#FFFFFF']);
  });

  it('should return default palette for null input', () => {
    const result = ColorPaletteToColorPalette(null);

    expect(result.id).toBe('default');
    expect(result.name).toBe('Default');
    expect(result.colors).toHaveLength(4);
  });

  it('should return default palette for insufficient colors', () => {
    const palette: ColorPalette = {
      id: 'incomplete',
      name: 'Incomplete',
      colors: ['#FF0000', '#00FF00'], // Only 2 colors
    };

    const result = ColorPaletteToColorPalette(palette);

    expect(result.id).toBe('default');
    expect(result.name).toBe('Default');
  });

  it('should return tuple of exactly 4 colors', () => {
    const palette: ColorPalette = {
      id: 'five-colors',
      name: 'Five Colors',
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'],
    };

    const result = ColorPaletteToColorPalette(palette);

    expect(result.colors).toHaveLength(4);
    expect(result.colors[0]).toBe('#FF0000');
    expect(result.colors[3]).toBe('#FFFFFF');
  });
});

describe('normalizePath', () => {
  it('should convert backslashes to forward slashes', () => {
    expect(normalizePath('src\\components\\Button.tsx')).toBe('/src/components/Button.tsx');
  });

  it('should ensure leading slash', () => {
    expect(normalizePath('src/index.ts')).toBe('/src/index.ts');
  });

  it('should not add duplicate leading slash', () => {
    expect(normalizePath('/src/index.ts')).toBe('/src/index.ts');
  });

  it('should remove double slashes', () => {
    expect(normalizePath('src//utils//helpers.ts')).toBe('/src/utils/helpers.ts');
  });

  it('should preserve protocol double slashes', () => {
    const result = normalizePath('https://example.com/path');
    expect(result).toContain('://');
  });

  it('should handle mixed slashes', () => {
    expect(normalizePath('src\\utils/helpers.ts')).toBe('/src/utils/helpers.ts');
  });

  it('should handle root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('should handle empty string', () => {
    expect(normalizePath('')).toBe('/');
  });
});

describe('buildWizardOutput', () => {
  const baseParams = {
    projectId: 'project-123',
    projectName: 'My Project',
    urlId: 'my-project-abc',
    description: 'A test project description',
    template: { id: 'landing', name: 'Landing Page', category: 'landing' },
    palette: { id: 'ocean', name: 'Ocean', colors: ['#0066CC', '#004D99', '#00BFFF', '#F0F8FF'] },
    font: { id: 'modern', name: 'Modern', heading: 'Inter', body: 'Inter' },
    businessInfo: {
      uvp: 'The best product ever',
      targetAudience: 'Developers',
      businessGoals: ['Build online presence', 'Generate leads'],
      brandTone: 'professional',
      pricingOffers: '$99/month',
    },
  };

  it('should build complete wizard output', () => {
    const result = buildWizardOutput(baseParams);

    expect(result.project.projectId).toBe('project-123');
    expect(result.project.name).toBe('My Project');
    expect(result.project.urlId).toBe('my-project-abc');
    expect(result.project.description).toBe('A test project description');
  });

  it('should include business info', () => {
    const result = buildWizardOutput(baseParams);

    expect(result.businessInfo?.uvp).toBe('The best product ever');
    expect(result.businessInfo?.targetAudience).toBe('Developers');
    expect(result.businessInfo?.businessGoals).toContain('Build online presence');
    expect(result.businessInfo?.brandTone).toBe('professional');
  });

  it('should include palette info', () => {
    const result = buildWizardOutput(baseParams);

    expect(result.palette.id).toBe('ocean');
    expect(result.palette.name).toBe('Ocean');
    expect(result.palette.colors).toHaveLength(4);
  });

  it('should include font info', () => {
    const result = buildWizardOutput(baseParams);

    expect(result.fonts.id).toBe('modern');
    expect(result.fonts.name).toBe('Modern');
    expect(result.fonts.heading).toBe('Inter');
    expect(result.fonts.body).toBe('Inter');
  });

  it('should include template info', () => {
    const result = buildWizardOutput(baseParams);

    expect(result.template.id).toBe('landing');
    expect(result.template.name).toBe('Landing Page');
    expect(result.template.category).toBe('landing');
  });

  it('should use defaults for missing business info', () => {
    const result = buildWizardOutput({
      ...baseParams,
      businessInfo: undefined,
    });

    expect(result.businessInfo?.uvp).toBe(baseParams.description);
    expect(result.businessInfo?.targetAudience).toBe('General audience');
    expect(result.businessInfo?.businessGoals).toContain('Build online presence');
  });

  it('should use defaults for missing palette', () => {
    const result = buildWizardOutput({
      ...baseParams,
      palette: null,
    });

    expect(result.palette.id).toBeDefined();
    expect(result.palette.colors).toHaveLength(5);
  });

  it('should use defaults for missing font', () => {
    const result = buildWizardOutput({
      ...baseParams,
      font: null,
    });

    expect(result.fonts.id).toBeDefined();
    expect(result.fonts.heading).toBeDefined();
    expect(result.fonts.body).toBeDefined();
  });

  it('should use defaults for missing template', () => {
    const result = buildWizardOutput({
      ...baseParams,
      template: null,
    });

    expect(result.template.id).toBe('default');
    expect(result.template.name).toBe('Default Template');
  });

  it('should include tier and sessionId', () => {
    const result = buildWizardOutput({
      ...baseParams,
      tier: 'premium',
      sessionId: 'session-xyz',
    });

    expect(result.tier).toBe('premium');
    expect(result.sessionId).toBe('session-xyz');
  });

  it('should include completedAt timestamp', () => {
    const before = Date.now();
    const result = buildWizardOutput(baseParams);
    const after = Date.now();

    expect(result.completedAt).toBeGreaterThanOrEqual(before);
    expect(result.completedAt).toBeLessThanOrEqual(after);
  });
});

