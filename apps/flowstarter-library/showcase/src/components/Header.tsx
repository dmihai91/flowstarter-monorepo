import React, { useEffect, useId, useState } from 'react';
import { Monitor, Moon, Search, Sun } from 'lucide-react';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function LogoMark() {
  const id = useId();
  return (
    <div style={{ width: 32, height: 32, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4D5DD9" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <path d="M14 10 L14 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 12 C18 12, 22 10, 27 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 20 C17 20, 20 18, 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M14 30 C18 30, 22 28, 28 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

interface ThemeToggleInternalProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
}

function ThemeToggleControl({ themeMode, setThemeMode, darkMode }: ThemeToggleInternalProps) {
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
    borderRadius: '9999px', border: 'none', background: 'transparent',
    cursor: 'pointer', padding: 0, transition: 'color 0.2s',
    color: active
      ? (darkMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)')
      : (darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
  });

  if (!isMounted) return <div style={{ ...containerStyle, width: '120px', height: '40px' }} />;

  return (
    <div style={containerStyle}>
      <div style={indicatorStyle} />
      <button onClick={() => setThemeMode('light')} style={btnStyle(themeMode === 'light')} aria-label="Light theme"><Sun size={16} /></button>
      <button onClick={() => setThemeMode('dark')}  style={btnStyle(themeMode === 'dark')}  aria-label="Dark theme"><Moon size={16} /></button>
      <button onClick={() => setThemeMode('auto')}  style={btnStyle(themeMode === 'auto')}  aria-label="System theme"><Monitor size={16} /></button>
    </div>
  );
}

export function Header({ themeMode, setThemeMode, darkMode, searchQuery, setSearchQuery }: HeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const logoTextColor = darkMode ? '#ffffff' : '#09090b';
  const logoSubColor = darkMode ? '#737373' : '#a3a3a3';
  const headerBg = darkMode ? 'rgba(10,10,12,0.85)' : 'rgba(255,255,255,0.85)';

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 dark:border-neutral-800/60 backdrop-blur-xl" style={{ background: headerBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
            <LogoMark />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 3 }}>
              <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '-0.025em', color: logoTextColor }}>
                Flow<span style={{ background: 'linear-gradient(to right, #4D5DD9, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>starter</span>
              </span>
              <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", fontSize: 11, fontWeight: 500, color: logoSubColor, letterSpacing: '0.01em' }}>
                Template Library
              </span>
            </div>
          </a>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 transition-all placeholder:text-neutral-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Right: theme toggle + CTA */}
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggleControl themeMode={themeMode} setThemeMode={setThemeMode} darkMode={darkMode} />
            <a href="https://flowstarter.dev" className="hidden sm:flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-700 no-underline">
              Get Early Access
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
