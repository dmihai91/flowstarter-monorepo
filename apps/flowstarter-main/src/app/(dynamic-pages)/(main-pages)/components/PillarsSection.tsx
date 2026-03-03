'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function PillarsSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();


  return (
    <>
        {/* Three Pillars Section */}
        <section ref={sectionRef} data-section="pillars" className="py-14 lg:py-20 relative">
          <div className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0'
          }`}>
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('landing.pillars.title')}
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
                {t('landing.pillars.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'landing.pillars.differentiate.title' as const, subtitle: 'landing.pillars.differentiate.subtitle' as const, body: 'landing.pillars.differentiate.body' as const, icon: '✦', gradient: 'from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5' },
                { title: 'landing.pillars.attract.title' as const, subtitle: 'landing.pillars.attract.subtitle' as const, body: 'landing.pillars.attract.body' as const, icon: '◎', gradient: 'from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5' },
                { title: 'landing.pillars.convert.title' as const, subtitle: 'landing.pillars.convert.subtitle' as const, body: 'landing.pillars.convert.body' as const, icon: '→', gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5' },
              ].map(({ title, subtitle, body, icon, gradient }) => (
                <div
                  key={title}
                  className={`rounded-2xl p-8 lg:p-10 bg-gradient-to-br ${gradient} border border-[var(--landing-card-border)] backdrop-blur-sm`}
                >
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {t(title)}
                  </h3>
                  <p className="text-sm font-medium text-[var(--purple)] mb-3">
                    {t(subtitle)}
                  </p>
                  <p className="text-gray-600 dark:text-white/60 leading-relaxed max-w-[55ch]">
                    {t(body)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
