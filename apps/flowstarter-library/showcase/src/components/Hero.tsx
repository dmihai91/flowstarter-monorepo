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
    { label: 'Analytics Ready',            icon: <ChartIcon size={14} /> },
    { label: 'Leads Capture',              icon: <TargetIcon size={14} /> },
  ];

  return (
    <section className="relative overflow-hidden pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/10">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Operator Template Library
            </span>
          </div>

          <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
            {templateCount} Templates.{' '}
            <span className="text-flow">Endless possibilities.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
            Production-ready Astro templates with 6 palettes and 4 font pairings each.
            Deploy client sites in minutes, not weeks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {stats.map(({ label, icon }: HeroStat) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <span className="text-purple-500 dark:text-purple-400">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Mobile search — full-width below pills, hidden on sm+ (header has it) */}
          <div className="mt-6 sm:hidden">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-300 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                id="mobile-search" placeholder="Search templates..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white/80 py-3 pl-10 pr-4 text-sm text-neutral-900 backdrop-blur-sm transition-all placeholder:text-neutral-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-neutral-700/60 dark:bg-neutral-900/80 dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
