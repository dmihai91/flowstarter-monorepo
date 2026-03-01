import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { PlusIcon } from './Icons';

interface NewProjectButtonProps {
  onClick: () => void;
}

export function NewProjectButton({ onClick }: NewProjectButtonProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div style={{ padding: '12px 16px' }}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: colors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.15s ease',
        }}
      >
        <PlusIcon />
        {t(EDITOR_LABEL_KEYS.SIDEBAR_NEW_PROJECT)}
      </button>
    </div>
  );
}
