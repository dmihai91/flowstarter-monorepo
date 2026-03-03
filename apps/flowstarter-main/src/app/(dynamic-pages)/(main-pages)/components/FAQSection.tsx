'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useState } from 'react';

export function FAQSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
        {/* FAQ Section */}
        <section
          ref={sectionRef} id="faq"
          className="py-10 lg:py-14 "
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div
              id="faq-content"
              data-animate
              className={`grid lg:grid-cols-1 gap-10 transition-all duration-[350ms] ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="col-span-2 text-center mb-6">
                <h2 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                  Questions?
                  <br />
                  <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                    Answered.
                  </span>
                </h2>
              </div>

              <div className="col-span-2 space-y-2 max-w-3xl mx-auto w-full">
                {[
                  { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
                  { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
                  { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
                  { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
                  { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
                  { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
                  { q: t('landing.faq.q7'), a: t('landing.faq.a7') },
                  { q: t('landing.faq.q8'), a: t('landing.faq.a8') },
                  { q: t('landing.faq.q9'), a: t('landing.faq.a9') },
                  { q: t('landing.faq.q10'), a: t('landing.faq.a10') },
                ].map((faq, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl bg-white/55 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:bg-[#F9F9FB] dark:hover:bg-white/[0.03] ${
                      isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    }`}
                    style={{
                      transitionProperty: 'opacity, transform',
                      transitionDuration: '0.5s',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isVisible ? `${i * 80}ms` : '0ms',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="group/faq w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <h3 className="text-base font-semibold pr-4">{faq.q}</h3>
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
                      <p className="px-6 text-gray-500 dark:text-white/40 leading-relaxed text-sm">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
