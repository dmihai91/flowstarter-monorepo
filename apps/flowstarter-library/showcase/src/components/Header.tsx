import React, { useEffect, useState } from 'react';
import { Logo } from '@flowstarter/flow-design-system';

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
  scrolled: boolean;
}

function SunIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>; }
function MoonIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>; }
function SystemIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
function MenuIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function XIcon()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>; }
function ArrowIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>; }

/* ── Theme toggle pill (matching main platform) ── */
function ThemeToggle({ themeMode, setThemeMode }: { themeMode: ThemeMode; setThemeMode: (m: ThemeMode) => void }) {
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

  return (
    <>
      {/* Mobile: single cycle button */}
      <button onClick={cycle} aria-label={"Theme: " + themeMode} title={"Switch theme (" + themeMode + ")"}
        className="lg:hidden h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-200
          border border-gray-200/80 dark:border-white/[0.06]
          bg-white/80 dark:bg-white/[0.05]
          text-gray-500 dark:text-white/50
          hover:bg-gray-100 dark:hover:bg-white/[0.08]">
        {currentIcon}
      </button>
      {/* Desktop: pill — matching main platform */}
      <div className="hidden lg:flex items-center rounded-full p-1
        bg-gray-100/80 dark:bg-white/[0.06]
        border border-gray-200/60 dark:border-white/[0.06]">
        {opts.map(({ mode, icon, label }) => {
          const active = themeMode === mode;
          return (
            <button key={mode} onClick={() => setThemeMode(mode)} aria-label={label} title={label}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? 'bg-white dark:bg-white/15 text-gray-700 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'
              }`}>{icon}</button>
          );
        })}
      </div>
    </>
  );
}

/* ── Mobile Bottom Sheet (native mobile feel) ── */
function MobileSheet({
  open, onClose,
  searchQuery, setSearchQuery,
  categories, selectedCategory, setSelectedCategory,
  features, selectedFeatures, toggleFeature,
}: {
  open: boolean; onClose: () => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  categories: Category[]; selectedCategory: string | null; setSelectedCategory: (c: string | null) => void;
  features: string[]; selectedFeatures: string[]; toggleFeature: (f: string) => void;
}) {
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

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet rounded-t-[28px] max-h-[85vh] overflow-y-auto
          bg-white dark:bg-[#0a0a0c] border-t border-gray-200/80 dark:border-white/[0.06]"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/15" />
        </div>

        <div className="px-5 pb-6 space-y-6">
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h3>
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
              <XIcon />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm
                border border-gray-200/80 dark:border-white/[0.06]
                bg-gray-50 dark:bg-white/[0.04]
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-white/30
                focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20"
            />
          </div>

          {/* Categories */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">Industry</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { setSelectedCategory(null); onClose(); }}
                className={`sidebar-item ${!selectedCategory ? 'sidebar-item--active' : 'sidebar-item--inactive'}`}
              >
                <span>All templates</span>
                <span className={`sidebar-badge ${!selectedCategory ? 'sidebar-badge--active' : 'sidebar-badge--inactive'}`}>
                  {categories.reduce((s, c) => s + c.count, 0)}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); onClose(); }}
                  className={`sidebar-item capitalize ${selectedCategory === cat.name ? 'sidebar-item--active' : 'sidebar-item--inactive'}`}
                >
                  <span>{cat.name}</span>
                  <span className={`sidebar-badge ${selectedCategory === cat.name ? 'sidebar-badge--active' : 'sidebar-badge--inactive'}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">Features</p>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <button key={f} onClick={() => toggleFeature(f)}
                    className={`feature-tag ${selectedFeatures.includes(f) ? 'feature-tag--active' : 'feature-tag--inactive'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <a href="https://flowstarter.dev/contact"
            className="btn-brand btn-shimmer flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white no-underline">
            Start with Flowstarter <ArrowIcon />
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
  scrolled,
}: HeaderProps): React.ReactElement {
  void darkMode; // used implicitly via .dark CSS class
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        features={features}
        selectedFeatures={selectedFeatures}
        toggleFeature={toggleFeature}
      />

      {/* ── Header — matching main platform LandingHeader exactly ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'bg-white/70 dark:bg-[#0a0a0c]/70 backdrop-blur-lg lg:backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.04)]'
            : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Mobile row ── */}
          <div className="flex lg:hidden h-14 items-center gap-2">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors
                border border-gray-200/80 dark:border-white/[0.06]
                text-gray-600 dark:text-white/60
                hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl py-2 pl-9 pr-3 text-sm transition-all
                  border border-gray-200/80 dark:border-white/[0.06]
                  bg-gray-50 dark:bg-white/[0.04]
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-white/30
                  focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20"
              />
            </div>

            <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />
          </div>

          {/* ── Desktop row ── */}
          <div className="hidden lg:flex h-16 items-center gap-4">
            <a href="/" className="flex shrink-0 items-center gap-2.5 no-underline group">
              <span className="text-gray-900 dark:text-white"><Logo size="md" /></span>
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--purple) 10%, transparent)',
                  color: 'var(--purple)',
                  border: '1px solid color-mix(in srgb, var(--purple) 28%, transparent)',
                }}
              >
                Library
              </span>
            </a>

            <div className="flex flex-1 max-w-sm xl:max-w-md">
              <div className="relative w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl py-2 pl-10 pr-4 text-sm transition-all
                    border border-gray-200/80 dark:border-white/[0.06]
                    bg-white/80 dark:bg-white/[0.04]
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-white/30
                    focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/20 focus:border-[var(--purple)]/40
                    shadow-sm dark:shadow-none"
                  style={{ backdropFilter: 'blur(8px)' }}
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} />
              <a
                href="https://flowstarter.dev/contact"
                className="btn-brand btn-shimmer flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white no-underline"
              >
                Start with Flowstarter
                <ArrowIcon />
              </a>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}
