'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';
import { GlassCard } from '@flowstarter/flow-design-system';

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
          className="py-12 lg:py-16 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                How it{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  works
                </span>
              </h2>
            </div>

            <div
              id="process-cards"
              data-animate
              className="grid md:grid-cols-3 gap-6 lg:gap-8"
            >
              {features.map((feature, i) => (
                <GlassCard
                  key={i}
                  variant="subtle"
                  className={`group p-8 lg:p-10 ${
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
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed max-w-[55ch]">
                    {feature.desc}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
