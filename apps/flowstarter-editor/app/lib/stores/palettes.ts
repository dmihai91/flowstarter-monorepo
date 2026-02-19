import { atom } from 'nanostores';

export interface ColorPalette {
  id: string;
  name: string;
  colors: [string, string, string, string]; // primary, secondary, accent, background
}

/**
 * Color themes supported by the flowstarter-library MCP server
 * These MUST match the themes defined in templates-showcase/src/App.tsx
 *
 * The MCP server accepts: /api/templates/:slug/live?theme=<id>&mode=light|dark
 */
export const PALETTES: ColorPalette[] = [
  { id: 'modern', name: 'Modern', colors: ['#3b82f6', '#8b5cf6', '#60a5fa', '#0f172a'] },
  { id: 'vibrant', name: 'Vibrant', colors: ['#f43f5e', '#f97316', '#fb7185', '#1c1210'] },
  { id: 'ocean', name: 'Ocean', colors: ['#06b6d4', '#3b82f6', '#22d3ee', '#0c1222'] },
  { id: 'forest', name: 'Forest', colors: ['#10b981', '#059669', '#34d399', '#052e16'] },
  { id: 'midnight', name: 'Midnight', colors: ['#6366f1', '#a855f7', '#818cf8', '#0f0f23'] },
  { id: 'sunset', name: 'Sunset', colors: ['#f97316', '#ec4899', '#fb923c', '#451a03'] },
  { id: 'minimal', name: 'Minimal', colors: ['#374151', '#6b7280', '#9ca3af', '#111827'] },
  { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#ec4899', '#fb7185', '#4c0519'] },
];

/**
 * No separate light palettes - MCP server uses mode=light|dark parameter
 * Light mode shows same palettes but with light background
 */
export const LIGHT_PALETTES: ColorPalette[] = [];

// Backup palettes - kept for compatibility but getFilteredPalettes now avoids duplicates
export const BACKUP_PALETTES: ColorPalette[] = [
  { id: 'sunset', name: 'Sunset', colors: ['#f97316', '#ec4899', '#fb923c', '#451a03'] },
  { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#ec4899', '#fb7185', '#4c0519'] },
];

// Selected palette store
export const selectedPaletteStore = atom<ColorPalette>(PALETTES[0]);

// Template's original palette (from MCP server)
export const templatePaletteStore = atom<ColorPalette | null>(null);

// Custom palette colors
export const customPaletteStore = atom<ColorPalette>({
  id: 'custom',
  name: 'Custom',
  colors: ['#3b82f6', '#8b5cf6', '#60a5fa', '#0f172a'],
});

/*
 * Helper to check if palette is light theme
 * Since MCP server uses mode=light|dark, this is no longer based on palette ID
 * Light/dark mode is controlled separately via the mode parameter
 */
export function isLightPalette(_paletteId: string): boolean {
  // All MCP palettes work with both light and dark mode
  return false;
}

// Check if two colors are similar (within threshold)
function colorsAreSimilar(color1: string, color2: string, threshold = 50): boolean {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  const distance = Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);

  return distance < threshold;
}

// Type for palette with flexible colors array (for compatibility with SimplePalette)
interface PaletteWithColors {
  id: string;
  name: string;
  colors: string[];
}

// Get palettes excluding any that are too similar to the template
export function getFilteredPalettes(templatePalette: PaletteWithColors | ColorPalette | null): ColorPalette[] {
  if (!templatePalette) {
    return PALETTES;
  }

  const templatePrimary = templatePalette.colors[0];

  /*
   * Filter out palettes that are too similar to the template's primary color
   * This prevents showing near-duplicate options
   */
  return PALETTES.filter((palette) => {
    return !colorsAreSimilar(palette.colors[0], templatePrimary);
  });
}

// Get all palettes for the theme picker (same as filtered since MCP uses mode for light/dark)
export function getAllPalettes(templatePalette: ColorPalette | null): ColorPalette[] {
  return getFilteredPalettes(templatePalette);
}

