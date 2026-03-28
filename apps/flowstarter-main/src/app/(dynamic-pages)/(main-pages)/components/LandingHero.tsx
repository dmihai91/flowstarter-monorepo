'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function LandingHero({ onOpenModal }: { onOpenModal?: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  const hero = LANDING_COPY.hero;

  const anim = (delay: string) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}`,
  });

  return (
    <section className="relative min-h-[90dvh] flex items-center overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-[var(--purple)] opacity-[0.07] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[50%] bg-blue-500 opacity-[0.05] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-16 lg:gap-24 items-center">

          {/* Left — content */}
          <div className="max-w-2xl">

            {/* Eyebrow */}
            <div style={anim('0s')} className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-[var(--purple)]" />
              <span className="text-sm font-semibold text-[var(--purple)] tracking-widest uppercase">
                Done-for-you websites
              </span>
            </div>

            {/* Headline — mixed weight, large */}
            <h1 style={anim('0.1s')} className="mb-6 text-gray-900 dark:text-white">
              <span className="block font-light leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}>
                {hero.headlinePrefix}
              </span>
              <span className="block font-extrabold leading-[1.05] tracking-tight text-flow" style={{ fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)' }}>
                {hero.headlineHighlight}
              </span>
            </h1>

            {/* Body */}
            <p style={anim('0.2s')} className="text-lg sm:text-xl text-gray-500 dark:text-white/60 leading-relaxed mb-10 max-w-lg">
              {hero.subheadline}
            </p>

            {/* CTAs */}
            <div style={anim('0.3s')} className="flex flex-wrap items-center gap-4">
              <Button
                variant="brand-gradient"
                onClick={() => onOpenModal?.()}
                className="relative overflow-hidden bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] h-13 px-7 text-base font-semibold rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_28px_rgba(124,58,237,0.45)] hover:scale-[1.02] active:scale-[0.98] group"
              >
                {hero.primaryCta}
                <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Button>
              <a
                href="#pricing"
                onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-sm font-medium text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white underline underline-offset-4 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-all"
              >
                {hero.secondaryCta}
              </a>
            </div>

            {/* Social proof row */}
            <div style={anim('0.4s')} className="mt-12 pt-8 border-t border-gray-100 dark:border-white/[0.07] flex flex-wrap items-center gap-6">
              {[
                { value: '3 weeks', label: 'avg. delivery' },
                { value: '0', label: 'skills needed' },
                { value: '30-day', label: 'money-back' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — abstract visual */}
          <div style={anim('0.15s')} className="hidden lg:flex flex-col gap-3 w-[260px]">
            {[
              { icon: '🌐', label: 'Live landing page', sub: 'Mobile-first, fast' },
              { icon: '📅', label: 'Booking & contact', sub: 'Calendly integrated' },
              { icon: '⚡', label: 'Ready in 3 weeks', sub: 'No back-and-forth' },
              { icon: '🔄', label: 'Monthly updates', sub: 'We handle it all' },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{ ...anim(`${0.15 + i * 0.08}s`), transform: ready ? `translateX(0)` : 'translateX(20px)' }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07] backdrop-blur-sm"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
