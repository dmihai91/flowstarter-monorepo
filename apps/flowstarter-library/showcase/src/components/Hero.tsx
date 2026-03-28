import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const STACK_CARDS = [
  { thumb: '/thumbs/coach-pro.png',      rotate: '-8deg',  y: '-24px', scale: 1,    delay: '0s',    z: 3 },
  { thumb: '/thumbs/beauty-stylist.png', rotate: '5deg',   y: '12px',  scale: 0.93, delay: '0.12s', z: 2 },
  { thumb: '/thumbs/therapist-care.png', rotate: '-2deg',  y: '36px',  scale: 0.85, delay: '0.22s', z: 1 },
];

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  const stats = [
    { value: `${templateCount}`, label: 'templates' },
    { value: '6', label: 'palettes each' },
    { value: '4', label: 'font pairs' },
  ];

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center gap-12 lg:gap-20">

          {/* ── Left: content ── */}
          <div className="flex-1 min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Label */}
            <div
              className="hero-fade hero-fade-1 mb-7 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
              style={{
                border: '1px solid color-mix(in srgb, var(--purple-primary) 30%, transparent)',
                background: 'color-mix(in srgb, var(--purple-primary) 8%, transparent)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--purple-primary)' }} />
              <span className="text-[0.6rem] font-bold tracking-[0.22em] uppercase" style={{ color: 'var(--purple-primary)' }}>
                Template library
              </span>
            </div>

            {/* Headline */}
            <div className="hero-fade hero-fade-2 mb-5">
              <h1 style={{ lineHeight: 1.04, letterSpacing: '-0.03em', margin: 0 }}>
                <span
                  className="block font-extralight text-neutral-500 dark:text-white/40"
                  style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)' }}
                >
                  Every expert deserves
                </span>
                <span
                  className="block font-black hero-gradient-text"
                  style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
                >
                  a site this good.
                </span>
              </h1>
            </div>

            {/* Body */}
            <p
              className="hero-fade hero-fade-3 text-base sm:text-lg leading-relaxed text-neutral-400 dark:text-neutral-400 max-w-sm lg:max-w-md mb-10"
            >
              Templates built for coaches, consultants, and service professionals.
              Pick a palette, pick a font pair, hand it off.
            </p>

            {/* Stats */}
            <div className="hero-fade hero-fade-4 flex items-center justify-center lg:justify-start gap-7 sm:gap-10 mb-2">
              {stats.map((s, i) => (
                <React.Fragment key={i}>
                  <div>
                    <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white" style={{ letterSpacing: '-0.03em' }}>{s.value}</p>
                    <p className="text-[0.58rem] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-1">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && <div className="h-10 w-px bg-neutral-200 dark:bg-white/10 shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile search */}
            <div className="lg:hidden mt-8 w-full hero-fade hero-fade-5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" style={{ zIndex: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm py-3 pl-10 pr-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[var(--purple-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Right: 3D card stack — desktop only ── */}
          <div className="hidden lg:block flex-shrink-0"
            style={{ width: '340px', height: '460px', position: 'relative' }}>

            {/* Glow behind stack */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px', height: '300px',
              borderRadius: '9999px',
              background: 'var(--purple-primary)',
              opacity: 0.15,
              filter: 'blur(70px)',
            }} />

            {STACK_CARDS.map((card, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '240px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  transform: `translate(-50%, -50%) rotate(${card.rotate}) translateY(${card.y}) scale(${card.scale})`,
                  opacity: ready ? 1 : 0,
                  transition: `opacity 0.7s ease ${card.delay}, transform 1s cubic-bezier(0.16,1,0.3,1) ${card.delay}`,
                  boxShadow: '0 28px 70px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)',
                  zIndex: card.z,
                }}
              >
                <img src={card.thumb} alt=""
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(150deg, rgba(255,255,255,0.22) 0%, transparent 40%)',
                  borderRadius: '18px',
                }} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
