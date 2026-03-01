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
  // Brand — indigo-to-cyan flow gradient (toned down)
  primaryGradient: isDark
    ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.7) 0%, rgba(6, 182, 212, 0.5) 100%)'
    : 'linear-gradient(135deg, rgba(77, 93, 217, 0.6) 0%, rgba(6, 182, 212, 0.4) 100%)',
  primaryShadow: isDark ? '0 2px 8px rgba(77, 93, 217, 0.15)' : '0 2px 8px rgba(77, 93, 217, 0.1)',
  primaryShadowLarge: isDark ? '0 4px 16px rgba(77, 93, 217, 0.2)' : '0 4px 16px rgba(77, 93, 217, 0.12)',

  // Backgrounds — transparent for FlowBackground to show through
  bgPrimary: isDark ? '#0a0a0c' : '#ffffff',
  bgSecondary: isDark ? 'rgba(10, 10, 14, 0.65)' : 'rgba(244, 244, 245, 0.85)',
  bgTertiary: isDark ? 'rgba(8, 8, 12, 0.5)' : '#ffffff',
  bgHeader: isDark ? 'rgba(10, 10, 14, 0.8)' : 'rgba(255, 255, 255, 0.7)',
  bgGradient: isDark
    ? 'transparent'
    : 'transparent',

  // Surfaces — glassmorphism layers
  surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  surfaceLight: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
  surfaceMedium: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  surfaceActive: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
  surfaceSelected: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  surfaceHover: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',

  // Borders — subtle glass edges
  borderSubtle: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.06)',
  borderLight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.08)',
  borderMedium: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
  borderActive: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
  borderAccent: isDark ? '1px solid rgba(77, 93, 217, 0.3)' : '1px solid rgba(77, 93, 217, 0.25)',

  // Text
  textPrimary: isDark ? '#fafafa' : '#09090b',
  textSecondary: isDark ? '#d4d4d8' : '#3f3f46',
  textTertiary: isDark ? '#a1a1aa' : '#52525b',
  textMuted: isDark ? '#71717a' : '#71717a',
  textSubtle: isDark ? 'rgba(255, 255, 255, 0.4)' : '#a1a1aa',
  textDisabled: isDark ? 'rgba(255, 255, 255, 0.25)' : '#d4d4d8',
  textPlaceholder: isDark ? 'rgba(255, 255, 255, 0.3)' : '#a1a1aa',
  textVeryMuted: isDark ? 'rgba(255, 255, 255, 0.2)' : '#d4d4d8',
  textIcon: isDark ? 'rgba(255, 255, 255, 0.15)' : '#d4d4d8',

  // Accents
  accentResize: isDark ? 'rgba(77, 93, 217, 0.5)' : 'rgba(77, 93, 217, 0.35)',
  accentResizeHover: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',

  // Spinner
  spinnerColor: isDark ? 'rgba(77, 93, 217, 0.7)' : '#4D5DD9',
});