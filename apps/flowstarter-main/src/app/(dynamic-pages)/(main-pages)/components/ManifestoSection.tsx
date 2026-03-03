'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function ManifestoSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();


  return (
    <>
        {/* Manifesto Section */}
        <section ref={sectionRef} data-section="manifesto" className="py-20 lg:py-32 relative">
          <div className={`max-w-3xl mx-auto px-6 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--purple)] mb-6">
                {t('landing.manifesto.title')}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white italic leading-tight">
                {t('landing.manifesto.headline')}
              </h2>
            </div>
            <div className="space-y-6 text-base md:text-lg text-gray-500 dark:text-white/50 leading-relaxed">
              <p>{t('landing.manifesto.p1')}</p>
              <p>{t('landing.manifesto.p2')}</p>
              <p className="text-gray-700 dark:text-white/70">{t('landing.manifesto.p3')}</p>
              <p>{t('landing.manifesto.p4')}</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white pt-4 leading-snug">
                {t('landing.manifesto.closing')}
              </p>
            </div>
          </div>
        </section>
    </>
  );
}
