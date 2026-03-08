import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

export type ViewMode = 'preview' | 'editor' | 'chat' | 'terminal';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isMobile?: boolean;
  hasTerminalActivity?: boolean;
  terminalErrorCount?: number;
}

const ChatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

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

const TerminalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4,17 10,11 4,5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export function ViewToggle({
  viewMode,
  onViewModeChange,
  isMobile = false,
  hasTerminalActivity = false,
  terminalErrorCount = 0,
}: ViewToggleProps) {
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
    position: 'relative',
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
      {isMobile && (
        <button onClick={() => onViewModeChange('chat')} style={getButtonStyle(viewMode === 'chat')}>
          <ChatIcon />
          Chat
        </button>
      )}
      <button onClick={() => onViewModeChange('preview')} style={getButtonStyle(viewMode === 'preview')}>
        <PreviewIcon />
        {t(EDITOR_LABEL_KEYS.VIEW_PREVIEW)}
      </button>
      {!isMobile && (
        <button onClick={() => onViewModeChange('editor')} style={getButtonStyle(viewMode === 'editor')}>
          <EditorIcon />
          {t(EDITOR_LABEL_KEYS.VIEW_EDITOR)}
        </button>
      )}
      <button
        onClick={() => onViewModeChange('terminal')}
        style={getButtonStyle(viewMode === 'terminal')}
      >
        <TerminalIcon />
        Terminal
        {/* Error badge */}
        {terminalErrorCount > 0 && (
          <span style={{
            marginLeft: '4px',
            background: '#EF4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 600,
            lineHeight: 1,
            padding: '1px 4px',
            borderRadius: '4px',
          }}>
            {terminalErrorCount}
          </span>
        )}
        {/* Activity pulse (no errors, but active) */}
        {hasTerminalActivity && terminalErrorCount === 0 && viewMode !== 'terminal' && (
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--purple, #4d5dd9)',
            marginLeft: '2px',
            display: 'inline-block',
            animation: 'pulse 1.5s infinite',
          }} />
        )}
      </button>
    </div>
  );
}
