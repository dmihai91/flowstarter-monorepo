import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface SeparatorProps {
  height?: number;
  orientation?: 'vertical' | 'horizontal';
}

export function Separator({ height = 24, orientation = 'vertical' }: SeparatorProps) {
  const { isDark } = useThemeStyles();
  getColors(isDark); // Called for side effects

  if (orientation === 'horizontal') {
    return (
      <div
        style={{
          height: '1px',
          width: '100%',
          background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '1px',
        height: `${height}px`,
        flexShrink: 0,
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}
    />
  );
}
