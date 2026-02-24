'use client';

import { GetStarted } from '@/components/GetStarted';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/lib/i18n';
import {
  CheckCircle2,
  Eye,
  FileText,
  Palette,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { AnimatedHowItWorksVisual } from './AnimatedHowItWorksVisual';

export function HowItWorksSection() {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const steps = [
    {
      icon: UserPlus,
      colorLight: '#8b5cf6', // Sign up - purple (pre-wizard)
      colorDark: '#a78bfa',
      text: t('landing.howItWorks.step1'),
    },
    {
      icon: FileText,
      colorLight: '#4d5dd9', // Project Details - wizard details step (blue)
      colorDark: '#c1c8ff',
      text: t('landing.howItWorks.step2'),
    },
    {
      icon: Sparkles,
      colorLight: '#d478d8', // Choose Template - wizard template step (purple/pink)
      colorDark: '#d478d8',
      text: t('landing.howItWorks.step3'),
    },
    {
      icon: Palette,
      colorLight: '#d4c96e', // Design & Branding - wizard design step (yellow)
      colorDark: '#FFFAB8',
      text: t('landing.howItWorks.step4'),
    },
    {
      icon: Eye,
      colorLight: '#6bc96a', // Review & Launch - wizard review step (green)
      colorDark: '#C8FFC7',
      text: t('landing.howItWorks.step5'),
    },
    {
      icon: TrendingUp,
      colorLight: '#0ea5e9', // Track - cyan/sky (post-wizard)
      colorDark: '#7dd3fc',
      text: t('landing.howItWorks.step6'),
    },
  ];

  return (
    <section className="full-width-section py-12 md:py-16 lg:py-20 relative">
      {/* Distinct glassmorphism background for How It Works section */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay for distinction */}
      <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 via-cyan-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-linear-to-br from-blue-400/10 to-cyan-400/10 dark:from-blue-600/5 dark:to-cyan-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-linear-to-br from-cyan-400/10 to-sky-400/10 dark:from-cyan-600/5 dark:to-sky-600/5 blur-3xl animate-pulse"
          style={{ animationDelay: '2s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20 lg:gap-24 items-center">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium backdrop-blur-xl border border-white dark:border-white/40 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <Star
                className="mr-1 h-3.5 w-3.5"
                style={{ color: 'var(--purple)' }}
              />
              <span>{t('landing.howItWorks.badge')}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground md:text-lg lg:text-xl">
              {t('landing.howItWorks.subtitle')}
            </p>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const stepColor = isDark ? step.colorDark : step.colorLight;
                return (
                  <div
                    key={idx}
                    className="group flex items-center space-x-3 sm:space-x-4 justify-center md:justify-start rounded-lg p-3 sm:p-4 backdrop-blur-xl border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-md"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = stepColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: stepColor + '20', // 20 = 12.5% opacity
                      }}
                    >
                      <step.icon
                        className="w-4 h-4"
                        style={{ color: stepColor }}
                      />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground text-left flex-1">
                      {step.text}
                    </p>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: stepColor }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center md:justify-start pt-6">
              <GetStarted />
            </div>
          </div>
          <div className="relative order-first md:order-last">
            <div
              className="absolute -inset-4 -z-10 opacity-50 blur-2xl"
              style={{
                background:
                  'linear-gradient(to bottom, var(--surface-2), transparent)',
              }}
            />
            <div className="relative w-full aspect-auto lg:aspect-4/3 overflow-hidden rounded-[16px] border border-white dark:border-white/40 backdrop-blur-xl shadow-2xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <AnimatedHowItWorksVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
