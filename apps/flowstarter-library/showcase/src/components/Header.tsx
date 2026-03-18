import React from 'react';
import { Logo } from '@flowstarter/flow-design-system';
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
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
}
function MoonIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SystemIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function ThemeToggle({ themeMode, setThemeMode, darkMode }: { themeMode: ThemeMode; setThemeMode: (m: ThemeMode) => void; darkMode: boolean }) {
  const opts: { mode: ThemeMode; icon: React.ReactElement; label: string }[] = [
    { mode: 'light',  icon: <SunIcon />,    label: 'Light' },
    { mode: 'dark',   icon: <MoonIcon />,   label: 'Dark' },
    { mode: 'auto',   icon: <SystemIcon />, label: 'System' },
  ];

  const cycle = () => {
    const order: ThemeMode[] = ['light', 'dark', 'auto'];
    setThemeMode(order[(order.indexOf(themeMode) + 1) % 3]);
  };

  const currentIcon = opts.find(o => o.mode === themeMode)?.icon ?? <SunIcon />;

  const btnBase = `flex items-center justify-center rounded-full transition-all duration-200 ${
    darkMode
      ? 'border border-white/12 bg-white/8 text-white hover:bg-white/15'
      : 'border border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
  }`;

  return (
    <>
      {/* Mobile: single cycle button */}
      <button onClick={cycle} aria-label={`Theme: ${themeMode}`} title={`Switch theme (${themeMode})`}
        className={`sm:hidden h-9 w-9 ${btnBase}`}>
        {currentIcon}
      </button>

      {/* Desktop: full 3-button pill */}
      <div className={`hidden sm:flex items-center rounded-full p-1 ${
        darkMode ? 'bg-white/8 border border-white/12' : 'bg-neutral-100 border border-neutral-200'
      }`}>
        {opts.map(({ mode, icon, label }) => {
          const active = themeMode === mode;
          return (
            <button key={mode} onClick={() => setThemeMode(mode)} aria-label={label} title={label}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? darkMode
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'bg-white text-purple-700 shadow-sm shadow-neutral-300/60 border border-neutral-200'
                  : darkMode
                    ? 'text-neutral-400 hover:text-neutral-200'
                    : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function Header({ themeMode, setThemeMode, darkMode, searchQuery, setSearchQuery }: HeaderProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl ${
        darkMode
          ? 'border-b border-white/8 bg-[#08080c]/85'
          : 'border-b border-purple-200/50 bg-white/90 shadow-sm shadow-purple-100/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center no-underline">
            <Logo size="sm" />
          </a>

          {/* Search — hidden on mobile (in Hero instead) */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl py-2 pl-10 pr-4 text-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
                  darkMode
                    ? 'border border-neutral-700/60 bg-neutral-900/60 text-white focus:border-purple-500/60'
                    : 'border border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-purple-400/60'
                }`}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Mobile search button */}
            <button
              onClick={() => {
                const el = document.getElementById('mobile-search');
                if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
              }}
              className={`flex sm:hidden h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                darkMode
                  ? 'border border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-100'
              }`}
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} darkMode={darkMode} />

            <a
              href="https://flowstarter.dev"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-colors hover:bg-purple-700 no-underline"
            >
              Get Early Access
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
