'use client';

import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden mt-8">
      {/* Colorful gradient background */}
      <div className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 35%, #a855f7 60%, #06b6d4 100%)',
        }} />

      {/* Subtle dark overlay for depth */}
      <div className="absolute inset-0 bg-black/20" />


      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-24 pb-28 sm:pt-32 sm:pb-36 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.12] tracking-tight mb-5 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-base sm:text-lg text-white/70 mb-10 max-w-sm mx-auto leading-relaxed">
          {finalCta.body}
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal?.(); }}
          className="inline-flex justify-center w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto rounded-xl px-8 h-12 sm:px-10 text-base font-semibold bg-white text-[#4f46e5] hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.35)] border-0 group"
          >
            {finalCta.cta}
            <svg className="w-4 h-4 ml-2.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </a>
        <p className="mt-5 text-xs text-white/40">No commitment. No tech knowledge needed.</p>
      </div>
    </section>
  );
}
