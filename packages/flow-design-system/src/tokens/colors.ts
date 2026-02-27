/**
 * Flowstarter Design System - Color Tokens
 * 
 * These are the canonical color values used across all Flowstarter apps.
 * Import and use these instead of hardcoding colors.
 */

export const colors = {
  // Brand
  brand: {
    primary: 'hsl(233, 65%, 58%)',      // Main brand indigo
    primaryLight: 'hsl(233, 65%, 68%)',
    primaryDark: 'hsl(233, 65%, 48%)',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    gradientHover: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
  },

  // Accent colors
  accent: {
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F59E0B',
    red: '#EF4444',
  },

  // Neutrals - Light mode
  light: {
    bg: {
      primary: '#ffffff',
      secondary: '#f4f4f5',    // zinc-100
      tertiary: '#e4e4e7',     // zinc-200
      elevated: '#ffffff',
    },
    text: {
      primary: '#09090b',      // zinc-950
      secondary: '#3f3f46',    // zinc-700
      tertiary: '#71717a',     // zinc-500
      muted: '#a1a1aa',        // zinc-400
    },
    border: {
      default: '#d4d4d8',      // zinc-300
      light: '#e4e4e7',        // zinc-200
      strong: '#a1a1aa',       // zinc-400
    },
  },

  // Neutrals - Dark mode
  dark: {
    bg: {
      primary: '#0a0a0c',
      secondary: '#101012',
      tertiary: '#18181b',     // zinc-900
      elevated: '#27272a',     // zinc-800
    },
    text: {
      primary: '#fafafa',      // zinc-50
      secondary: '#d4d4d8',    // zinc-300
      tertiary: '#a1a1aa',     // zinc-400
      muted: '#71717a',        // zinc-500
    },
    border: {
      default: '#27272a',      // zinc-800
      light: '#3f3f46',        // zinc-700
      strong: '#52525b',       // zinc-600
    },
  },

  // Semantic
  semantic: {
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    error: '#EF4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
  },
} as const;

// CSS custom properties
export const cssVariables = `
:root {
  /* Brand */
  --flow-brand-primary: ${colors.brand.primary};
  --flow-brand-gradient: ${colors.brand.gradient};
  
  /* Accent */
  --flow-accent-purple: ${colors.accent.purple};
  --flow-accent-cyan: ${colors.accent.cyan};
  --flow-accent-blue: ${colors.accent.blue};
  
  /* Legacy alias */
  --purple: ${colors.brand.primary};
}

[data-theme='light'], :root:not([data-theme='dark']) {
  --flow-bg-primary: ${colors.light.bg.primary};
  --flow-bg-secondary: ${colors.light.bg.secondary};
  --flow-bg-tertiary: ${colors.light.bg.tertiary};
  --flow-bg-elevated: ${colors.light.bg.elevated};
  
  --flow-text-primary: ${colors.light.text.primary};
  --flow-text-secondary: ${colors.light.text.secondary};
  --flow-text-tertiary: ${colors.light.text.tertiary};
  
  --flow-border-default: ${colors.light.border.default};
  --flow-border-light: ${colors.light.border.light};
}

[data-theme='dark'] {
  --flow-bg-primary: ${colors.dark.bg.primary};
  --flow-bg-secondary: ${colors.dark.bg.secondary};
  --flow-bg-tertiary: ${colors.dark.bg.tertiary};
  --flow-bg-elevated: ${colors.dark.bg.elevated};
  
  --flow-text-primary: ${colors.dark.text.primary};
  --flow-text-secondary: ${colors.dark.text.secondary};
  --flow-text-tertiary: ${colors.dark.text.tertiary};
  
  --flow-border-default: ${colors.dark.border.default};
  --flow-border-light: ${colors.dark.border.light};
}
`;
