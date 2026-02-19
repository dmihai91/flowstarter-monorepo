import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

export type ViewMode = 'preview' | 'editor';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const PreviewIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>
);

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  const getButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: isActive ? colors.surfaceSelected : 'transparent',
    color: isActive ? colors.textPrimary : colors.textSubtle,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: '8px',
        padding: '4px',
        gap: '4px',
        background: colors.surfaceMedium,
        border: colors.borderLight,
      }}
    >
      <button onClick={() => onViewModeChange('preview')} style={getButtonStyle(viewMode === 'preview')}>
        <PreviewIcon />
        {t(EDITOR_LABEL_KEYS.VIEW_PREVIEW)}
      </button>
      <button onClick={() => onViewModeChange('editor')} style={getButtonStyle(viewMode === 'editor')}>
        <EditorIcon />
        {t(EDITOR_LABEL_KEYS.VIEW_EDITOR)}
      </button>
    </div>
  );
}
