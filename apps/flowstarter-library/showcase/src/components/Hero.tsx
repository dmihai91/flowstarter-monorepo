import React from 'react';
import { Zap, Palette, Type, BarChart2, Target } from 'lucide-react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

interface HeroStat { label: string; icon: React.ReactElement; }
type LucideProps = { size?: number; className?: string };
const ZapIcon     = Zap      as unknown as (p: LucideProps) => React.ReactElement;
const PaletteIcon = Palette  as unknown as (p: LucideProps) => React.ReactElement;
const TypeIcon    = Type     as unknown as (p: LucideProps) => React.ReactElement;
const ChartIcon   = BarChart2 as unknown as (p: LucideProps) => React.ReactElement;
const TargetIcon  = Target   as unknown as (p: LucideProps) => React.ReactElement;

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const stats: HeroStat[] = [
    { label: `${templateCount} Templates`, icon: <ZapIcon size={14} /> },
    { label: '6 Palettes each',            icon: <PaletteIcon size={14} /> },
    { label: '4 Font Pairings',            icon: <TypeIcon size={14} /> },
    { label: 'Built-in Analytics',            icon: <ChartIcon size={14} /> },
    { label: 'Lead Forms Included',              icon: <TargetIcon size={14} /> },
  ];

  return (
    <section className="relative overflow-hidden pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/10 hero-fade hero-fade-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)]">
              Handcrafted templates. Zero compromise.
            </span>
          </div>

          <h1 className="mb-6 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-neutral-900 dark:text-white sm:text-6xl lg:text-7xl">
            {templateCount} Templates.{' '}
            <span className="inline">
              {'Every one earns its place.'.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="inline-block animate-word-reveal"
                  style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-xl sm:text-2xl leading-relaxed text-neutral-600 dark:text-neutral-400 hero-fade hero-fade-3">
            We built these for coaches, consultants, and service professionals who need to look credible on day one. Each template ships with 6 colour palettes and 4 font pairings. Every one is production-ready, Astro-powered, and designed to be handed off, not hacked together.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 hero-fade hero-fade-4">
            {stats.map(({ label, icon }: HeroStat) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <span className="text-[var(--purple-primary)]">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Mobile search — full-width below pills, hidden on sm+ (header has it) */}
          <div className="mt-6 sm:hidden">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-300 pointer-events-none" style={{zIndex:1}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                id="mobile-search" placeholder="Search templates..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:border-[var(--purple-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/20 dark:border-neutral-700/60 dark:bg-neutral-900/80 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
