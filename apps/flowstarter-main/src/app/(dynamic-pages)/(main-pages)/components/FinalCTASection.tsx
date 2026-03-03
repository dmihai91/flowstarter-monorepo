'use client';

import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export function FinalCTASection() {
  const { t } = useI18n();


  return (
    <>
        {/* Final CTA */}
        <section className="py-8 lg:py-28 mt-12 lg:mt-16 relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] dark:from-[#0c0a1d] dark:via-[#14103a] dark:to-[#1e1b4b]">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[700px] h-[450px] rounded-full bg-indigo-500/15 blur-[160px]" />
          </div>

          {/* Flow lines pattern */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" fill="none">
              <defs>
                <linearGradient id="ctaFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="25%" stopColor="var(--landing-flow-end)" />
                  <stop offset="75%" stopColor="var(--landing-flow-end-light)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path d="M-100,100 Q200,80 400,120 T800,90 T1300,130" stroke="url(#ctaFlowGrad)" strokeWidth="0.6" />
              <path d="M-100,220 Q200,200 400,240 T800,210 T1300,250" stroke="url(#ctaFlowGrad)" strokeWidth="0.6" />
              <path d="M-100,340 Q250,320 450,360 T850,330 T1300,370" stroke="url(#ctaFlowGrad)" strokeWidth="0.6" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              <span className="bg-gradient-to-r from-white via-blue-300 to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t('landing.cta.title')}
              </span>
            </h2>
            <p className="text-base text-white/50 mb-6 sm:mb-10 max-w-md mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center w-full sm:w-auto">
              <Button className="relative overflow-hidden w-full sm:w-auto bg-white text-[#0f0c29] hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-lg px-8 h-12 text-base sm:px-12 sm:h-16 sm:text-lg font-semibold shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105">
                {t('landing.cta.button')}
                <svg
                  className="w-5 h-5 ml-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Button>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-sm text-white/40 font-medium">
              <span>€499 setup</span>
              <span className="text-white/20">·</span>
              <span>€39/month</span>
              <span className="text-white/20">·</span>
              <span>First month free</span>
            </div>
          </div>
        </section>
    </>
  );
}
