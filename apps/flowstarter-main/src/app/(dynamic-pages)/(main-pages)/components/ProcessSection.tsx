'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassCard } from '@flowstarter/flow-design-system';
import { LANDING_COPY } from '../landing-copy';

export function ProcessSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const process = LANDING_COPY.process;


  return (
    <>
        {/* Process Section */}
        <section ref={sectionRef} data-section="process"
          id="process"
          className="py-12 lg:py-16 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3 text-gray-900 dark:text-white">
                {process.title}
              </h2>
            </div>

            <div
              id="process-cards"
              data-animate
              className="grid md:grid-cols-3 gap-6 lg:gap-8"
            >
              {process.steps.map((feature, i) => (
                <GlassCard
                  key={feature.title}
                  variant="subtle"
                  className={`group p-8 lg:p-10 ${
                    isVisible
                      ? `animate-fade-in-up animate-fade-in-up-delay-${i + 1}`
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ animationFillMode: 'forwards' }}
                >
                  <div className="text-5xl font-bold text-[var(--purple)]/40 dark:text-[var(--purple)]/30 group-hover:text-[var(--purple)]/70 dark:group-hover:text-[var(--purple)]/50 transition-colors mb-4">
                    {feature.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed max-w-[55ch]">
                    {feature.description}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
