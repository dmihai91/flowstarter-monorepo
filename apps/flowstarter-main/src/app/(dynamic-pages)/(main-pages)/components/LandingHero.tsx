'use client';

import { useState, useEffect } from 'react';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

import { LANDING_COPY, type HeroCopy } from '../landing-copy';
import { PreQualModal } from './PreQualModal';

/**
 * Landing page hero — clean, focused, high-converting.
 * Only: badge, headline, one paragraph, CTA.
 */
export function LandingHero() {
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);
  const hero = LANDING_COPY.hero;

  return (
    <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-2 lg:pb-6 overflow-hidden">
      {/* Background gradient — premium multi-layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Base wash — barely tinted */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--hero-wash-from)] via-[var(--hero-wash-via)] to-[var(--hero-wash-to)]" />
        {/* Central halo — single radial glow behind headline area */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[90%] sm:w-[70%] h-[60%] rounded-full bg-[var(--hero-glow-primary)] opacity-[0.22] dark:opacity-[0.20] blur-[80px] md:blur-[120px] lg:blur-[200px] will-change-transform" />
        {/* Subtle secondary — slight cool shift lower */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[60%] sm:w-[45%] h-[40%] rounded-full bg-[var(--hero-glow-secondary)] opacity-[0.14] dark:opacity-[0.13] blur-[80px] md:blur-[120px] lg:blur-[180px] will-change-transform" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
      </div>

      {/* Bottom fade — smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[var(--landing-bg)]/50 to-[var(--landing-bg)] dark:via-[var(--landing-dark-surface)]/50 dark:to-[var(--landing-dark-surface)] pointer-events-none z-[1]" />

      {/* Subtle flow lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.30]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
          <defs>
            <linearGradient id="heroLine1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--purple)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--purple)" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="animate-[flowDrift_20s_ease-in-out_infinite_alternate]">
            <path d="M-100,200 Q200,170 500,230 T1000,190 T1400,230" stroke="url(#heroLine1)" strokeWidth="1" />
            <path d="M-100,400 Q300,370 600,430 T1100,390 T1400,420" stroke="url(#heroLine1)" strokeWidth="0.8" />
            <path d="M-100,600 Q250,570 550,630 T1050,590 T1400,620" stroke="url(#heroLine1)" strokeWidth="0.6" />
          </g>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 text-center">
        {/* Badge */}
        <div
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)', filter: ready ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1), filter 0.85s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.1s' }}
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.06] backdrop-blur-md border border-gray-200/40 dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-white/70">
              AI-powered launch support
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-5 text-gray-900 dark:text-white drop-shadow-sm"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(28px)', filter: ready ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1), filter 0.85s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.22s' }}
        >
          {hero.headlinePrefix}
          <br />
          <span className="text-flow"><span className="inline">{hero.headlineHighlight}</span></span>
        </h1>

        {/* Body */}
        <p
          className="text-xl sm:text-2xl text-gray-600 dark:text-white/55 leading-relaxed mb-4 max-w-2xl mx-auto"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(28px)', filter: ready ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1), filter 0.85s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.38s' }}
        >
          <span className="font-semibold text-gray-900 dark:text-white block mb-1">{hero.subheadlineBold}</span>
          <span>{hero.subheadline}</span>
        </p>

        {/* Audience qualifier */}
        <p
          className="text-base sm:text-lg text-gray-500 dark:text-white/60 mb-7 max-w-xl mx-auto font-medium"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(28px)', filter: ready ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1), filter 0.85s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.50s' }}
        >
          {hero.trustLine}
        </p>

        {/* CTA */}
        <div
          className="flex flex-col items-center gap-4"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(28px)', filter: ready ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1), filter 0.85s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.64s' }}
        >
          <button type="button" onClick={() => setModalOpen(true)}>
            <Button variant="brand-gradient" className="relative overflow-hidden bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] rounded-xl px-8 sm:px-10 h-13 sm:h-14 text-base sm:text-lg shadow-[0_8px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.35)] hover:scale-[1.03] active:scale-[0.98] group">
              {hero.primaryCta}
              <svg className="w-5 h-5 ml-2.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </button>
          <PreQualModal open={modalOpen} onClose={() => setModalOpen(false)} source="hero" />
          <a
            href="#pricing"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--landing-card-border)] bg-white/60 px-6 py-3 text-sm font-medium text-gray-700 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-md hover:border-[var(--purple-primary)]/35 hover:text-gray-900 dark:bg-white/[0.03] dark:text-white/70 dark:hover:text-white transition-colors"
          >
            {hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
