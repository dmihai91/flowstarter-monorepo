'use client';

import { useI18n } from '@/lib/i18n';
import { GlassCard } from '@flowstarter/flow-design-system';

export function TrustSection() {
  const { t } = useI18n();


  return (
    <>
        {/* Trust Section - Tech Badges + Guarantee */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Tech Trust Badges */}
              <GlassCard variant="subtle" noHover className="p-6 lg:p-8">
                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/30 font-medium mb-4 text-center">
                  Built on technology trusted by millions
                </p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {/* Cloudflare */}
                  <div className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 64 64"
                      fill="currentColor"
                    >
                      <path
                        d="M42.93 35.64l.82-2.67a1.5 1.5 0 00-.06-1.1 1.44 1.44 0 00-.87-.74l-20.42-1.1a.49.49 0 01-.4-.23.47.47 0 010-.46.52.52 0 01.45-.32l20.75-1.1a5.52 5.52 0 004.65-3.74l1.52-4.86a.9.9 0 00.04-.36 15.33 15.33 0 00-29.62 3.88c0 .36 0 .72.02 1.08a9.57 9.57 0 00-8.17 10.77 9.68 9.68 0 009.46 8.3h21.55a.52.52 0 00.45-.32z"
                        className="text-gray-400 dark:text-white/40"
                      />
                    </svg>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">
                      Cloudflare
                    </span>
                  </div>
                  {/* Next.js */}
                  <div className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
                    <svg className="w-8 h-8" viewBox="0 0 180 180" fill="none">
                      <circle
                        cx="90"
                        cy="90"
                        r="90"
                        fill="currentColor"
                        className="text-gray-400 dark:text-white/40"
                      />
                      <path
                        d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461A90.304 90.304 0 00149.508 157.52z"
                        fill="#fff"
                        className="dark:fill-gray-900"
                      />
                      <path
                        d="M115 54h12v72h-12z"
                        fill="#fff"
                        className="dark:fill-gray-900"
                      />
                    </svg>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">
                      Next.js
                    </span>
                  </div>
                  {/* Google Analytics */}
                  <div className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-white/40"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22.84 2.998v17.997c-.005 1.103-.9 1.998-2.003 2.003H3.164A2.006 2.006 0 011.16 20.995V2.998A2.006 2.006 0 013.164.995h17.673c1.103.005 1.998.9 2.003 2.003zM19.5 18.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zm-5.25-4.5a1.5 1.5 0 10-3 0v4.5a1.5 1.5 0 003 0V14zm-5.25-6a1.5 1.5 0 10-3 0v10.5a1.5 1.5 0 003 0V8z" />
                    </svg>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">
                      Analytics
                    </span>
                  </div>
                  {/* Zoho */}
                  <div className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-white/40"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">
                      Zoho Mail
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* First Month Free */}
              <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] dark:from-emerald-500/5 dark:to-emerald-500/[0.02] backdrop-blur-sm border border-emerald-500/15 dark:border-emerald-500/10 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      First Month Free
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/50">
                      Your subscription starts 30 days after launch. Plenty of
                      time to settle in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
