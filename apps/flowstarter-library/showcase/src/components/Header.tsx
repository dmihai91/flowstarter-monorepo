import React, { useEffect, useState } from 'react';
import { LogoMark, LogoText } from './Logo';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SunIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function MonitorIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function ThemeToggleControl({ themeMode, setThemeMode, darkMode }: {
  themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void; darkMode: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const getLeft = (): string => {
    if (themeMode === 'light') return '4px';
    if (themeMode === 'dark') return 'calc(50% - 18px)';
    return 'calc(100% - 40px)';
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative', display: 'inline-flex', alignItems: 'center',
    borderRadius: '9999px', padding: '4px', backdropFilter: 'blur(16px)',
    background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
  };
  const indicatorStyle: React.CSSProperties = {
    position: 'absolute', height: '32px', width: '36px', borderRadius: '9999px',
    background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
    border: darkMode ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(0,0,0,0.85)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'left 0.3s ease-out',
    left: isMounted ? getLeft() : '4px',
  };
  const btnStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative', zIndex: 10, height: '32px', width: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '9999px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
    color: active ? (darkMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)') : (darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
  });

  if (!isMounted) return <div style={{ ...containerStyle, width: '120px', height: '40px' }} />;
  return (
    <div style={containerStyle}>
      <div style={indicatorStyle} />
      <button onClick={() => setThemeMode('light')} style={btnStyle(themeMode === 'light')} aria-label="Light theme"><SunIcon /></button>
      <button onClick={() => setThemeMode('dark')}  style={btnStyle(themeMode === 'dark')}  aria-label="Dark theme"><MoonIcon /></button>
      <button onClick={() => setThemeMode('auto')}  style={btnStyle(themeMode === 'auto')}  aria-label="System theme"><MonitorIcon /></button>
    </div>
  );
}

export function Header({ themeMode, setThemeMode, darkMode, searchQuery, setSearchQuery }: HeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const headerBg = darkMode ? 'rgba(10,10,12,0.85)' : 'rgba(255,255,255,0.85)';

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 dark:border-neutral-800/60 backdrop-blur-xl" style={{ background: headerBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
            <LogoMark size={32} />
            <LogoText size={15} darkMode={darkMode} showSubtitle={true} />
          </a>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"><SearchIcon /></span>
              <input type="text" placeholder={t('search.placeholder')} value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 transition-all placeholder:text-neutral-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggleControl themeMode={themeMode} setThemeMode={setThemeMode} darkMode={darkMode} />
            <a href="https://flowstarter.dev" className="hidden sm:flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-600 no-underline">
              Get Early Access
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
