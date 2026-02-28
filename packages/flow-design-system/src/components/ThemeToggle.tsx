/**
 * Theme Toggle
 *
 * Shared three-way theme toggle (light / dark / system).
 * Uses inline styles for pixel-perfect rendering across all CSS frameworks.
 */

import { useEffect, useState } from 'react';
import type { Theme } from '../utils/theme';
import { getEffectiveTheme } from '../utils/theme';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export interface ThemeToggleProps {
  /** Current theme value */
  theme: Theme;
  /** Callback when user selects a theme */
  onThemeChange: (theme: Theme) => void;
  /** Additional CSS class */
  className?: string;
}

export function ThemeToggle({ theme, onThemeChange, className }: ThemeToggleProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = isMounted ? getEffectiveTheme() === 'dark' : false;

  const getIndicatorLeft = (): string => {
    if (theme === 'light') return '4px';
    if (theme === 'dark') return 'calc(50% - 18px)';
    return 'calc(100% - 40px)';
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '9999px',
    padding: '4px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
  };

  const indicatorStyle: React.CSSProperties = {
    position: 'absolute',
    height: '32px',
    width: '36px',
    borderRadius: '9999px',
    background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
    border: isDark ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(0,0,0,0.85)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'left 0.3s ease-out',
    left: isMounted ? getIndicatorLeft() : '4px',
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    zIndex: 10,
    height: '32px',
    width: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s',
    color: isActive
      ? (isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)')
      : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
  });

  // Placeholder during SSR
  if (!isMounted) {
    return (
      <div
        className={className}
        style={{ ...containerStyle, width: '120px', height: '40px' }}
      />
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div style={indicatorStyle} />

      <button
        onClick={() => onThemeChange('light')}
        style={buttonStyle(theme === 'light')}
        aria-label="Light theme"
      >
        <SunIcon />
      </button>

      <button
        onClick={() => onThemeChange('dark')}
        style={buttonStyle(theme === 'dark')}
        aria-label="Dark theme"
      >
        <MoonIcon />
      </button>

      <button
        onClick={() => onThemeChange('system')}
        style={buttonStyle(theme === 'system')}
        aria-label="System theme"
      >
        <MonitorIcon />
      </button>
    </div>
  );
}
