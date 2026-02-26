import { useMemo } from 'react';

interface Colors {
  bgGradient: string;
  bgSecondary: string;
  bgTertiary: string;
  borderLight: string;
  borderSubtle: string;
  surfaceLight: string;
  textSubtle: string;
  textMuted: string;
}

export function useDaytonaPreviewStyles(isDark: boolean, colors: Colors) {
  const containerStyle = useMemo(
    () => ({
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bgGradient,
      position: 'relative' as const,
      overflow: 'hidden',
    }),
    [colors.bgGradient],
  );

  const iconContainerStyle = useMemo(
    () => ({
      width: '100px',
      height: '100px',
      borderRadius: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      boxShadow: isDark
        ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
        : '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      marginBottom: '28px',
      position: 'relative' as const,
    }),
    [isDark],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: '18px',
      fontWeight: 600,
      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
      marginBottom: '10px',
      textAlign: 'center' as const,
      letterSpacing: '-0.02em',
    }),
    [isDark],
  );

  const subtitleStyle = useMemo(
    () => ({
      fontSize: '14px',
      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      textAlign: 'center' as const,
      maxWidth: '280px',
      lineHeight: 1.5,
    }),
    [isDark],
  );

  const iconColor = useMemo(() => (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'), [isDark]);
  const ringsColor = useMemo(() => (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.12)'), [isDark]);

  return {
    containerStyle,
    iconContainerStyle,
    titleStyle,
    subtitleStyle,
    iconColor,
    ringsColor,
  };
}
