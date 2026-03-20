'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '../landing-copy';

export function FinalCTASection() {
  const finalCta = LANDING_COPY.finalCta;

  return (
    <>
        {/* Final CTA */}
        <section className="py-8 lg:py-18 mt-8 lg:mt-10 relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] dark:from-[#0c0a1d] dark:via-[#14103a] dark:to-[#1e1b4b]">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[700px] h-[450px] rounded-full bg-indigo-500/8 blur-[180px]" />
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
                {finalCta.headline}
              </span>
            </h2>
            <p className="text-base text-white/50 mb-6 sm:mb-10 max-w-md mx-auto">
              {finalCta.body}
            </p>
            <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center w-full sm:w-auto">
              <Button className="relative overflow-hidden w-full sm:w-auto rounded-lg px-8 h-12 text-base sm:px-12 sm:h-16 sm:text-lg font-semibold transition-all duration-300 hover:scale-105 bg-white text-gray-900 hover:bg-gray-50 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] border-0" variant="secondary">
                {finalCta.cta}
                <svg
                  className="w-5 h-5 ml-3 text-gray-900"
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
          </div>
        </section>
    </>
  );
}
