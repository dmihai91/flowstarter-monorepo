import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

export function Logo() {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.primaryGradient,
          boxShadow: colors.primaryShadow,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
        </svg>
      </div>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: colors.textPrimary,
          letterSpacing: '-0.01em',
        }}
      >
        Flowstarter
      </span>
    </div>
  );
}
