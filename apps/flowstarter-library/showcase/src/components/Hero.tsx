import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const STACK_CARDS = [
  { thumb: '/thumbs/coach-pro.png',      rotate: '-7deg',  y: '-20px', scale: 1,    delay: '0s',    z: 3 },
  { thumb: '/thumbs/beauty-stylist.png', rotate: '5deg',   y: '10px',  scale: 0.94, delay: '0.1s',  z: 2 },
  { thumb: '/thumbs/therapist-care.png', rotate: '-3deg',  y: '32px',  scale: 0.87, delay: '0.18s', z: 1 },
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
    <section className="relative overflow-hidden" style={{ paddingTop: '3.5rem', paddingBottom: '2.5rem' }}>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center gap-10 lg:gap-16">

          {/* ── Left: content ── */}
          <div className="flex-1 min-w-0">

            {/* Label */}
            <div className="flex items-center gap-3 mb-6 hero-fade hero-fade-1">
              <div className="h-px w-5" style={{ background: 'var(--purple-primary)', opacity: 0.7 }} />
              <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--purple-primary)' }}>
                Handcrafted templates
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-fade hero-fade-2" style={{ lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 1rem' }}>
              <span className="block font-light text-neutral-600 dark:text-white/55"
                style={{ fontSize: 'clamp(1.7rem, 3.8vw, 3.4rem)' }}>
                Every expert deserves
              </span>
              <span className="block font-black" style={{
                fontSize: 'clamp(2.1rem, 5vw, 4.4rem)',
                background: 'linear-gradient(130deg, #5b5ef4 0%, #7C3AED 45%, #b060f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                a site this good.
              </span>
            </h1>

            {/* Body */}
            <p className="text-sm sm:text-base leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-sm mb-8 hero-fade hero-fade-3">
              Templates built for coaches, consultants, and service professionals.
              Pick a palette, pick a font pair, hand it off.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 sm:gap-8 hero-fade hero-fade-4">
              {stats.map((s, i) => (
                <React.Fragment key={i}>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                    <p className="text-[0.55rem] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && <div className="h-7 w-px bg-neutral-200 dark:bg-white/10" />}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile search */}
            <div className="lg:hidden mt-7 hero-fade hero-fade-5">
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
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm py-2.5 pl-10 pr-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[var(--purple-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--purple-primary)]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Right: 3D card stack — desktop only ── */}
          <div className="hidden lg:block flex-shrink-0"
            style={{ width: '300px', height: '400px', position: 'relative' }}>

            {/* Purple glow behind stack */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '260px', height: '260px',
              borderRadius: '9999px',
              background: 'var(--purple-primary)',
              opacity: 0.12,
              filter: 'blur(60px)',
            }} />

            {STACK_CARDS.map((card, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '220px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transform: `translate(-50%, -50%) rotate(${card.rotate}) translateY(${card.y}) scale(${card.scale})`,
                  opacity: ready ? 1 : 0,
                  transition: `opacity 0.7s ease ${card.delay}, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${card.delay}`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.12)',
                  zIndex: card.z,
                }}
              >
                <img src={card.thumb} alt=""
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                {/* Glass shine */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(150deg, rgba(255,255,255,0.2) 0%, transparent 40%)',
                  borderRadius: '14px',
                }} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
