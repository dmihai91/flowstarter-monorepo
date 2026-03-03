'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';

export function ProcessSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  const features = [
    { num: t('landing.steps.step1.num'), title: t('landing.steps.step1.title'), desc: t('landing.steps.step1.desc') },
    { num: t('landing.steps.step2.num'), title: t('landing.steps.step2.title'), desc: t('landing.steps.step2.desc') },
    { num: t('landing.steps.step3.num'), title: t('landing.steps.step3.title'), desc: t('landing.steps.step3.desc') },
  ];


  return (
    <>
        {/* Process Section */}
        <section ref={sectionRef} data-section="process"
          id="process"
          className="py-12 lg:py-16 relative overflow-hidden "
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="max-w-xl mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                How it{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  works
                </span>
              </h2>
            </div>

            <div
              id="process-cards"
              data-animate
              className="grid md:grid-cols-3 gap-5"
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`group p-7 rounded-2xl bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200/80 dark:border-white/5 hover:border-[var(--purple)]/40 dark:hover:border-[var(--purple)]/30 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-xl hover:shadow-[var(--purple)]/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-250 ease-out ${
                    isVisible
                      ? `animate-fade-in-up animate-fade-in-up-delay-${i + 1}`
                      : 'opacity-0 translate-y-10 scale-[0.92] blur-[8px]'
                  }`}
                  style={{ animationFillMode: 'forwards' }}
                >
                  <div className="text-5xl font-bold text-[var(--purple)]/40 dark:text-[var(--purple)]/30 group-hover:text-[var(--purple)]/70 dark:group-hover:text-[var(--purple)]/50 transition-colors mb-4">
                    {feature.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
