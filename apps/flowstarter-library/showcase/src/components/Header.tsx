import React, { useEffect, useRef, useState } from 'react';
import { Logo } from '@flowstarter/flow-design-system';
import { useTranslation } from '../i18n';

type ThemeMode = 'light' | 'dark' | 'auto';

interface Category { name: string; count: number; }

interface HeaderProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  features: string[];
  selectedFeatures: string[];
  toggleFeature: (feature: string) => void;
}

function SunIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>; }
function MoonIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>; }
function SystemIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
function MenuIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function XIcon()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>; }

function ThemeToggle({ themeMode, setThemeMode, darkMode }: { themeMode: ThemeMode; setThemeMode: (m: ThemeMode) => void; darkMode: boolean }) {
  const opts: { mode: ThemeMode; icon: React.ReactElement; label: string }[] = [
    { mode: 'light', icon: <SunIcon />,    label: 'Light' },
    { mode: 'dark',  icon: <MoonIcon />,   label: 'Dark' },
    { mode: 'auto',  icon: <SystemIcon />, label: 'System' },
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
      <button onClick={cycle} aria-label={"Theme: " + themeMode} title={"Switch theme (" + themeMode + ")"}
        className={"sm:hidden h-9 w-9 shrink-0 " + btnBase}>
        {currentIcon}
      </button>
      {/* Desktop: full pill */}
      <div className={"hidden sm:flex items-center rounded-full p-1 " + (darkMode ? 'bg-white/8 border border-white/12' : 'bg-neutral-100 border border-neutral-200')}>
        {opts.map(({ mode, icon, label }) => {
          const active = themeMode === mode;
          return (
            <button key={mode} onClick={() => setThemeMode(mode)} aria-label={label} title={label}
              className={"flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 " + (
                active
                  ? darkMode ? 'bg-white/15 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm shadow-neutral-300/60 border border-neutral-200'
                  : darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-400 hover:text-neutral-700'
              )}>{icon}</button>
          );
        })}
      </div>
    </>
  );
}

function MobileDrawer({
  open, onClose, darkMode,
  searchQuery, setSearchQuery,
  categories, selectedCategory, setSelectedCategory,
  features, selectedFeatures, toggleFeature,
}: {
  open: boolean; onClose: () => void; darkMode: boolean;
  searchQuery: string; setSearchQuery: (q: string) => void;
  categories: Category[]; selectedCategory: string | null; setSelectedCategory: (c: string | null) => void;
  features: string[]; selectedFeatures: string[]; toggleFeature: (f: string) => void;
}) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const pill = (active: boolean) =>
    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors border cursor-pointer ' + (
      active
        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
        : darkMode
          ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white'
    );

  return (
    <>
      <div
        className={'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ' + (open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={drawerRef}
        className={'fixed top-0 left-0 z-50 h-full w-[85vw] max-w-[320px] transform transition-transform duration-300 ease-out lg:hidden ' +
          (open ? 'translate-x-0' : '-translate-x-full') + ' ' +
          (darkMode ? 'bg-[#0d0d10] border-r border-white/8' : 'bg-white border-r border-neutral-200') +
          ' flex flex-col'}
      >
        <div className={'flex items-center justify-between px-4 py-4 border-b ' + (darkMode ? 'border-[#ffffff0a]' : 'border-neutral-200')}>
          <Logo size="sm" />
          <span className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--purple-primary)]/10 text-[var(--purple-primary)] border border-[var(--purple-primary)]/20">Library</span>
          <button onClick={onClose} className={'flex h-8 w-8 items-center justify-center rounded-full transition-colors ' + (darkMode ? 'text-neutral-400 hover:bg-white/8' : 'text-neutral-500 hover:bg-neutral-100')}>
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className={'w-full rounded-xl py-2.5 pl-9 pr-3 text-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ' + (darkMode ? 'border border-neutral-700 bg-neutral-900 text-white' : 'border border-neutral-200 bg-neutral-50 text-neutral-900')}
            />
          </div>

          <div>
            <p className={'mb-3 text-xs font-semibold uppercase tracking-widest ' + (darkMode ? 'text-neutral-500' : 'text-neutral-400')}>Industry</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setSelectedCategory(null); onClose(); }}
                className={'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ' + (!selectedCategory ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' : darkMode ? 'text-neutral-400 hover:bg-white/5' : 'text-neutral-600 hover:bg-neutral-50')}
              >
                <span>All templates</span>
                <span className={'text-xs rounded-full px-2 py-0.5 ' + (darkMode ? 'bg-white/8 text-neutral-400' : 'bg-neutral-100 text-neutral-500')}>
                  {categories.reduce((s, c) => s + c.count, 0)}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); onClose(); }}
                  className={'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left capitalize ' + (selectedCategory === cat.name ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300' : darkMode ? 'text-neutral-400 hover:bg-white/5' : 'text-neutral-600 hover:bg-neutral-50')}
                >
                  <span>{cat.name}</span>
                  <span className={'text-xs rounded-full px-2 py-0.5 ' + (darkMode ? 'bg-white/8 text-neutral-400' : 'bg-neutral-100 text-neutral-500')}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {features.length > 0 && (
            <div>
              <p className={'mb-3 text-xs font-semibold uppercase tracking-widest ' + (darkMode ? 'text-neutral-500' : 'text-neutral-400')}>Features</p>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <button key={f} onClick={() => toggleFeature(f)} className={pill(selectedFeatures.includes(f))}>{f}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={'px-4 py-4 border-t ' + (darkMode ? 'border-[#ffffff0a]' : 'border-neutral-200')}>
          <a href="https://flowstarter.dev/contact" className="flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 no-underline">
            Start with FlowStarter
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </>
  );
}

export function Header({
  themeMode, setThemeMode, darkMode,
  searchQuery, setSearchQuery,
  categories, selectedCategory, setSelectedCategory,
  features, selectedFeatures, toggleFeature,
}: HeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        darkMode={darkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        features={features}
        selectedFeatures={selectedFeatures}
        toggleFeature={toggleFeature}
      />

      <header className={'sticky top-0 z-30 backdrop-blur-xl ' + (darkMode ? 'border-b border-[#ffffff0a] bg-[#08080c]/90' : 'border-b border-purple-200/40 bg-white/90 shadow-sm shadow-purple-100/40')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Mobile row (hidden on sm+) ── */}
          <div className="flex sm:hidden h-14 items-center gap-2">
            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ' + (darkMode ? 'border border-white/12 text-neutral-300 hover:bg-white/8' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100')}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            {/* Search — fills center */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ zIndex: 1 }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className={'w-full rounded-xl py-2 pl-9 pr-3 text-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ' + (darkMode ? 'border border-neutral-700/60 bg-neutral-900/60 text-white focus:border-[var(--purple-primary)]/60' : 'border border-neutral-200 bg-neutral-50 text-neutral-900 shadow-sm focus:border-purple-400/60')}
              />
            </div>

            {/* Theme toggle — rightmost */}
            <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} darkMode={darkMode} />
          </div>

          {/* ── Desktop row (hidden on mobile) ── */}
          <div className="hidden sm:flex h-16 items-center gap-3">
            <a href="/" className="flex shrink-0 items-center gap-2.5 no-underline group">
              <Logo size="md" />
              <span className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--purple-primary)]/10 text-[var(--purple-primary)] border border-[var(--purple-primary)]/20 group-hover:bg-[var(--purple-primary)]/20 transition-colors">Library</span>
            </a>

            <div className="flex flex-1 max-w-md">
              <div className="relative w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className={'w-full rounded-xl py-2 pl-10 pr-4 text-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ' + (darkMode ? 'border border-neutral-700/60 bg-neutral-900/60 text-white focus:border-[var(--purple-primary)]/60' : 'border border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-purple-400/60')}
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} darkMode={darkMode} />
              <a
                href="https://flowstarter.dev/contact"
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-colors hover:bg-purple-700 no-underline"
              >
                Start with FlowStarter
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}
