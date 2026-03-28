import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const STACK_CARDS = [
  { thumb: '/thumbs/coach-pro.png',       rotate: '-6deg',  y: '-16px', scale: 1,    delay: '0s',    shadow: '0 32px 64px rgba(0,0,0,0.22)' },
  { thumb: '/thumbs/beauty-stylist.png',  rotate: '4deg',   y: '8px',   scale: 0.95, delay: '0.12s', shadow: '0 24px 48px rgba(0,0,0,0.18)' },
  { thumb: '/thumbs/therapist-care.png',  rotate: '-2deg',  y: '28px',  scale: 0.88, delay: '0.22s', shadow: '0 16px 32px rgba(0,0,0,0.14)' },
];

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  const stats = [
    { value: `${templateCount}`, label: 'templates' },
    { value: '6', label: 'palettes' },
    { value: '4', label: 'font pairs' },
  ];

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>

      {/* Background — very subtle */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full opacity-[0.05] dark:opacity-[0.1] blur-[120px]"
          style={{ width: '700px', height: '500px', top: '-80px', left: '30%', background: 'var(--purple-primary)' }} />
      </div>

      {/* Perspective grid — bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 opacity-[0.04] dark:opacity-[0.07]" style={{
        backgroundImage: 'linear-gradient(var(--purple-primary) 1px, transparent 1px), linear-gradient(90deg, var(--purple-primary) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-12 lg:gap-16">

          {/* ── Left: content ── */}
          <div className="flex-1 min-w-0">

            {/* Label */}
            <div className="flex items-center gap-3 mb-7 hero-fade hero-fade-1">
              <div className="h-px w-5 opacity-70" style={{ background: 'var(--purple-primary)' }} />
              <span className="text-[0.62rem] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--purple-primary)' }}>
                Handcrafted templates
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-fade hero-fade-2 mb-5" style={{ lineHeight: 1.08, letterSpacing: '-0.025em', margin: '0 0 1.25rem' }}>
              <span className="block font-light text-neutral-700 dark:text-white/60"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)' }}>
                Every expert deserves
              </span>
              <span className="block font-black" style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)',
                background: 'linear-gradient(135deg, #6366f1, #7C3AED, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                a site this good.
              </span>
            </h1>

            {/* Body */}
            <p className="text-base leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-md mb-8 hero-fade hero-fade-3">
              Templates built for coaches, consultants, and service professionals.
              Pick a palette, pick a font pair, hand it off.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-8 hero-fade hero-fade-4">
              {stats.map((s, i) => (
                <React.Fragment key={i}>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                    <p className="text-[0.6rem] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="h-8 w-px bg-neutral-200 dark:bg-white/10" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile search */}
            <div className="lg:hidden mt-8 hero-fade hero-fade-5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ zIndex: 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* ── Right: 3D card stack — desktop only ── */}
          <div className="hidden lg:flex flex-shrink-0 items-center justify-center"
            style={{ width: '320px', height: '420px', position: 'relative' }}>
            {STACK_CARDS.map((card, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '240px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transform: `rotate(${card.rotate}) translateY(${card.y}) scale(${card.scale})`,
                  opacity: ready ? 1 : 0,
                  transition: `opacity 0.7s ease ${card.delay}, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${card.delay}`,
                  boxShadow: card.shadow + ', 0 0 0 1px rgba(255,255,255,0.1)',
                  zIndex: STACK_CARDS.length - i,
                  transformOrigin: 'center bottom',
                }}
              >
                <img
                  src={card.thumb}
                  alt=""
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
                {/* Gloss */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, transparent 45%)',
                  borderRadius: '16px',
                }} />
              </div>
            ))}
            {/* Glow behind stack */}
            <div className="absolute inset-0 rounded-full opacity-20 dark:opacity-30 blur-3xl"
              style={{ background: 'var(--purple-primary)', transform: 'scale(0.6)' }} />
          </div>

        </div>
      </div>
    </section>
  );
}
