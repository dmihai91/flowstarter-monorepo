'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { GlassCard } from '@flowstarter/flow-design-system';
import { useFAQAccordion } from './hooks/useFAQAccordion';
import { LANDING_COPY } from '../landing-copy';

export function FAQSection() {
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const { openIndex: openFaq, toggle: toggleFaq } = useFAQAccordion(0);
  const faq = LANDING_COPY.faq;

  return (
    <>
        {/* FAQ Section */}
        <section
          ref={sectionRef} id="faq"
          className="pt-12 pb-6 lg:pt-18 lg:pb-18"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div
              id="faq-content"
              data-animate
              className={`grid lg:grid-cols-1 gap-10 transition-all duration-[350ms] ${
                isVisible
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            >
              <div className="col-span-2 text-center mb-6 lg:mb-8">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-gray-900 dark:text-white">
                  {faq.title}
                </h2>
              </div>

              <div className="col-span-2 space-y-3 max-w-3xl mx-auto w-full">
                {faq.items.map((item, i) => (
                  <GlassCard
                    key={i}
                    variant="subtle"
                    noHover
                    className={`overflow-hidden !p-0 ${
                      isVisible
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                    style={{
                      transitionProperty: 'opacity, transform',
                      transitionDuration: '0.5s',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isVisible ? `${i * 80}ms` : '0ms',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(i)}
                      className="group/faq w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <h3 className="text-base font-semibold pr-4">{item.question}</h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 group-hover/faq:text-[var(--purple)] flex-shrink-0 transition-all duration-200 ${
                          openFaq === i ? 'rotate-180 text-[var(--purple)]' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'
                      }`}
                    >
                      <p className="px-6 text-gray-500 dark:text-white/40 leading-relaxed text-sm max-w-[60ch]">
                        {item.answer}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
