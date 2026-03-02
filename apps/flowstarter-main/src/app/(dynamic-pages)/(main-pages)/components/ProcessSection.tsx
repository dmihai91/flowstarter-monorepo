'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { EXTERNAL_URLS } from '@/lib/constants';

export function ProcessSection() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();


  return (
    <>
        {/* Process Section */}
        <section ref={sectionRef} data-section="process"
          id="process"
          className="py-12 lg:py-16 relative overflow-hidden bg-gradient-to-b from-white via-[#F8F9FB] to-[#F1F3F7] dark:from-transparent dark:via-white/[0.01] dark:to-white/[0.02]"
        >
          {/* Flow Field Background - Process Section (different direction) */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.12]"
              viewBox="0 0 1200 600"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="flowGradientV1"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient
                  id="flowGradientV2"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              {/* Vertical-ish flow lines */}
              <g
                className="flow-line-2"
                stroke="url(#flowGradientV1)"
                strokeWidth="1.5"
              >
                <path d="M100,-50 Q80,150 120,300 T100,500 T140,700" />
                <path d="M250,-50 Q270,100 230,250 T270,450 T230,700" />
                <path d="M400,-50 Q380,180 420,330 T380,530 T420,700" />
                <path d="M550,-50 Q570,120 530,270 T570,470 T530,700" />
                <path d="M700,-50 Q680,160 720,310 T680,510 T720,700" />
                <path d="M850,-50 Q870,140 830,290 T870,490 T830,700" />
                <path d="M1000,-50 Q980,180 1020,330 T980,530 T1020,700" />
                <path d="M1150,-50 Q1170,120 1130,270 T1170,470 T1130,700" />
              </g>
              {/* Cross-flow curves */}
              <g
                className="flow-line-3"
                stroke="url(#flowGradientV2)"
                strokeWidth="1"
              >
                <path d="M-50,150 Q400,130 600,170 T1000,140 T1300,180" />
                <path d="M-50,300 Q350,320 550,280 T950,320 T1300,300" />
                <path d="M-50,450 Q400,430 600,470 T1000,440 T1300,480" />
              </g>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="max-w-xl mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                How it{' '}
                <span className="bg-gradient-to-r from-[var(--purple)] to-blue-500 bg-clip-text text-transparent">
                  works
                </span>
              </h2>
            </div>

            <div
              id="process-cards"
              data-animate
              className="grid md:grid-cols-3 gap-5"
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`group p-7 rounded-2xl bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm border border-gray-200/80 dark:border-white/5 hover:border-[var(--purple)]/40 dark:hover:border-[var(--purple)]/30 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-xl hover:shadow-[var(--purple)]/10 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-250 ease-out ${
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
                  <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
