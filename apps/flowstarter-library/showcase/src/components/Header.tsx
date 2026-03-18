import React from 'react';
import { Monitor, Moon, Search, Sun } from 'lucide-react';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface ThemeOption {
  mode: ThemeMode;
  icon: IconComponent;
}

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const SunIcon = Sun as unknown as IconComponent;
const MoonIcon = Moon as unknown as IconComponent;
const MonitorIcon = Monitor as unknown as IconComponent;
const SearchIcon = Search as unknown as IconComponent;

const themeOptions: ThemeOption[] = [
  { mode: 'light', icon: SunIcon },
  { mode: 'dark', icon: MoonIcon },
  { mode: 'auto', icon: MonitorIcon },
];

export function Header({
  themeMode,
  setThemeMode,
  searchQuery,
  setSearchQuery,
}: HeaderProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/25">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                FlowStarter
              </span>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                Template Library
              </span>
            </div>
          </a>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-900 transition-all placeholder:text-neutral-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-neutral-700/60 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700/50 dark:bg-neutral-800/80">
              {themeOptions.map(({ mode, icon: Icon }: ThemeOption) => (
                <button
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  title={mode}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all duration-200 ${
                    themeMode === mode
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <a
              href="https://flowstarter.dev"
              className="hidden items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-700 sm:flex"
            >
              Get Early Access
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
