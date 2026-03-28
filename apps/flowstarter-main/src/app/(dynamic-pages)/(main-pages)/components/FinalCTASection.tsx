'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 mt-8">
      {/* Deep dark base — stands out from page */}
      <div className="absolute inset-0 bg-[#07060f] dark:bg-[#07060f]" />

      {/* Top border glow */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.7) 30%, rgba(99,102,241,0.9) 50%, rgba(124,58,237,0.7) 70%, transparent)' }} />

      {/* Large left orb */}
      <div className="pointer-events-none absolute -left-40 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(99,102,241,0.10) 50%, transparent 70%)', filter: 'blur(72px)' }} />

      {/* Large right orb */}
      <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)', filter: 'blur(72px)' }} />

      {/* Centre bloom */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
        <div className="w-[700px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
          style={{ color: 'rgba(167,139,250,0.9)' }}>
          Ready to launch?
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-base sm:text-lg text-white/50 mb-10 max-w-md mx-auto leading-relaxed">
          {finalCta.body}
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenModal?.(); }}
          className="inline-flex justify-center w-full sm:w-auto">
          <Button
            variant="brand-gradient"
            className="relative overflow-hidden w-full sm:w-auto rounded-xl px-8 h-12 sm:px-12 sm:h-14 text-base sm:text-lg font-semibold transition-all duration-300 hover:scale-[1.03] shadow-[0_8px_32px_rgba(124,58,237,0.40)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.55)] border-0 group"
          >
            {finalCta.cta}
            <svg className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </a>
        <p className="mt-5 text-xs text-white/25">No commitment. No tech knowledge needed.</p>
      </div>

      {/* Bottom border glow */}
      <div className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.3) 50%, transparent)' }} />
    </section>
  );
}
