'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function ManifestoSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  return (
    <section ref={sectionRef} data-section="manifesto" className="pt-4 lg:pt-8 pb-12 lg:pb-18 relative">
      <div className={`max-w-3xl mx-auto px-6 sm:px-8 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Label + heading */}
        <div className="text-center mb-14 lg:mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--purple)] mb-6">
            {t('landing.manifesto.title')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white italic leading-tight">
            {t('landing.manifesto.headline')}
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-8 text-base md:text-lg text-gray-500 dark:text-white/50 leading-relaxed max-w-[60ch] mx-auto">
          {t('landing.manifesto.p1') && <p>{t('landing.manifesto.p1')}</p>}
          {t('landing.manifesto.p2') && <p>{t('landing.manifesto.p2')}</p>}
          {t('landing.manifesto.p3') && <p className="text-gray-600 dark:text-white/60">{t('landing.manifesto.p3')}</p>}
          {t('landing.manifesto.p4') && <p>{t('landing.manifesto.p4')}</p>}
        </div>

        {/* Pull quote — visually distinct */}
        <div className="mt-12 lg:mt-16 py-8 px-8 sm:px-10 border-l-4 border-[var(--purple)] bg-[var(--purple)]/[0.03] dark:bg-[var(--purple)]/[0.05] rounded-r-2xl max-w-[60ch] mx-auto">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
            {t('landing.manifesto.closing')}
          </p>
        </div>
      </div>
    </section>
  );
}
