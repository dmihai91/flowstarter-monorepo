import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

export function useThemeStyles() {
  const theme = useStore(themeStore);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { theme, isDark };
}

// Shared color utilities for consistent theming
export const getColors = (isDark: boolean) => {
  // All values from @flowstarter/flow-design-system tokens
  // colors.ts, shadows.ts, spacing.ts
  const bg = isDark ? {
    primary: '#0a0a0c',      // colors.dark.bg.primary
    secondary: '#101012',    // colors.dark.bg.secondary
    tertiary: '#18181b',     // colors.dark.bg.tertiary
    elevated: '#27272a',     // colors.dark.bg.elevated
  } : {
    primary: '#ffffff',      // colors.light.bg.primary
    secondary: '#f4f4f5',   // colors.light.bg.secondary
    tertiary: '#e4e4e7',    // colors.light.bg.tertiary
    elevated: '#ffffff',     // colors.light.bg.elevated
  };

  const text = isDark ? {
    primary: '#fafafa',      // colors.dark.text.primary
    secondary: '#d4d4d8',   // colors.dark.text.secondary
    tertiary: '#a1a1aa',    // colors.dark.text.tertiary
    muted: '#71717a',       // colors.dark.text.muted
  } : {
    primary: '#09090b',      // colors.light.text.primary
    secondary: '#3f3f46',   // colors.light.text.secondary
    tertiary: '#71717a',    // colors.light.text.tertiary
    muted: '#a1a1aa',       // colors.light.text.muted
  };

  const border = isDark ? {
    default: '#27272a',      // colors.dark.border.default
    light: '#3f3f46',       // colors.dark.border.light
    strong: '#52525b',      // colors.dark.border.strong
  } : {
    default: '#d4d4d8',      // colors.light.border.default
    light: '#e4e4e7',       // colors.light.border.light
    strong: '#a1a1aa',      // colors.light.border.strong
  };

  return {
    // Brand — from colors.brand
    primaryGradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', // colors.brand.gradient
    primaryShadow: isDark
      ? '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.2)'  // glassShadows.glassDark-like
      : '0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)', // glassShadows.glass-like
    primaryShadowLarge: isDark
      ? '0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 12px 40px rgba(0, 0, 0, 0.15)' // shadows.glassHover
      : '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)', // glassShadows.elevated

    // Backgrounds — semi-transparent for FlowBackground to show through
    bgPrimary: bg.primary,
    bgSecondary: isDark ? 'rgba(16, 16, 18, 0.75)' : 'rgba(244, 244, 245, 0.88)', // bg.secondary with alpha
    bgTertiary: isDark ? 'rgba(24, 24, 27, 0.5)' : bg.elevated, // bg.tertiary with alpha
    bgHeader: isDark ? 'rgba(16, 16, 18, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    bgGradient: 'transparent',

    // Surfaces — glass layers
    surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
    surfaceLight: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.025)',
    surfaceMedium: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    surfaceActive: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    surfaceSelected: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
    surfaceHover: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)',

    // Borders — from design system tokens with alpha variants
    borderSubtle: `1px solid ${isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(228, 228, 231, 0.5)'}`, // border.default alpha
    borderLight: `1px solid ${isDark ? border.light : border.light}`,
    borderMedium: `1px solid ${isDark ? border.default : border.default}`,
    borderActive: `1px solid ${isDark ? border.strong : border.strong}`,
    borderAccent: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.2)'}`, // accent.purple alpha

    // Text — directly from design system tokens
    textPrimary: text.primary,
    textSecondary: text.secondary,
    textTertiary: text.tertiary,
    textMuted: text.muted,
    textSubtle: isDark ? '#52525b' : '#a1a1aa', // zinc-600 / zinc-400
    textDisabled: isDark ? '#3f3f46' : '#d4d4d8', // zinc-700 / zinc-300
    textPlaceholder: isDark ? '#52525b' : '#a1a1aa',
    textVeryMuted: isDark ? '#3f3f46' : '#d4d4d8',
    textIcon: isDark ? '#27272a' : '#e4e4e7',

    // Accents — from colors.accent.purple
    accentResize: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.25)',
    accentResizeHover: isDark ? border.strong : border.default,

    // Spinner — brand primary
    spinnerColor: isDark ? '#8B5CF6' : '#7C3AED', // accent.purple / brand.primaryDark
  };
};