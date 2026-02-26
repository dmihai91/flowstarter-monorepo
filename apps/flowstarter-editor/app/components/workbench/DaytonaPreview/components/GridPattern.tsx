import { memo, useMemo } from 'react';

interface GridPatternProps {
  isDark: boolean;
}

export const GridPattern = memo(({ isDark }: GridPatternProps) => {
  const style = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
                      linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%)',
    }),
    [isDark],
  );

  return <div style={style} />;
});

GridPattern.displayName = 'GridPattern';
