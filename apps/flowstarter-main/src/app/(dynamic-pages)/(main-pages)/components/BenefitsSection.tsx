'use client';

import { useTranslations } from '@/lib/i18n';
import {
  CheckCircle2,
  Code2,
  HeadphonesIcon,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AnimatedBenefitsVisual } from './AnimatedBenefitsVisual';

export function BenefitsSection() {
  const { t } = useTranslations();

  const benefits = [
    {
      title: t('landing.benefits.savesTime.title'),
      description: t('landing.benefits.savesTime.description'),
      icon: <Zap className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
    {
      title: t('landing.benefits.aiPowered.title'),
      description: t('landing.benefits.aiPowered.description'),
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
    {
      title: t('landing.benefits.noCode.title'),
      description: t('landing.benefits.noCode.description'),
      icon: <Code2 className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
    {
      title: t('landing.benefits.scalable.title'),
      description: t('landing.benefits.scalable.description'),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
    {
      title: t('landing.benefits.support.title'),
      description: t('landing.benefits.support.description'),
      icon: <HeadphonesIcon className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
    {
      title: t('landing.benefits.updates.title'),
      description: t('landing.benefits.updates.description'),
      icon: <RefreshCw className="h-5 w-5" />,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800/40',
    },
  ];

  return (
    <section
      id="benefits"
      className="full-width-section py-12 md:py-16 lg:py-20 relative"
    >
      {/* Distinct glassmorphism background for Benefits section */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay for distinction */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-emerald-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-green-400/10 to-emerald-400/10 dark:from-green-600/5 dark:to-emerald-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/5 dark:to-teal-600/5 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="space-y-4 max-w-[850px] mx-auto text-center">
            <div className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium backdrop-blur-xl border border-white dark:border-white/40 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <CheckCircle2
                className="mr-1 h-3.5 w-3.5"
                style={{ color: 'var(--purple)' }}
              />
              <span>Benefits</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {t('landing.benefits.sectionTitle')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg lg:text-xl">
              {t('landing.benefits.sectionSubtitle')}
            </p>
          </div>

          {/* Benefits Visual */}
          <div className="w-full max-w-3xl mt-6 sm:mt-8">
            <div className="relative w-full overflow-hidden rounded-lg border border-white dark:border-white/40 backdrop-blur-xl shadow-2xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <AnimatedBenefitsVisual />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-7xl pt-6 sm:pt-8">
            {benefits.map((benefit, idx) => (
              <div
                key={benefit.title}
                className="group relative flex flex-col space-y-2 sm:space-y-3 rounded-lg p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-md hover:shadow-lg"
                style={{
                  transitionDelay: `${idx * 50}ms`,
                }}
              >
                <div className="relative z-10">
                  <div
                    className={`rounded-lg p-2.5 w-10 h-10 flex items-center justify-center ${benefit.bgColor}`}
                  >
                    <div className={benefit.color}>{benefit.icon}</div>
                  </div>
                </div>
                <div className="relative z-10 space-y-1.5">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
