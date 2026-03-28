'use client';

import { useState, useEffect } from 'react';
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export function LandingHero({ onOpenModal }: { onOpenModal?: () => void }) {
  const [ready] = useState(true);
  const hero = LANDING_COPY.hero;

  const fade = (delay: string) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  });

  const statsStarted = ready;
  const deliveryCount = useCountUp(7, 1200, statsStarted);
  const displayDelivery = 14 - deliveryCount;
  const deliveryValue = displayDelivery <= 7 ? '5–7' : `${displayDelivery}`;
  const skillsCount = useCountUp(0, 600, statsStarted);
  const trialCount = useCountUp(30, 1000, statsStarted);

  const stats = [
    { value: deliveryValue, suffix: ' days', label: 'avg. delivery' },
    { value: `${skillsCount}`, suffix: '', label: 'coding skills needed' },
    { value: `${trialCount}`, suffix: '-day trial', label: 'money-back guarantee' },
  ];

  const prefixWords = hero.headlinePrefix.split(' ');

  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28 pb-6 sm:pb-14">
      <FlowBackground variant="landing" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Top-center gradient crown */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1]"
        style={{
          height: '520px',
          background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(124,58,237,0.18) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)',
        }}
      />

      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
        {/* Left-purple orb */}
        <div
          style={{
            position: 'absolute',
            width: '420px', height: '420px',
            top: '-120px', left: '-60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
            filter: 'blur(48px)',
            animation: 'flow-drift-1 22s ease-in-out infinite',
          }}
        />
        {/* Right-cyan orb */}
        <div
          style={{
            position: 'absolute',
            width: '360px', height: '360px',
            top: '-60px', right: '-40px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(59,130,246,0.07) 50%, transparent 70%)',
            filter: 'blur(48px)',
            animation: 'flow-drift-2 28s ease-in-out infinite',
          }}
        />
        {/* Bottom-center warm glow */}
        <div
          style={{
            position: 'absolute',
            width: '500px', height: '200px',
            bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'flow-drift-3 18s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-10">

        {/* Label */}
        <div style={fade('0s')} className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
          <div
            className="h-px w-8"
            style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.7))' }}
          />
          <span
            className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full text-[var(--purple)] dark:text-[var(--purple)]"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.08))',
              border: '1.5px solid rgba(124,58,237,0.35)',
              boxShadow: '0 0 16px rgba(124,58,237,0.18)',
              animation: 'badgeGlow 2.8s ease-in-out infinite',
            }}
          >
            ✦ Live in 5–7 days
          </span>
          <div
            className="h-px w-8"
            style={{ background: 'linear-gradient(to left, transparent, rgba(124,58,237,0.7))' }}
          />
        </div>

        {/* Headline */}
        <div className="text-center mb-5 sm:mb-6" style={fade('0.05s')}>
          <h1 className="leading-[1.15] tracking-tight">
            {/* Prefix: word-by-word entrance */}
            <span
              className="block font-light text-gray-900 dark:text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)' }}
            >
              {prefixWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    animationName: 'wordReveal',
                    animationDuration: '0.6s',
                    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    animationFillMode: 'both',
                    animationDelay: `${0.15 + i * 0.07}s`,
                    marginRight: '0.25em',
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
            {/* Highlight: animated gradient */}
            <span
              className="block font-black"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                background: 'linear-gradient(135deg, var(--purple) 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                animation: `wordReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) both ${0.15 + prefixWords.length * 0.07}s, textFlow 6s ease infinite ${0.85 + prefixWords.length * 0.07}s`,
              }}
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
            <span
              key={label}
              className="text-[0.65rem] sm:text-xs font-medium px-2.5 sm:px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-gray-500 dark:text-white/40 backdrop-blur-sm transition-colors hover:border-[var(--purple)]/30 hover:text-[var(--purple)] dark:hover:text-[var(--purple)]"
            >
              {label}
            </span>
          ))}
        </div>

        {/* CTA row */}
        <div style={fade('0.3s')} className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 mb-10 sm:mb-16">
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
            className="inline-flex items-center gap-1 text-sm sm:text-base font-medium text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80 underline underline-offset-4 decoration-gray-300 dark:decoration-white/20 hover:decoration-gray-500 dark:hover:decoration-white/50 transition-all"
          >
            {hero.secondaryCta}
            <svg className="w-3.5 h-3.5 mt-0.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </a>
        </div>

        {/* Stats */}
        <div
          style={fade('0.4s')}
          className="flex items-start justify-center gap-4 sm:gap-14 pt-7 sm:pt-8 border-t border-gray-300 dark:border-white/[0.07] w-full"
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center flex-1 min-w-0">
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none tabular-nums">
                {s.value}<span className="text-base sm:text-lg font-semibold text-[var(--purple)]">{s.suffix}</span>
              </p>
              <p className="text-[0.5rem] sm:text-[0.65rem] uppercase tracking-widest text-gray-400 dark:text-white/30 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
