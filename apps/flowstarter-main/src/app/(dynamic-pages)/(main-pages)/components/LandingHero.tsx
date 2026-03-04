'use client';

import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

/**
 * Landing page hero — clean, focused, high-converting.
 * Only: badge, headline, one paragraph, CTA.
 */
export function LandingHero() {
  const { t } = useI18n();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-2 lg:pb-6 overflow-hidden">
      {/* Background gradient — premium multi-layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Base wash — warm to cool */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hero-wash-from)] via-[var(--hero-wash-via)] to-[var(--hero-wash-to)]" />
        {/* Primary — violet glow, upper-left */}
        <div className="absolute -top-[15%] -left-[10%] w-[75%] sm:w-[60%] h-[65%] rounded-full bg-[var(--hero-glow-primary)] opacity-30 dark:opacity-40 blur-[60px] md:blur-[100px] lg:blur-[180px] will-change-transform" />
        {/* Secondary — rose glow, lower-right */}
        <div className="absolute -bottom-[5%] -right-[8%] w-[65%] sm:w-[50%] h-[55%] rounded-full bg-[var(--hero-glow-secondary)] opacity-25 dark:opacity-30 blur-[60px] md:blur-[100px] lg:blur-[180px] will-change-transform" />
        {/* Accent — cool blue, center-right */}
        <div className="absolute top-[25%] right-[8%] w-[30%] sm:w-[22%] h-[35%] rounded-full bg-[var(--hero-glow-accent)] opacity-20 dark:opacity-25 blur-[60px] md:blur-[100px] lg:blur-[200px] will-change-transform" />
        {/* Focal — concentrated glow behind headline */}
        <div className="absolute top-[18%] left-[30%] w-[30%] sm:w-[20%] h-[30%] rounded-full bg-[var(--hero-glow-focal)] opacity-25 dark:opacity-20 blur-[40px] md:blur-[70px] lg:blur-[120px] will-change-transform" />
      </div>

      {/* Bottom fade — smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[var(--landing-bg)]/50 to-[var(--landing-bg)] dark:via-[var(--landing-dark-surface)]/50 dark:to-[var(--landing-dark-surface)] pointer-events-none z-[1]" />

      {/* Subtle flow lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.05]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
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
        <div className={`transition-all duration-700 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="hero-fade hero-fade-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.06] backdrop-blur-md border border-gray-200/40 dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-white/70">
              {t('landing.hero.badge')}
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className={`hero-fade hero-fade-2 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-8 text-gray-900 dark:text-white`}>
          {t('landing.hero.headline1')}
          <br />
          <span className="text-flow">{t('landing.hero.headline2')}</span>
        </h1>

        {/* Body */}
        <p className="hero-fade hero-fade-3 text-lg sm:text-xl text-gray-500 dark:text-white/55 leading-relaxed mb-4 max-w-2xl mx-auto">
          {t('landing.hero.pain')}
        </p>

        {/* Audience qualifier */}
        <p className="hero-fade hero-fade-3 text-sm sm:text-base text-gray-400 dark:text-white/40 mb-10 max-w-xl mx-auto">
          {t('landing.hero.audience')}
        </p>

        {/* CTA */}
        <div className="hero-fade hero-fade-4">
          <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer">
            <Button className="relative overflow-hidden bg-gradient-to-r from-[var(--purple)] via-blue-500 to-[var(--purple)] bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] text-white rounded-xl px-8 sm:px-10 h-13 sm:h-14 text-base sm:text-lg font-semibold shadow-[0_8px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group">
              {t('landing.hero.cta')}
              <svg className="w-5 h-5 ml-2.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </a>
          <p className="hero-fade hero-fade-5 text-sm text-gray-400 dark:text-white/35 mt-4">
            {t('landing.hero.ctaNote')}
          </p>

          {/* Launch price anchor */}
          <div className="hero-fade hero-fade-5 inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-8 px-6 sm:px-8 py-4 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-50/80 to-orange-50/60 dark:from-amber-500/[0.06] dark:to-orange-500/[0.03] backdrop-blur-sm border border-amber-200/40 dark:border-amber-500/15 shadow-[0_2px_16px_rgba(245,158,11,0.08)]">
            <span className="text-[0.625rem] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">🔥 Limited launch price</span>
            <span className="hidden sm:block w-px h-5 bg-amber-300/30 dark:bg-amber-500/20" />
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm text-gray-400 dark:text-white/30 line-through">€699</span>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">€499</span>
                <span className="text-xs text-gray-400 dark:text-white/35">setup</span>
              </div>
              <span className="text-gray-300 dark:text-white/15">+</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm text-gray-400 dark:text-white/30 line-through">€49</span>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">€39</span>
                <span className="text-xs text-gray-400 dark:text-white/35">/mo</span>
              </div>
            </div>
          </div>
          <p className="hero-fade hero-fade-5 text-xs sm:text-sm text-amber-600/70 dark:text-amber-400/50 mt-3">This price won't last. Lock it in before it goes up.</p>

          {/* Limited spots indicator — hidden for now, uncomment when ready
          <div className="hero-fade hero-fade-5 flex items-center justify-center gap-2 mt-8 text-sm sm:text-base text-gray-500 dark:text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Launch batch: accepting only 10 clients</span>
            <span className="font-semibold text-gray-700 dark:text-white/70">· 10 spots remaining</span>
          </div>
          */}
        </div>
      </div>
    </section>
  );
}
