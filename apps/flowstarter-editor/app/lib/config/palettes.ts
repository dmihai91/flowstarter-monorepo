/**
 * Predefined Color Palettes for Website Customization
 */

export interface ColorPalette {
  id: string;
  name: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted?: string;
    border?: string;
  };
}

export const PREDEFINED_PALETTES: ColorPalette[] = [
  // Blues & Cyans
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea vibes',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#3b82f6',
      background: '#0f172a',
      text: '#f8fafc',
      muted: '#64748b',
      border: '#1e293b',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo elegance',
    colors: {
      primary: '#6366f1',
      secondary: '#818cf8',
      accent: '#a5b4fc',
      background: '#0f0f23',
      text: '#e0e7ff',
      muted: '#6b7280',
      border: '#1e1b4b',
    },
  },
  {
    id: 'electric',
    name: 'Electric',
    description: 'Vibrant neon blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#06b6d4',
      background: '#030712',
      text: '#f9fafb',
      muted: '#6b7280',
      border: '#1f2937',
    },
  },

  // Greens & Teals
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature inspired',
    colors: {
      primary: '#22c55e',
      secondary: '#10b981',
      accent: '#14b8a6',
      background: '#064e3b',
      text: '#ecfdf5',
      muted: '#6ee7b7',
      border: '#065f46',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Rich gemstone green',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#022c22',
      text: '#d1fae5',
      muted: '#6b7280',
      border: '#064e3b',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Hacker aesthetic',
    colors: {
      primary: '#00ff41',
      secondary: '#00cc33',
      accent: '#39ff14',
      background: '#0d0d0d',
      text: '#00ff41',
      muted: '#008f11',
      border: '#003b00',
    },
  },

  // Purples & Pinks
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple dreams',
    colors: {
      primary: '#a855f7',
      secondary: '#8b5cf6',
      accent: '#c084fc',
      background: '#1e1b4b',
      text: '#faf5ff',
      muted: '#a78bfa',
      border: '#312e81',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Romantic pink tones',
    colors: {
      primary: '#f43f5e',
      secondary: '#fb7185',
      accent: '#ec4899',
      background: '#4c0519',
      text: '#fff1f2',
      muted: '#fda4af',
      border: '#881337',
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: '80s retro future',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ff6ec7',
      background: '#1a0a2e',
      text: '#ffffff',
      muted: '#9333ea',
      border: '#2d1b69',
    },
  },
  {
    id: 'grape',
    name: 'Grape',
    description: 'Deep purple richness',
    colors: {
      primary: '#9333ea',
      secondary: '#a855f7',
      accent: '#d946ef',
      background: '#0c0014',
      text: '#f5d0fe',
      muted: '#7c3aed',
      border: '#3b0764',
    },
  },

  // Oranges & Reds
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm evening glow',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#f59e0b',
      background: '#451a03',
      text: '#fff7ed',
      muted: '#fdba74',
      border: '#7c2d12',
    },
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Tropical warmth',
    colors: {
      primary: '#ff6b6b',
      secondary: '#ffa07a',
      accent: '#ffd93d',
      background: '#2d1b1b',
      text: '#fef9c3',
      muted: '#fca5a5',
      border: '#450a0a',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Bold and powerful',
    colors: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#f87171',
      background: '#1c0a0a',
      text: '#fef2f2',
      muted: '#f87171',
      border: '#450a0a',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Fiery warmth',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: '#1c1917',
      text: '#fef3c7',
      muted: '#a8a29e',
      border: '#292524',
    },
  },

  // Neutrals & Monochrome
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Classic black & white',
    colors: {
      primary: '#ffffff',
      secondary: '#e5e5e5',
      accent: '#a3a3a3',
      background: '#0a0a0a',
      text: '#fafafa',
      muted: '#737373',
      border: '#262626',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Professional gray',
    colors: {
      primary: '#94a3b8',
      secondary: '#cbd5e1',
      accent: '#38bdf8',
      background: '#0f172a',
      text: '#f1f5f9',
      muted: '#64748b',
      border: '#1e293b',
    },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    description: 'Deep neutral elegance',
    colors: {
      primary: '#f5f5f5',
      secondary: '#d4d4d4',
      accent: '#fbbf24',
      background: '#171717',
      text: '#fafafa',
      muted: '#737373',
      border: '#262626',
    },
  },

  // Special & Unique
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights magic',
    colors: {
      primary: '#22d3ee',
      secondary: '#a78bfa',
      accent: '#4ade80',
      background: '#0c1222',
      text: '#f0f9ff',
      muted: '#67e8f9',
      border: '#1e3a5f',
    },
  },
  {
    id: 'coffee',
    name: 'Coffee',
    description: 'Warm café aesthetic',
    colors: {
      primary: '#d4a574',
      secondary: '#a67c52',
      accent: '#f5d0a9',
      background: '#1a120b',
      text: '#f5f0eb',
      muted: '#8b7355',
      border: '#2d1f14',
    },
  },
  {
    id: 'tokyo',
    name: 'Tokyo Night',
    description: 'Neon city lights',
    colors: {
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#f7768e',
      background: '#1a1b26',
      text: '#c0caf5',
      muted: '#565f89',
      border: '#24283b',
    },
  },
];

/**
 * Light theme palettes (for light mode sites)
 */
export const LIGHT_PALETTES: ColorPalette[] = [
  // Blues
  {
    id: 'clean',
    name: 'Clean',
    description: 'Professional blue',
    colors: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      accent: '#0ea5e9',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Light and airy',
    colors: {
      primary: '#0284c7',
      secondary: '#0ea5e9',
      accent: '#06b6d4',
      background: '#f0f9ff',
      text: '#0c4a6e',
      muted: '#7dd3fc',
      border: '#bae6fd',
    },
  },

  // Greens
  {
    id: 'natural',
    name: 'Natural',
    description: 'Fresh organic feel',
    colors: {
      primary: '#16a34a',
      secondary: '#22c55e',
      accent: '#84cc16',
      background: '#f0fdf4',
      text: '#14532d',
      muted: '#86efac',
      border: '#bbf7d0',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    description: 'Cool and refreshing',
    colors: {
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
      background: '#f0fdfa',
      text: '#134e4a',
      muted: '#5eead4',
      border: '#99f6e4',
    },
  },

  // Oranges & Warm
  {
    id: 'warm',
    name: 'Warm',
    description: 'Friendly orange tones',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
      background: '#fffbeb',
      text: '#78350f',
      muted: '#fdba74',
      border: '#fed7aa',
    },
  },
  {
    id: 'peach',
    name: 'Peach',
    description: 'Soft and inviting',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: '#fff7ed',
      text: '#7c2d12',
      muted: '#fdba74',
      border: '#fed7aa',
    },
  },

  // Purples & Pinks
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated purple',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#faf5ff',
      text: '#3b0764',
      muted: '#c4b5fd',
      border: '#ddd6fe',
    },
  },
  {
    id: 'blossom',
    name: 'Blossom',
    description: 'Soft pink flowers',
    colors: {
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#fdf2f8',
      text: '#831843',
      muted: '#f9a8d4',
      border: '#fbcfe8',
    },
  },

  // Neutrals
  {
    id: 'paper',
    name: 'Paper',
    description: 'Classic document style',
    colors: {
      primary: '#374151',
      secondary: '#4b5563',
      accent: '#2563eb',
      background: '#fafaf9',
      text: '#1f2937',
      muted: '#9ca3af',
      border: '#e5e7eb',
    },
  },
  {
    id: 'sand',
    name: 'Sand',
    description: 'Warm neutral tones',
    colors: {
      primary: '#78716c',
      secondary: '#a8a29e',
      accent: '#d97706',
      background: '#fafaf9',
      text: '#44403c',
      muted: '#d6d3d1',
      border: '#e7e5e4',
    },
  },

  // Special
  {
    id: 'sunrise',
    name: 'Sunrise',
    description: 'Gradient warmth',
    colors: {
      primary: '#f43f5e',
      secondary: '#fb923c',
      accent: '#fbbf24',
      background: '#fffbeb',
      text: '#78350f',
      muted: '#fda4af',
      border: '#fecaca',
    },
  },
  {
    id: 'ocean-light',
    name: 'Ocean Light',
    description: 'Coastal serenity',
    colors: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      background: '#ecfeff',
      text: '#164e63',
      muted: '#67e8f9',
      border: '#a5f3fc',
    },
  },
];

export const DEFAULT_PALETTE = PREDEFINED_PALETTES[0];

/**
 * Generate Tailwind config colors from palette
 */
export function generateTailwindColors(palette: ColorPalette): string {
  return `
    colors: {
      primary: '${palette.colors.primary}',
      secondary: '${palette.colors.secondary}',
      accent: '${palette.colors.accent}',
      background: '${palette.colors.background}',
      foreground: '${palette.colors.text}',
    },`;
}

