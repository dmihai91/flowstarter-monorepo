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
export const getColors = (isDark: boolean) => ({
  // Brand — refined indigo-to-cyan, used sparingly as accents
  primaryGradient: isDark
    ? 'linear-gradient(135deg, hsl(233, 65%, 58%) 0%, hsl(187, 96%, 42%) 100%)'
    : 'linear-gradient(135deg, hsl(233, 65%, 52%) 0%, hsl(187, 96%, 36%) 100%)',
  primaryShadow: isDark ? '0 2px 12px rgba(77, 93, 217, 0.2)' : '0 2px 12px rgba(77, 93, 217, 0.15)',
  primaryShadowLarge: isDark ? '0 4px 20px rgba(77, 93, 217, 0.25)' : '0 4px 20px rgba(77, 93, 217, 0.18)',

  // Backgrounds — dark: deep navy tones; light: warm off-whites
  bgPrimary: isDark ? '#0b0b10' : '#fafaf9',
  bgSecondary: isDark ? 'rgba(12, 12, 18, 0.7)' : 'rgba(248, 247, 245, 0.88)',
  bgTertiary: isDark ? 'rgba(8, 8, 14, 0.5)' : '#ffffff',
  bgHeader: isDark ? 'rgba(12, 12, 18, 0.85)' : 'rgba(255, 255, 255, 0.92)',
  bgGradient: 'transparent',

  // Surfaces — glass layers with depth
  surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
  surfaceLight: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.025)',
  surfaceMedium: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
  surfaceActive: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
  surfaceSelected: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.07)',
  surfaceHover: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)',

  // Borders — crisp, minimal
  borderSubtle: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
  borderLight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
  borderMedium: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
  borderActive: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
  borderAccent: isDark ? '1px solid rgba(77, 93, 217, 0.25)' : '1px solid rgba(77, 93, 217, 0.2)',

  // Text — high contrast, warm neutrals in light mode
  textPrimary: isDark ? '#f0f0f2' : '#1a1a1e',
  textSecondary: isDark ? '#c8c8ce' : '#3d3d42',
  textTertiary: isDark ? '#9898a0' : '#5c5c64',
  textMuted: isDark ? '#6e6e78' : '#7a7a82',
  textSubtle: isDark ? 'rgba(255, 255, 255, 0.35)' : '#9a9aa2',
  textDisabled: isDark ? 'rgba(255, 255, 255, 0.2)' : '#c4c4c8',
  textPlaceholder: isDark ? 'rgba(255, 255, 255, 0.25)' : '#b0b0b6',
  textVeryMuted: isDark ? 'rgba(255, 255, 255, 0.15)' : '#d0d0d4',
  textIcon: isDark ? 'rgba(255, 255, 255, 0.12)' : '#dcdce0',

  // Accents
  accentResize: isDark ? 'rgba(77, 93, 217, 0.4)' : 'rgba(77, 93, 217, 0.25)',
  accentResizeHover: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',

  // Spinner
  spinnerColor: isDark ? 'hsl(233, 65%, 58%)' : 'hsl(233, 65%, 48%)',
});