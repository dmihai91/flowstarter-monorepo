import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const FLOATING_CARDS = [
  { thumb: '/thumbs/coach-pro.png',          rotate: '-8deg',  translateY: '-12px', translateX: '-180px', scale: '0.88', delay: '0s',    z: 1 },
  { thumb: '/thumbs/beauty-stylist.png',     rotate: '6deg',   translateY: '8px',   translateX: '175px',  scale: '0.85', delay: '0.3s',  z: 1 },
  { thumb: '/thumbs/therapist-care.png',     rotate: '-5deg',  translateY: '24px',  translateX: '-310px', scale: '0.74', delay: '0.15s', z: 0 },
  { thumb: '/thumbs/fitness-coach.png',      rotate: '10deg',  translateY: '18px',  translateX: '300px',  scale: '0.72', delay: '0.45s', z: 0 },
];

export function Hero({ templateCount, searchQuery, setSearchQuery }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  const stats = [
    { value: `${templateCount}`, label: 'templates' },
    { value: '6', label: 'colour palettes' },
    { value: '4', label: 'font pairings' },
  ];

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: '5rem', paddingBottom: '3rem', minHeight: '560px' }}>

      {/* ── Deep background layer ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary glow */}
        <div className="absolute rounded-full opacity-[0.13] dark:opacity-[0.18] blur-[120px]"
          style={{ width: '800px', height: '600px', top: '-100px', left: '50%', transform: 'translateX(-50%)', background: 'var(--purple-primary)' }} />
        {/* Secondary accent */}
        <div className="absolute rounded-full opacity-[0.07] dark:opacity-[0.1] blur-[80px]"
          style={{ width: '400px', height: '400px', top: '40%', right: '-60px', background: 'hsl(211 93% 65%)' }} />
        {/* Perspective grid */}
        <div className="absolute inset-x-0 bottom-0 h-64 opacity-[0.06] dark:opacity-[0.1]"
          style={{
            backgroundImage: 'linear-gradient(var(--purple-primary) 1px, transparent 1px), linear-gradient(90deg, var(--purple-primary) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }} />
      </div>

      {/* ── Floating 3D cards ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_CARDS.map((card, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '220px',
              transform: `translate(-50%, -50%) translateX(${card.translateX}) translateY(${card.translateY}) rotate(${card.rotate}) scale(${card.scale})`,
              opacity: ready ? (card.z === 1 ? 0.85 : 0.55) : 0,
              transition: `opacity 0.8s ease ${card.delay}, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${card.delay}`,
              zIndex: card.z,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.12)',
              filter: `blur(${card.z === 0 ? '1.5px' : '0px'})`,
            }}
          >
            <img
              src={card.thumb}
              alt=""
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
            />
            {/* Glass shine overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
              borderRadius: '16px',
            }} />
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">

        {/* Label */}
        <div
          className="inline-flex items-center gap-2.5 mb-8 hero-fade hero-fade-1"
          style={{
            background: 'var(--purple-primary)',
            backgroundClip: 'unset',
            padding: '0.35rem 0.9rem',
            borderRadius: '9999px',
            border: '1px solid color-mix(in srgb, var(--purple-primary) 40%, transparent)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-white">
            Handcrafted templates
          </span>
        </div>

        {/* Headline */}
        <div className="hero-fade hero-fade-2 mb-5">
          <h1 style={{ lineHeight: 1.08, letterSpacing: '-0.025em', margin: 0 }}>
            <span className="block font-light text-neutral-700 dark:text-white/70"
              style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.6rem)' }}>
              Every expert deserves
            </span>
            <span
              className="block font-black"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                background: 'linear-gradient(135deg, #6366f1 0%, #7C3AED 40%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 32px rgba(124,58,237,0.25))',
              }}>
              a site this good.
            </span>
          </h1>
        </div>

        {/* Body */}
        <p className="text-base sm:text-lg leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto mb-10 hero-fade hero-fade-3">
          Built for coaches, consultants, and service professionals.
          Pick a palette, pick a font pair, hand it off.
        </p>

        {/* Stats */}
        <div className="inline-flex items-center gap-0 rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm overflow-hidden mb-6 hero-fade hero-fade-4">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center px-7 py-4" style={{
              borderRight: i < stats.length - 1 ? '1px solid' : 'none',
              borderColor: 'rgba(128,128,128,0.12)',
            }}>
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</span>
              <span className="text-[0.58rem] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-0.5 whitespace-nowrap">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mobile search */}
        <div className="sm:hidden hero-fade hero-fade-5 mt-2">
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
    </section>
  );
}
