import React from 'react';
import { setTheme } from '~/lib/stores/theme';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

type Theme = 'light' | 'dark' | 'system';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export function ThemeToggle() {
  const { theme, isDark } = useThemeStyles();
  const colors = getColors(isDark);

  const getButtonStyle = (themeOption: Theme): React.CSSProperties => {
    const isSelected = theme === themeOption;
    return {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isSelected ? colors.surfaceHover : 'transparent',
      border: isSelected ? colors.borderActive : '1px solid transparent',
      cursor: 'pointer',
      color: isSelected ? colors.textPrimary : colors.textDisabled,
      transition: 'all 0.2s',
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        borderRadius: '24px',
        background: colors.surfaceLight,
        border: colors.borderMedium,
      }}
    >
      <button
        onClick={() => setTheme('light')}
        style={getButtonStyle('light')}
        title={t(EDITOR_LABEL_KEYS.THEME_LIGHT)}
      >
        <SunIcon />
      </button>
      <button onClick={() => setTheme('dark')} style={getButtonStyle('dark')} title={t(EDITOR_LABEL_KEYS.THEME_DARK)}>
        <MoonIcon />
      </button>
      <button
        onClick={() => setTheme('system')}
        style={getButtonStyle('system')}
        title={t(EDITOR_LABEL_KEYS.THEME_SYSTEM)}
      >
        <SystemIcon />
      </button>
    </div>
  );
}
