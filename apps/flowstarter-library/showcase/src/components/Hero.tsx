import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  const stats = [
    { value: `${templateCount}`, label: 'templates' },
    { value: '6', label: 'colour palettes' },
    { value: '4', label: 'font pairings' },
  ];

  return (
    <section className="relative overflow-hidden pt-20 pb-12">

      {/* Background orb — subtle in light, stronger in dark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 rounded-full opacity-[0.06] dark:opacity-[0.12] blur-[100px]"
          style={{ width: '600px', height: '500px', background: 'var(--purple-primary)' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* Label */}
        <div
          className="flex items-center justify-center gap-3 mb-8 hero-fade hero-fade-1"
        >
          <div className="h-px w-6 opacity-60" style={{ background: 'var(--purple-primary)' }} />
          <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--purple-primary)' }}>
            Handcrafted templates
          </span>
          <div className="h-px w-6 opacity-60" style={{ background: 'var(--purple-primary)' }} />
        </div>

        {/* Headline */}
        <div className="text-center mb-5 hero-fade hero-fade-2">
          <h1 style={{ lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
            <span
              className="block font-light text-neutral-800 dark:text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
            >
              Every expert deserves a site
            </span>
            <span
              className="block font-black"
              style={{
                fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
                background: 'linear-gradient(135deg, #4D5DD9, #7C3AED, #5b21b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              this good.
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <p className="text-center text-base sm:text-lg leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-10 hero-fade hero-fade-3">
          Every template is built for coaches, consultants, and service professionals.
          Pick a palette, pick a font, hand it off. Done.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 sm:gap-16 pt-8 border-t border-neutral-200 dark:border-white/[0.07] mb-6 hero-fade hero-fade-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
              <p className="text-[0.6rem] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mobile search */}
        <div className="sm:hidden hero-fade hero-fade-5">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ zIndex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[var(--purple-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/20 transition-all"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
