import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const displayMessage = message ?? t(EDITOR_LABEL_KEYS.COMMON_LOADING);
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgGradient,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `2px solid ${colors.spinnerColor}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', color: colors.textPlaceholder }}>{displayMessage}</span>
      </div>
    </div>
  );
}
