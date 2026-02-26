import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import { CloseIcon } from './Icons';

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: `1px solid ${colors.borderMedium}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: colors.textPrimary,
          margin: 0,
        }}
      >
        {t(EDITOR_LABEL_KEYS.SIDEBAR_PROJECTS)}
      </h2>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.textMuted,
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
