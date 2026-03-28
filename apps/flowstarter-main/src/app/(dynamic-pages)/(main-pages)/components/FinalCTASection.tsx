'use client';

import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden py-24 sm:py-32 mt-8">
      {/* Clean dark base */}
      <div className="absolute inset-0 bg-[#08070f]" />

      {/* Single subtle centre glow — that's it */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="w-[600px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          }} />
      </div>

      {/* Top border */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.5) 40%, rgba(124,58,237,0.5) 60%, transparent)' }} />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.12] tracking-tight mb-5 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-base sm:text-lg text-white/45 mb-10 max-w-sm mx-auto leading-relaxed">
          {finalCta.body}
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal?.(); }}
          className="inline-flex justify-center w-full sm:w-auto">
          <Button
            variant="brand-gradient"
            className="w-full sm:w-auto rounded-xl px-8 h-12 sm:px-10 sm:h-13 text-base font-semibold transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(124,58,237,0.30)] hover:shadow-[0_6px_32px_rgba(124,58,237,0.45)] border-0 group"
          >
            {finalCta.cta}
            <svg className="w-4 h-4 ml-2.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </a>
        <p className="mt-5 text-xs text-white/20">No commitment. No tech knowledge needed.</p>
      </div>
    </section>
  );
}
