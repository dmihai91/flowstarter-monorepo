'use client';

import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export function FinalCTASection() {
  const { t } = useI18n();


  return (
    <>
        {/* Final CTA */}
        <section className="py-16 lg:py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-[var(--purple)]/[0.03] to-transparent dark:via-[var(--purple)]/[0.05]">
          {/* Top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

          {/* Centered radial glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[700px] h-[500px] rounded-full bg-blue-400/10 dark:bg-blue-500/20 blur-[130px]" />
          </div>

          {/* Flow lines pattern */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.08]" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" fill="none">
              <defs>
                <linearGradient id="ctaFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="25%" stopColor="#3b82f6" />
                  <stop offset="75%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path d="M-100,60 Q200,40 400,80 T800,50 T1300,90" stroke="url(#ctaFlowGrad)" strokeWidth="1.5" />
              <path d="M-100,140 Q250,160 450,120 T850,160 T1300,130" stroke="url(#ctaFlowGrad)" strokeWidth="1.5" />
              <path d="M-100,220 Q200,200 400,240 T800,210 T1300,250" stroke="url(#ctaFlowGrad)" strokeWidth="1.5" />
              <path d="M-100,300 Q250,320 450,280 T850,320 T1300,290" stroke="url(#ctaFlowGrad)" strokeWidth="1.5" />
              <path d="M-100,100 Q200,80 400,120 T800,90 T1300,130" stroke="url(#ctaFlowGrad)" strokeWidth="1" opacity="0.5" />
              <path d="M-100,180 Q250,200 450,160 T850,200 T1300,170" stroke="url(#ctaFlowGrad)" strokeWidth="1" opacity="0.5" />
              <path d="M-100,260 Q200,240 400,280 T800,250 T1300,290" stroke="url(#ctaFlowGrad)" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-5">
              <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t('landing.cta.title')}
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/50 mb-10 max-w-md mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center w-full sm:w-auto">
              <Button className="relative overflow-hidden w-full sm:w-auto bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-[length:200%_auto] animate-gradient text-white hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] rounded-lg px-12 h-16 text-lg font-semibold shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105">
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
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-sm text-gray-500 dark:text-white/40 font-medium">
              <span className="text-gray-500 dark:text-white/40">€399 setup</span>
              <span className="text-gray-300 dark:text-white/20">·</span>
              <span className="text-gray-500 dark:text-white/40">€39/month</span>
              <span className="text-gray-300 dark:text-white/20">·</span>
              <span className="text-gray-500 dark:text-white/40">First month free</span>
            </div>
          </div>
        </section>
    </>
  );
}
