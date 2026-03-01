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
    // Unified glassmorphism base with subtle variant differences
    const isUser = variant === 'user';

    if (isDark) {
      return {
        background: isUser
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
          : 'rgba(77, 93, 217, 0.04)',
        border: isUser ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(77, 93, 217, 0.1)',
        boxShadow: 'none',
      };
    }

    return {
      background: isUser
        ? 'rgba(255, 255, 255, 0.75)'
        : 'rgba(77, 93, 217, 0.04)',
      border: isUser ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(77, 93, 217, 0.08)',
      boxShadow: 'none',
    };
  }, [isDark, variant]);
}

