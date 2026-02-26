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
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(165, 90, 172, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(165, 90, 172, 0.15) 100%)',
          border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.25)'}`,
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
