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
        background: isUser
          ? 'linear-gradient(135deg, rgba(39, 39, 42, 0.45) 0%, rgba(39, 39, 42, 0.3) 100%)'
          : 'linear-gradient(135deg, rgba(24, 24, 27, 0.65) 0%, rgba(24, 24, 27, 0.45) 100%)',
        border: isUser
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(139, 92, 246, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      };
    }

    return {
      background: isUser
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(244, 244, 245, 0.65) 100%)',
      border: isUser
        ? '1px solid rgba(255, 255, 255, 0.7)'
        : '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    };
  }, [isDark, variant]);
}