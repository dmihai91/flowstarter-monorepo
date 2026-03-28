'use client';

import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden mt-8">
      {/* Gradient — muted, dark-shifted */}
      <div className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #3b1e6e 40%, #1e3a5f 100%)',
        }} />

      {/* Dark overlay — heavier on dark mode */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />

      {/* Top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/15" />

      {/* Content */}
      <div className="relative z-10 max-w-xl mx-auto px-6 pt-20 pb-24 sm:pt-24 sm:pb-28 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.15] tracking-tight mb-4 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-sm sm:text-base text-white/55 mb-8 max-w-xs mx-auto leading-relaxed">
          One free call. Live in a week.
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal?.(); }}
          className="inline-flex justify-center w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto rounded-xl px-8 h-11 sm:px-10 text-base font-semibold bg-white text-indigo-700 hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-0 group"
          >
            {finalCta.cta}
            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </a>
        <p className="mt-4 text-xs text-white/25">No commitment. No tech knowledge needed.</p>
      </div>
    </section>
  );
}
