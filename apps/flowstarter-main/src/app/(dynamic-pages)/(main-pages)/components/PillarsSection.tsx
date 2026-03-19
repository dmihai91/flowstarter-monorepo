'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function PillarsSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const pillars = LANDING_COPY.pillars;


  return (
    <>
        {/* Three Pillars Section */}
        <section ref={sectionRef} data-section="pillars" className="py-12 lg:py-16 relative">
          <div className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {pillars.title}
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
                {pillars.subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {pillars.items.map(({ title, subtitle, body, icon }, index) => (
                <div
                  key={title}
                  className={`rounded-2xl p-8 lg:p-10 border border-[var(--landing-card-border)] backdrop-blur-sm transition-all duration-[600ms] ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  } ${
                    index === 0
                      ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5'
                      : index === 1
                        ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5'
                        : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5'
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-[var(--purple-primary)] shadow-sm dark:bg-white/[0.04]">
                    <LandingIcon name={icon as IconName} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-sm font-medium text-[var(--purple)] mb-3">
                    {subtitle}
                  </p>
                  <p className="text-gray-600 dark:text-white/60 leading-relaxed max-w-[55ch]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
