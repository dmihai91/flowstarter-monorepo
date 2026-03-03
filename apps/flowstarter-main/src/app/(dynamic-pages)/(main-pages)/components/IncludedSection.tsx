'use client';

import { useI18n } from '@/lib/i18n';
import { GlassCard } from '@flowstarter/flow-design-system';

export function IncludedSection() {
  const { t } = useI18n();


  return (
    <>
        {/* What's Included Section */}
        <section data-section="included" className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {t('landing.included.title')}
              </h2>
              <p className="text-gray-500 dark:text-white/40 mt-2 max-w-xl mx-auto">
                {t('landing.included.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Setup */}
              <GlassCard variant="subtle" className="group p-7 lg:p-9">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--purple)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t('landing.included.setup.title')}{' '}
                      <span className="text-sm font-normal text-gray-400 dark:text-white/30">
                        {t('landing.included.setup.label')}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-white/30">
                      {t('landing.included.setup.desc')}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {([
                    t('landing.included.setup.item1'),
                    t('landing.included.setup.item2'),
                    t('landing.included.setup.item3'),
                    t('landing.included.setup.item4'),
                    t('landing.included.setup.item5'),
                    t('landing.included.setup.item6'),
                    t('landing.included.setup.item7'),
                    t('landing.included.setup.item8'),
                  ] as string[]).filter(Boolean).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/50"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>

              {/* Monthly subscription */}
              <GlassCard variant="subtle" className="group p-7 lg:p-9">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-cyan-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t('landing.included.monthly.title')}{' '}
                      <span className="text-sm font-normal text-gray-400 dark:text-white/30">
                        {t('landing.included.monthly.label')}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-white/30">
                      {t('landing.included.monthly.desc')}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {([
                    t('landing.included.monthly.item1'),
                    t('landing.included.monthly.item2'),
                    t('landing.included.monthly.item3'),
                    t('landing.included.monthly.item4'),
                    t('landing.included.monthly.item5'),
                    t('landing.included.monthly.item6'),
                    t('landing.included.monthly.item7'),
                  ] as string[]).filter(Boolean).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-white/50"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-4 pt-3 border-t border-gray-200 dark:border-white/5">
                  First month free. Billing starts 30 days after launch
                </p>
              </GlassCard>
            </div>
          </div>
        </section>
    </>
  );
}
