import React from 'react';
import { Logo, ThemeToggle } from '@flowstarter/flow-design-system';
import type { Theme } from '@flowstarter/flow-design-system';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

// DS uses 'system'; showcase uses 'auto'
function toTheme(mode: ThemeMode): Theme { return mode === 'auto' ? 'system' : mode; }
function fromTheme(theme: Theme): ThemeMode { return theme === 'system' ? 'auto' : theme; }

export function Header({ themeMode, setThemeMode, darkMode, searchQuery, setSearchQuery }: HeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const headerBg = darkMode ? 'rgba(10,10,12,0.85)' : 'rgba(248,247,253,0.88)';

  return (
    <header
      className="sticky top-0 z-50 border-b border-purple-200/60 bg-transparent backdrop-blur-xl shadow-sm shadow-purple-100/50 dark:border-neutral-800/60 dark:shadow-none"
      style={{ background: headerBg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">

          <a href="/" className="flex shrink-0 items-center no-underline">
            <Logo size="sm" />
          </a>

          <div className="hidden sm:block flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 transition-all placeholder:text-neutral-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle
              theme={toTheme(themeMode)}
              onThemeChange={(t: Theme) => setThemeMode(fromTheme(t))}
            />
            <button
              onClick={() => {
                const el = document.getElementById('mobile-search');
                if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
              }}
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
            <a
              href="https://flowstarter.dev"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-600 no-underline"
            >
              Get Early Access
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
