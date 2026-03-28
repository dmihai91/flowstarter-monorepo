'use client';

import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden mt-8">
      {/* Gradient — original colorful but toned down with overlay */}
      <div className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 35%, #7c3aed 60%, #0891b2 100%)',
        }} />

      {/* Overlay — stronger on dark */}
      <div className="absolute inset-0 bg-white/25 dark:bg-black/70" />

      {/* Top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

      {/* Content — more padding */}
      <div className="relative z-10 max-w-xl mx-auto px-6 py-16 sm:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.12] tracking-tight mb-5 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-base text-white/60 mb-10 max-w-xs mx-auto leading-relaxed">
          One free call. Live in a week.
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal?.(); }}
          className="inline-flex justify-center w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto rounded-xl px-8 h-12 sm:px-10 text-base font-semibold bg-white text-[#4f46e5] hover:bg-white/92 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.25)] border-0 group"
          >
            {finalCta.cta}
            <svg className="w-4 h-4 ml-2.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </a>
        <p className="mt-5 text-xs text-white/30">No commitment. No tech knowledge needed.</p>
      </div>
    </section>
  );
}
