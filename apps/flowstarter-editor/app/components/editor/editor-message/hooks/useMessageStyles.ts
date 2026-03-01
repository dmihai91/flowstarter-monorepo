import { useMemo } from 'react';

export interface MessageStyleConfig {
  isDark: boolean;
}

export interface MessageStyles {
  textMuted: string;
  textPrimary: string;
  textSecondary: string;
  timestampColor: string;
  deliveredColor: string;
}

export function useMessageStyles({ isDark }: MessageStyleConfig): MessageStyles {
  return useMemo(
    () => ({
      textMuted: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
      textPrimary: isDark ? '#fff' : 'rgba(0,0,0,0.88)',
      textSecondary: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.78)',
      timestampColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
      deliveredColor: isDark ? '#34d399' : '#10b981',
    }),
    [isDark],
  );
}

export interface BubbleStyleConfig {
  isDark: boolean;
  variant: 'user' | 'assistant';
}

export interface BubbleStyles {
  background: string;
  border: string;
  boxShadow: string;
}

/**
 * Unified glassmorphism styling for message bubbles.
 * Both user and assistant variants share the same frosted glass aesthetic.
 */
export function useBubbleStyles({ isDark, variant }: BubbleStyleConfig): BubbleStyles {
  return useMemo(() => {
    const isUser = variant === 'user';

    if (isDark) {
      return {
        // dark.bg.elevated (#27272a) as base reference
        background: isUser
          ? 'rgba(39, 39, 42, 0.4)'   // zinc-800 alpha
          : 'rgba(24, 24, 27, 0.6)',   // zinc-900 alpha + accent tint
        border: isUser
          ? '1px solid #3f3f46'        // dark.border.light
          : '1px solid rgba(139, 92, 246, 0.15)', // accent.purple alpha
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)', // glassShadows.subtle
      };
    }

    return {
      // light.bg.elevated (#ffffff) as base reference
      background: isUser
        ? '#ffffff'                    // light.bg.elevated
        : '#f4f4f5',                   // light.bg.secondary
      border: isUser
        ? '1px solid #e4e4e7'         // light.border.light
        : '1px solid rgba(139, 92, 246, 0.1)', // accent.purple alpha
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)', // glassShadows.subtle
    };
  }, [isDark, variant]);
}