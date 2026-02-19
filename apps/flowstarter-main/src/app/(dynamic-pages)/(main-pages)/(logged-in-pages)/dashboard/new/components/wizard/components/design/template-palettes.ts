import type { ColorPalette } from './ColorPaletteSelector';

/**
 * Template Color Palettes
 *
 * These palettes are derived from the Creative Tim Design System
 * and match the color schemes used in template previews.
 */

export const templatePalettes: Record<string, ColorPalette> = {
  // ============================================
  // PRO TEMPLATES (Premium with Creative Tim styling)
  // ============================================

  // Personal Brand Pro - Blue/Purple/Indigo gradient
  'personal-brand-pro': {
    name: 'Professional',
    description: 'Blue to purple gradient - elegant and trustworthy',
    badge: 'Template',
    colors: {
      primary: '#5e72e4',
      secondary: '#825ee4',
      accent: '#8965e0',
      highlight: '#f3a4b5',
    },
  },

  // Local Business Pro - Orange/Rose/Pink gradient
  'local-business-pro': {
    name: 'Warm & Inviting',
    description: 'Orange to pink gradient - friendly and approachable',
    badge: 'Template',
    colors: {
      primary: '#f97316',
      secondary: '#f43f5e',
      accent: '#ec4899',
      highlight: '#fbb140',
    },
  },

  // SaaS Product Pro - Purple/Indigo/Blue gradient
  'saas-product-pro': {
    name: 'Tech Modern',
    description: 'Purple to blue gradient - innovative and forward-thinking',
    badge: 'Template',
    colors: {
      primary: '#9333ea',
      secondary: '#6366f1',
      accent: '#2563eb',
      highlight: '#7c3aed',
    },
  },

  // ============================================
  // PERSONAL BRAND TEMPLATES
  // ============================================

  'personal-brand-1': {
    name: 'Corporate Blue',
    description: 'Clean professional tones for consultants',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      highlight: '#93c5fd',
    },
  },

  'personal-brand-2': {
    name: 'Creative Bold',
    description: 'Vibrant colors for creative professionals',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#c084fc',
      highlight: '#e879f9',
    },
  },

  // ============================================
  // LOCAL BUSINESS TEMPLATES
  // ============================================

  'local-business-1': {
    name: 'Restaurant Warm',
    description: 'Appetizing warm tones for food businesses',
    colors: {
      primary: '#dc2626',
      secondary: '#ea580c',
      accent: '#f97316',
      highlight: '#fbbf24',
    },
  },

  'local-business-2': {
    name: 'Service Trust',
    description: 'Reliable tones for service businesses',
    colors: {
      primary: '#0f766e',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
      highlight: '#5eead4',
    },
  },

  // ============================================
  // SERVICES & AGENCY TEMPLATES
  // ============================================

  'services-agency-1': {
    name: 'Agency Dynamic',
    description: 'Bold and confident for marketing agencies',
    colors: {
      primary: '#1e3a8a',
      secondary: '#2563eb',
      accent: '#f59e0b',
      highlight: '#fbbf24',
    },
  },

  'services-portfolio-1': {
    name: 'Portfolio Minimal',
    description: 'Clean and elegant for portfolios',
    colors: {
      primary: '#18181b',
      secondary: '#3f3f46',
      accent: '#71717a',
      highlight: '#a1a1aa',
    },
  },

  // ============================================
  // SAAS & PRODUCT TEMPLATES
  // ============================================

  'saas-product-launch-1': {
    name: 'Launch Blue',
    description: 'Trust-building blues for SaaS launches',
    colors: {
      primary: '#0369a1',
      secondary: '#0284c7',
      accent: '#0ea5e9',
      highlight: '#38bdf8',
    },
  },

  'saas-product-launch-2': {
    name: 'Launch Gradient',
    description: 'Modern gradient for product launches',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      highlight: '#c4b5fd',
    },
  },

  // ============================================
  // EDUCATION & EVENTS TEMPLATES
  // ============================================

  'education-course-1': {
    name: 'Education Trust',
    description: 'Trustworthy tones for courses',
    colors: {
      primary: '#065f46',
      secondary: '#059669',
      accent: '#10b981',
      highlight: '#34d399',
    },
  },

  'events-workshop-1': {
    name: 'Event Energy',
    description: 'Energetic colors for events',
    colors: {
      primary: '#be123c',
      secondary: '#e11d48',
      accent: '#f43f5e',
      highlight: '#fb7185',
    },
  },

  // ============================================
  // E-COMMERCE TEMPLATES
  // ============================================

  'ecom-light-single-1': {
    name: 'Shop Elegant',
    description: 'Elegant tones for single products',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#d97706',
      highlight: '#fbbf24',
    },
  },

  'ecom-light-creator-1': {
    name: 'Creator Vibrant',
    description: 'Vibrant palette for creator merch',
    colors: {
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
      highlight: '#f9a8d4',
    },
  },

  // ============================================
  // DEFAULT FALLBACK
  // ============================================

  default: {
    name: 'Classic',
    description: 'Balanced blue palette - versatile and clean',
    colors: {
      primary: '#5e72e4',
      secondary: '#2dce89',
      accent: '#fb6340',
      highlight: '#8965e0',
    },
  },
};

/**
 * Alternative palettes that can be used with any template
 * Names match Figma design: Modern, Vibrant, Ocean, Forest, Midnight, Sunset
 */
export const alternativePalettes: ColorPalette[] = [
  {
    name: 'Modern',
    description: 'Contemporary blue and purple',
    colors: {
      primary: '#5e72e4',
      secondary: '#825ee4',
      accent: '#38bdf8',
    },
  },
  {
    name: 'Vibrant',
    description: 'Bold and energetic colors',
    colors: {
      primary: '#ef4444',
      secondary: '#f97316',
      accent: '#fb7185',
    },
  },
  {
    name: 'Ocean',
    description: 'Calm teal and cyan tones',
    colors: {
      primary: '#0d9488',
      secondary: '#06b6d4',
      accent: '#22d3ee',
    },
  },
  {
    name: 'Forest',
    description: 'Natural green palette',
    colors: {
      primary: '#16a34a',
      secondary: '#22c55e',
      accent: '#4ade80',
    },
  },
  {
    name: 'Midnight',
    description: 'Deep indigo and purple',
    colors: {
      primary: '#4f46e5',
      secondary: '#6366f1',
      accent: '#a78bfa',
    },
  },
  {
    name: 'Sunset',
    description: 'Warm amber and orange tones',
    colors: {
      primary: '#f59e0b',
      secondary: '#fb923c',
      accent: '#fbbf24',
    },
  },
];

/**
 * Get palettes for a specific template
 * Returns the template palette first, followed by alternative palettes
 */
export function getPalettesForTemplate(templateId: string): ColorPalette[] {
  const templatePalette =
    templatePalettes[templateId] || templatePalettes.default;

  // Mark the template palette with a badge if it matches
  const mainPalette = {
    ...templatePalette,
    badge: templatePalettes[templateId] ? 'Original' : undefined,
  };

  return [mainPalette, ...alternativePalettes];
}

/**
 * Create a custom palette entry
 */
export function createCustomPalette(
  colors: Record<string, string>,
  name = 'Custom'
): ColorPalette {
  return {
    name,
    description: 'Your custom color selection',
    badge: 'Custom',
    colors,
  };
}
