'use client';

import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection({ onOpenModal }: { onOpenModal?: () => void }) {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <section className="relative overflow-hidden mt-8">
      {/* Light mode background */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            'linear-gradient(135deg, hsl(241,70%,91%) 0%, hsl(241,65%,85%) 100%)',
        }}
      />

      {/* Dark mode background */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: 'hsl(240, 16%, 11%)',
        }}
      />

      {/* Soft glow — light mode (on dark bg) */}
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 55%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Soft glow — dark mode */}
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(109,40,217,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto px-6 py-12 sm:py-16 xl:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-semibold text-gray-900 dark:text-white leading-[1.12] tracking-tight mb-5 [text-wrap:balance]">
          {finalCta.headline}
        </h2>
        <p className="text-base lg:text-lg xl:text-xl text-gray-500 dark:text-slate-400 mb-6 max-w-xs lg:max-w-sm xl:max-w-md mx-auto leading-relaxed">
          One free call. Live in a week.
        </p>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenModal?.();
          }}
          className="inline-flex justify-center w-full sm:w-auto"
        >
          <Button className="w-full sm:w-auto rounded-xl px-8 h-12 sm:px-10 text-base font-semibold bg-indigo-500 text-white hover:bg-indigo-400 transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] border-0 group cursor-pointer">
            {finalCta.cta}
            <svg
              className="w-4 h-4 ml-2.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
        </a>

        <p className="mt-6 text-sm text-slate-500">
          No commitment. No tech knowledge needed.
        </p>
      </div>
    </section>
  );
}
