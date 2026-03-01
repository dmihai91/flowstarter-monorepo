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
  // Primary gradient
  primaryGradient: isDark
    ? 'linear-gradient(135deg, #C1C8FF 0%, #4D5DD9 100%)'
    : 'linear-gradient(135deg, #4D5DD9 0%, #6366f1 100%)',
  primaryShadow: isDark ? '0 2px 8px rgba(193, 200, 255, 0.35)' : '0 2px 8px rgba(77, 93, 217, 0.25)',
  primaryShadowLarge: isDark ? '0 2px 12px rgba(193, 200, 255, 0.4)' : '0 2px 12px rgba(77, 93, 217, 0.3)',

  // Backgrounds - improved light mode contrast
  bgPrimary: isDark ? '#0a0a0f' : '#f8f8fa',
  bgSecondary: isDark ? 'rgba(10, 10, 20, 0.75)' : '#f0f0f4',
  bgTertiary: isDark ? 'rgba(5, 5, 12, 0.6)' : '#ffffff',
  bgHeader: isDark ? 'rgba(10, 10, 15, 0.9)' : 'rgba(255, 255, 255, 0.6)',
  bgGradient: isDark
    ? 'linear-gradient(180deg, #0f0f14 0%, #141420 100%)'
    : `radial-gradient(ellipse at 0% 0%, rgba(165, 90, 172, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 120% 80% at 50% 100%, rgba(145, 140, 69, 0.22) 0%, transparent 70%),
    #ffffff`,

  // Surface colors - increased opacity for light mode
  surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  surfaceLight: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  surfaceMedium: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  surfaceActive: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  surfaceSelected: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
  surfaceHover: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',

  // Borders - stronger for light mode
  borderSubtle: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.08)',
  borderLight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
  borderMedium: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)',
  borderActive: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
  borderAccent: isDark ? '1px solid rgba(193, 200, 255, 0.5)' : '1px solid rgba(77, 93, 217, 0.4)',

  // Text colors - improved light mode contrast
  textPrimary: isDark ? '#fff' : '#09090b',
  textSecondary: isDark ? 'rgba(255, 255, 255, 0.9)' : '#3f3f46',
  textTertiary: isDark ? 'rgba(255, 255, 255, 0.8)' : '#52525b',
  textMuted: isDark ? 'rgba(255, 255, 255, 0.7)' : '#71717a',
  textSubtle: isDark ? 'rgba(255, 255, 255, 0.5)' : '#a1a1aa',
  textDisabled: isDark ? 'rgba(255, 255, 255, 0.35)' : '#a1a1aa',
  textPlaceholder: isDark ? 'rgba(255, 255, 255, 0.4)' : '#a1a1aa',
  textVeryMuted: isDark ? 'rgba(255, 255, 255, 0.3)' : '#a1a1aa',
  textIcon: isDark ? 'rgba(255, 255, 255, 0.2)' : '#d4d4d8',

  // Accent colors
  accentResize: isDark ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.5)',
  accentResizeHover: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',

  // Spinner
  spinnerColor: isDark ? '#C1C8FF' : '#4D5DD9',
});

