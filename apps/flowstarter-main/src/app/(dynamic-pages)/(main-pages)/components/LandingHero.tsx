'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';
import { FlowBackground } from '@flowstarter/flow-design-system';

function useCountUp(target: number, duration: number = 1200, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export function LandingHero({ onOpenModal }: { onOpenModal?: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const hero = LANDING_COPY.hero;

  const fade = (delay: string) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  });

  const statsStarted = ready;
  const weekCount = useCountUp(1, 800, statsStarted);
  const skillsCount = useCountUp(0, 600, statsStarted);
  const trialCount = useCountUp(30, 1000, statsStarted);

  const stats = [
    { value: `~${weekCount}`, suffix: ' week', label: 'avg. delivery' },
    { value: `${skillsCount}`, suffix: '', label: 'coding skills needed' },
    { value: `${trialCount}`, suffix: '-day trial', label: 'partial refund if not happy' },
  ];

  return (
    <section className="relative overflow-hidden pt-20 sm:pt-24 pb-6 sm:pb-14">
      <FlowBackground variant="landing" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-10">

        {/* Label */}
        <div style={fade('0s')} className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
          <div className="h-px w-6 bg-[var(--purple)]/60" />
          <span className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase text-[var(--purple)]">
            Done-for-you websites
          </span>
          <div className="h-px w-6 bg-[var(--purple)]/60" />
        </div>

        {/* Headline */}
        <div style={fade('0.1s')} className="text-center mb-5 sm:mb-6">
          <h1 className="leading-[1.15] tracking-tight text-gray-900 dark:text-white">
            <span
              className="block font-light"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)' }}
            >
              {hero.headlinePrefix}
            </span>
            <span
              className="block font-black text-flow"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
            >
              {hero.headlineHighlight}
            </span>
          </h1>
        </div>

        {/* Body */}
        <p
          style={fade('0.2s')}
          className="text-center text-base sm:text-lg text-gray-500 dark:text-white/55 leading-relaxed max-w-xl mx-auto mb-7 sm:mb-8"
        >
          {hero.subheadline}
        </p>

        {/* Audience pills */}
        <div style={fade('0.25s')} className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {['Coaches', 'Consultants', 'Therapists', 'Freelancers', 'Founders'].map((label) => (
            <span key={label} className="text-[0.65rem] sm:text-xs font-medium px-2.5 sm:px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-gray-500 dark:text-white/40 backdrop-blur-sm">
              {label}
            </span>
          ))}
        </div>

        {/* CTA row */}
        <div style={fade('0.3s')} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16">
          <Button
            variant="brand-gradient"
            onClick={() => onOpenModal?.()}
            className="relative overflow-hidden bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] px-7 h-11 text-sm sm:text-base font-semibold rounded-2xl shadow-[0_4px_24px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.45)] hover:scale-[1.02] active:scale-[0.98] group"
          >
            {hero.primaryCta}
            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Button>
          <a
            href="#pricing"
            onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-xs sm:text-sm font-medium text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 underline underline-offset-4 transition-colors"
          >
            {hero.secondaryCta}
          </a>
        </div>

        {/* Stats */}
        <div
          style={fade('0.4s')}
          className="flex items-start justify-center gap-8 sm:gap-14 pt-7 sm:pt-8 border-t border-gray-100 dark:border-white/[0.07]"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none tabular-nums">
                {s.value}<span className="text-base sm:text-lg font-semibold text-[var(--purple)]">{s.suffix}</span>
              </p>
              <p className="text-[0.55rem] sm:text-[0.65rem] uppercase tracking-widest text-gray-400 dark:text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
