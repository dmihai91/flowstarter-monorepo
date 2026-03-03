'use client';

import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useMockEditor } from './useMockEditor';
import { MockEditorPreview } from './MockEditorPreview';

/**
 * Landing page hero: copy (left) + interactive editor preview (right).
 */
export function LandingHero() {
  const { t } = useI18n();
  const editor = useMockEditor();

  return (
    <>
        <section className="relative pt-24 lg:pt-28 pb-2 lg:pb-4 overflow-hidden bg-[radial-gradient(circle_at_20%_30%,#ede6ff_0%,transparent_55%),radial-gradient(circle_at_80%_70%,#fde9f0_0%,transparent_55%),linear-gradient(to_bottom,#fbf9ff,#fdfcff)] dark:bg-[radial-gradient(circle_at_20%_30%,#1a0d2e_0%,transparent_55%),radial-gradient(circle_at_80%_70%,#200a1a_0%,transparent_55%),linear-gradient(to_bottom,#0a0810,#0a0a0c)]">
          {/* Flow lines INSIDE hero so they appear on top of background */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.10] dark:opacity-[0.12]"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="heroFlowGradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--purple)" />
                  <stop offset="100%" stopColor="var(--landing-flow-end)" />
                </linearGradient>
              </defs>
              <g stroke="url(#heroFlowGradient1)" strokeWidth="0.6">
                <path d="M-100,120 Q200,100 400,140 T800,110 T1300,150" />
                <path d="M-100,280 Q250,260 450,300 T850,270 T1300,310" />
                <path d="M-100,440 Q220,420 420,460 T820,430 T1300,470" />
                <path d="M-100,600 Q180,620 380,580 T780,620 T1300,600" />
              </g>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 overflow-hidden w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-w-0">
              {/* Left: Copy */}
              <div
                className={`transition-all duration-1000 ease-out min-w-0 ${
                  editor.isLoaded
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm border border-gray-900/10 dark:border-white/10 mb-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-white/90">
                    {t('landing.hero.badge')}
                  </span>
                </div>

                <h1 className="hero-fade hero-fade-2 text-[2.5rem] sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-6 break-words text-center sm:text-left">
                  {t('landing.hero.headline1')}
                  <br />
                  <span className="text-flow">
                    {t('landing.hero.headline2')}
                  </span>
                </h1>

                <p className="hero-fade hero-fade-3 text-base lg:text-xl text-gray-700 dark:text-white/70 leading-relaxed mb-5 text-center sm:text-left">
                  {t('landing.hero.pain')}
                </p>
                <p className="hero-fade hero-fade-4 text-base text-gray-600 dark:text-white/60 leading-relaxed mb-8 text-center sm:text-left">
                  {t('landing.hero.subheadline')}
                </p>

                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-y-6 gap-x-4">
                    {/* Left: button + note stacked tightly */}
                    <div className="flex flex-col items-center sm:items-start gap-1.5 pt-2 sm:pt-0 sm:-mt-3">
                      <a
                        href={EXTERNAL_URLS.calendly.discovery}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="relative bg-gradient-to-r from-[var(--landing-btn-from)] via-[var(--landing-btn-via)] to-[var(--landing-btn-from)] text-white hover:from-[var(--landing-btn-hover-from)] hover:via-[var(--landing-btn-hover-via)] hover:to-[var(--landing-btn-hover-from)] rounded-lg px-5 sm:px-6 lg:px-8 h-11 sm:h-12 lg:h-14 text-sm sm:text-sm lg:text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 hover:scale-[1.02] group">
                          <span className="absolute inset-0 animate-shimmer" />
                          {t('landing.hero.cta')}
                          <svg
                            className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </Button>
                      </a>
                      <span className="text-sm font-medium text-gray-500 dark:text-white/50 text-center sm:text-left mt-2">
                        {t('landing.hero.ctaNote')}
                      </span>
                    </div>
                    {/* Right: pricing card */}
                    <div className="flex flex-col items-center px-6 py-5 rounded-2xl bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-amber-500/[0.08] dark:to-amber-600/[0.03] backdrop-blur-sm border border-amber-300/20 dark:border-amber-500/10 shadow-sm hover:shadow-md w-full sm:w-[280px] lg:w-[230px] sm:ml-auto transition-all duration-300">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] mb-3 opacity-80">🔥 Launch price</span>
                      <div className="flex flex-col gap-0.5 w-full items-center">
                        <div className="flex items-baseline gap-2 justify-center">
                          <span className="text-xs line-through text-gray-400/70 dark:text-white/25 font-medium">€599</span>
                          <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceBuild')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium uppercase tracking-wide">setup</span>
                        </div>
                        <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent my-3" />
                        <div className="flex items-baseline gap-2 justify-center">
                          <span className="text-xs line-through text-gray-400/70 dark:text-white/25 font-medium">€59</span>
                          <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceMonthly')}</span>
                          <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium">/ mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center lg:justify-start pt-6 border-t border-gray-200 dark:border-white/10">
                  {[
                    { value: t('landing.stats.weeks'), label: t('landing.stats.weeksLabel') },
                    { value: t('landing.stats.calls'), label: t('landing.stats.callsLabel') },
                    { value: t('landing.stats.techSkills'), label: t('landing.stats.techSkillsLabel') },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center">
                      <div className="text-center px-6 sm:px-10 lg:px-12">
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider mt-1">
                          {stat.label}
                        </div>
                      </div>
                      {i < 2 && (
                        <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <MockEditorPreview {...editor} />
            </div>
          </div>
        </section>
    </>
  );
}
