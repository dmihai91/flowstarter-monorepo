'use client';

import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useMockEditor } from './useMockEditor';
import { MockEditorPreview } from './MockEditorPreview';

/**
 * Landing page hero: copy (left) + interactive editor preview (right).
 * Premium design with layered gradients, glass elements, and staggered animations.
 */
export function LandingHero() {
  const { t } = useI18n();
  const editor = useMockEditor();

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-6 lg:pb-10 overflow-hidden">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {/* Base warm tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf8ff] to-white dark:from-[#0a0810] dark:to-[#08080c]" />
        {/* Violet blob — top left */}
        <div className="absolute top-0 left-0 w-[70%] sm:w-[55%] h-[50%] rounded-full bg-[#e0d4ff] dark:bg-[#180c2c] opacity-50 dark:opacity-50 blur-[80px] sm:blur-[120px]" />
        {/* Pink blob — bottom right */}
        <div className="absolute bottom-[5%] right-0 w-[70%] sm:w-[55%] h-[50%] rounded-full bg-[#fdd0e8] dark:bg-[#260c1e] opacity-50 dark:opacity-45 blur-[80px] sm:blur-[120px]" />
      </div>

      {/* Subtle animated flow lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.08]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="heroLine1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--purple)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--purple)" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="heroLine2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="animate-[flowDrift_20s_ease-in-out_infinite_alternate]">
            <path d="M-100,150 Q200,120 500,180 T1000,140 T1400,180" stroke="url(#heroLine1)" strokeWidth="1" />
            <path d="M-100,350 Q300,320 600,380 T1100,340 T1400,370" stroke="url(#heroLine2)" strokeWidth="0.8" />
            <path d="M-100,550 Q250,520 550,580 T1050,540 T1400,570" stroke="url(#heroLine1)" strokeWidth="0.6" />
          </g>
        </svg>
      </div>

      {/* Noise texture overlay for depth */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className={`transition-all duration-1000 ease-out min-w-0 ${editor.isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            
            {/* Badge */}
            <div className="hero-fade hero-fade-1 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.06] backdrop-blur-md border border-gray-200/40 dark:border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.04)] mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-gray-700 dark:text-white/80">
                {t('landing.hero.badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-fade hero-fade-2 text-[2.75rem] sm:text-5xl md:text-[3.5rem] lg:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight mb-7 text-center sm:text-left text-gray-900 dark:text-white">
              {t('landing.hero.headline1')}
              <br />
              <span className="text-flow">{t('landing.hero.headline2')}</span>
            </h1>

            {/* Body */}
            <p className="hero-fade hero-fade-3 text-lg lg:text-xl text-gray-600 dark:text-white/65 leading-relaxed mb-4 text-center sm:text-left max-w-lg">
              {t('landing.hero.pain')}
            </p>
            <p className="hero-fade hero-fade-4 text-base text-gray-500 dark:text-white/50 leading-relaxed mb-10 text-center sm:text-left max-w-lg">
              {t('landing.hero.subheadline')}
            </p>

            {/* CTA row */}
            <div className="hero-fade hero-fade-5 mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex flex-col items-center sm:items-start gap-2.5">
                  <a href={EXTERNAL_URLS.calendly.discovery} target="_blank" rel="noopener noreferrer">
                    <Button className="relative overflow-hidden bg-gradient-to-r from-[var(--purple)] via-blue-500 to-[var(--purple)] bg-[length:200%_100%] animate-[shimmerBtn_3s_ease-in-out_infinite] text-white rounded-xl px-7 sm:px-8 lg:px-10 h-12 sm:h-13 lg:h-14 text-sm sm:text-base font-semibold shadow-[0_8px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group">
                      {t('landing.hero.cta')}
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </a>
                  <span className="text-sm text-gray-400 dark:text-white/40">
                    {t('landing.hero.ctaNote')}
                  </span>
                </div>

                {/* Pricing card */}
                <div className="flex flex-col items-center px-6 py-5 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-lg border border-gray-200/30 dark:border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-full sm:w-[260px] lg:w-[230px] transition-all duration-300 hover:translate-y-[-2px]">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em] mb-3 opacity-80">🔥 Launch price</span>
                  <div className="flex flex-col gap-0.5 w-full items-center">
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className="text-xs line-through text-gray-400/60 dark:text-white/20 font-medium">€599</span>
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceBuild')}</span>
                      <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium uppercase tracking-wide">setup</span>
                    </div>
                    <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent my-3" />
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className="text-xs line-through text-gray-400/60 dark:text-white/20 font-medium">€59</span>
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('landing.hero.priceMonthly')}</span>
                      <span className="text-[10px] text-gray-400 dark:text-white/35 font-medium">/ mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-center lg:justify-start py-5 border-t border-gray-200/50 dark:border-white/[0.06]">
              {[
                { value: t('landing.stats.weeks'), label: t('landing.stats.weeksLabel') },
                { value: t('landing.stats.calls'), label: t('landing.stats.callsLabel') },
                { value: t('landing.stats.techSkills'), label: t('landing.stats.techSkillsLabel') },
              ].map((stat, i) => (
                <div key={i} className="flex items-center">
                  <div className="text-center px-5 sm:px-8 lg:px-10">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-400 dark:text-white/30 uppercase tracking-wider mt-1">
                      {stat.label}
                    </div>
                  </div>
                  {i < 2 && <div className="w-px h-8 bg-gray-200/60 dark:bg-white/[0.06]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Editor with glow */}
          <div className="relative">
            {/* Animated glow behind editor */}
            <div className="absolute -inset-4 sm:-inset-6 rounded-[2rem] bg-gradient-to-br from-[var(--purple)]/10 via-blue-500/5 to-pink-500/10 dark:from-[var(--purple)]/15 dark:via-blue-500/8 dark:to-pink-500/15 blur-2xl opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
            <MockEditorPreview {...editor} />
          </div>
        </div>
      </div>
    </section>
  );
}
