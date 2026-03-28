'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';
import { FlowBackground } from '@flowstarter/flow-design-system';

export function LandingHero({ onOpenModal }: { onOpenModal?: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const hero = LANDING_COPY.hero;

  const fade = (delay: string) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  });

  return (
    <section className="relative pt-16 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">

      <FlowBackground variant="landing" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10">

        {/* Label */}
        <div style={fade('0s')} className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-6 bg-[var(--purple)]/60" />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--purple)]">
            Done-for-you websites
          </span>
          <div className="h-px w-6 bg-[var(--purple)]/60" />
        </div>

        {/* Headline */}
        <div style={fade('0.1s')} className="text-center mb-6">
          <h1 className="leading-[1.1] tracking-tight text-gray-900 dark:text-white">
            <span
              className="block font-light"
              style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)' }}
            >
              {hero.headlinePrefix}
            </span>
            <span
              className="block font-black text-flow"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
            >
              {hero.headlineHighlight}
            </span>
          </h1>
        </div>

        {/* Body */}
        <p
          style={fade('0.2s')}
          className="text-center text-base sm:text-lg text-gray-500 dark:text-white/55 leading-relaxed max-w-xl mx-auto mb-10"
        >
          {hero.subheadline}
        </p>

        {/* CTA row */}
        <div style={fade('0.3s')} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            variant="brand-gradient"
            onClick={() => onOpenModal?.()}
            className="relative overflow-hidden bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] px-8 h-12 text-base font-semibold rounded-2xl shadow-[0_4px_24px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.45)] hover:scale-[1.02] active:scale-[0.98] group"
          >
            {hero.primaryCta}
            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Button>
          <a
            href="#pricing"
            onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-sm font-medium text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 underline underline-offset-4 transition-colors"
          >
            {hero.secondaryCta}
          </a>
        </div>

        {/* Stats */}
        <div
          style={fade('0.4s')}
          className="flex items-center justify-center gap-8 sm:gap-14 pt-8 border-t border-gray-100 dark:border-white/[0.07]"
        >
          {[
            { value: '~1 week', label: 'avg. delivery' },
            { value: 'Zero', label: 'skills needed' },
            { value: '30-day trial', label: 'partial refund if not happy' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[0.65rem] uppercase tracking-widest text-gray-400 dark:text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
