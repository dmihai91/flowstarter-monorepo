import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface PublishButtonProps {
  isEnabled: boolean;
  onClick?: () => void;
}

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16,6 12,2 8,6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export function PublishButton({ isEnabled, onClick }: PublishButtonProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  // Better disabled state colors with improved contrast
  const disabledBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const disabledColor = isDark ? 'rgba(255,255,255,0.4)' : '#71717a';
  const disabledBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';

  return (
    <button
      onClick={onClick}
      disabled={!isEnabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 24px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: 600,
        background: isEnabled ? colors.primaryGradient : disabledBg,
        border: isEnabled ? 'none' : `1px solid ${disabledBorder}`,
        color: isEnabled ? '#fff' : disabledColor,
        cursor: isEnabled ? 'pointer' : 'not-allowed',
        boxShadow: isEnabled ? colors.primaryShadowLarge : 'none',
        transition: 'all 0.2s',
      }}
    >
      <UploadIcon />
      {t(EDITOR_LABEL_KEYS.COMMON_PUBLISH)}
    </button>
  );
}
