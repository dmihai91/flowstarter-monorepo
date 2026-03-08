import React, { useRef } from 'react';
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

/** Inject the keyframe + ::view-transition rules once into the document head */
function injectViewTransitionStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('theme-transition-styles')) return;
  const style = document.createElement('style');
  style.id = 'theme-transition-styles';
  style.textContent = `
    /* Radial-reveal transition when switching theme */
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
    }
    ::view-transition-new(root) {
      animation: theme-reveal 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes theme-reveal {
      from { clip-path: var(--theme-reveal-from, circle(0% at 50% 50%)); }
      to   { clip-path: circle(150% at var(--theme-reveal-x, 50%) var(--theme-reveal-y, 50%)); }
    }
  `;
  document.head.appendChild(style);
}

export function ThemeToggle() {
  const { theme, isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = (newTheme: Theme, event: React.MouseEvent<HTMLButtonElement>) => {
    if (newTheme === theme) return;

    // Calculate click origin for the reveal animation
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);

    const root = document.documentElement;
    root.style.setProperty('--theme-reveal-x', `${x}px`);
    root.style.setProperty('--theme-reveal-y', `${y}px`);
    // Small circle on start so it expands outward from the button
    root.style.setProperty('--theme-reveal-from', `circle(0% at ${x}px ${y}px)`);

    injectViewTransitionStyles();

    // Use View Transitions API if available, otherwise fall back to instant switch
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => setTheme(newTheme));
    } else {
      setTheme(newTheme);
    }
  };

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
      ref={containerRef}
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
        onClick={(e) => handleThemeChange('light', e)}
        style={getButtonStyle('light')}
        title={t(EDITOR_LABEL_KEYS.THEME_LIGHT)}
      >
        <SunIcon />
      </button>
      <button
        onClick={(e) => handleThemeChange('dark', e)}
        style={getButtonStyle('dark')}
        title={t(EDITOR_LABEL_KEYS.THEME_DARK)}
      >
        <MoonIcon />
      </button>
      <button
        onClick={(e) => handleThemeChange('system', e)}
        style={getButtonStyle('system')}
        title={t(EDITOR_LABEL_KEYS.THEME_SYSTEM)}
      >
        <SystemIcon />
      </button>
    </div>
  );
}
