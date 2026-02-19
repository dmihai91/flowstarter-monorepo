import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export function Header({ themeMode, setThemeMode, darkMode, searchQuery, setSearchQuery }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200/80 dark:border-surface-800/80 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] gap-6">
          <a href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-display font-bold text-lg">F</span>
            </div>
            <span className="font-display text-xl font-semibold text-surface-900 dark:text-white tracking-tight">
              {t('brand.name')}
            </span>
          </a>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-0.5 p-1 rounded-full bg-surface-100 dark:bg-surface-800/80 shrink-0">
            {[
              { mode: 'light' as ThemeMode, icon: <SunIcon />, labelKey: 'theme.light' },
              { mode: 'dark' as ThemeMode, icon: <MoonIcon />, labelKey: 'theme.dark' },
              { mode: 'auto' as ThemeMode, icon: <MonitorIcon />, labelKey: 'theme.auto' },
            ].map(({ mode, icon, labelKey }) => {
              const isSelected = themeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  aria-label={t(labelKey)}
                  title={t(labelKey)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                    isSelected
                      ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  }`}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
