'use client';

import { PricingCard } from '@/components/PricingCard';
import { useTranslations } from '@/lib/i18n';
import {
  BookOpen,
  Bot,
  Briefcase,
  Infinity as InfinityIcon,
  LayoutGrid,
  Mail,
  Palette,
  Rocket,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

export function PricingSection() {
  const { t } = useTranslations();

  return (
    <section
      id="pricing"
      className="full-width-section py-16 md:py-24 lg:py-32 relative"
    >
      {/* Distinct glassmorphism background for Pricing section */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay for distinction */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-yellow-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/10 to-yellow-400/10 dark:from-amber-600/5 dark:to-yellow-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-yellow-400/10 to-orange-400/10 dark:from-yellow-600/5 dark:to-orange-600/5 blur-3xl animate-pulse"
          style={{ animationDelay: '3s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4 max-w-[850px] mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl tablet:text-4xl md:text-5xl">
              {t('landing.pricing.sectionTitle')}
            </h2>
            <p className="text-muted-foreground tablet:text-lg md:text-xl">
              {t('landing.pricing.sectionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full max-w-7xl pt-6 px-2 sm:px-0">
            {/* Free Plan */}
            <PricingCard
              title={t('landing.pricing.free.title')}
              price={t('landing.pricing.free.price')}
              period={t('landing.pricing.free.period')}
              description={t('landing.pricing.free.description')}
              features={[
                { icon: Sparkles, text: t('landing.pricing.free.feature1') },
                { icon: LayoutGrid, text: t('landing.pricing.free.feature2') },
                { icon: Palette, text: t('landing.pricing.free.feature3') },
                { icon: Wrench, text: t('landing.pricing.free.feature4') },
                { icon: Users, text: t('landing.pricing.free.feature5') },
              ]}
              ctaText={t('landing.pricing.free.cta') || 'Get Started'}
              ctaHref="/sign-up"
            />

            {/* Pro Plan */}
            <PricingCard
              title={t('landing.pricing.pro.title')}
              price={t('landing.pricing.pro.price')}
              period={t('landing.pricing.pro.period')}
              description={t('landing.pricing.pro.description')}
              features={[
                { icon: Sparkles, text: t('landing.pricing.pro.feature1') },
                { icon: LayoutGrid, text: t('landing.pricing.pro.feature2') },
                { icon: Palette, text: t('landing.pricing.pro.feature3') },
                { icon: BookOpen, text: t('landing.pricing.pro.feature4') },
                { icon: Zap, text: t('landing.pricing.pro.feature5') },
                { icon: Mail, text: t('landing.pricing.pro.feature6') },
              ]}
              ctaText={t('landing.pricing.pro.cta') || 'Get Started'}
              ctaHref="/sign-up"
              badge={t('landing.pricing.pro.badge')}
              borderColor="var(--purple)"
              ctaClassName="inline-flex h-11 w-full items-center justify-center rounded-[12px] px-4 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-[0.98] shadow-lg hover:shadow-xl"
              ctaStyle={{
                backgroundColor: 'var(--purple)',
                color: 'white',
              }}
            />

            {/* Premium Plan */}
            <PricingCard
              title={t('landing.pricing.premium.title')}
              price={t('landing.pricing.premium.price')}
              period={t('landing.pricing.premium.period')}
              description={t('landing.pricing.premium.description')}
              features={[
                { icon: Sparkles, text: t('landing.pricing.premium.feature1') },
                {
                  icon: InfinityIcon,
                  text: t('landing.pricing.premium.feature2'),
                },
                { icon: Sparkles, text: t('landing.pricing.premium.feature3') },
                { icon: Bot, text: t('landing.pricing.premium.feature4') },
                { icon: Wrench, text: t('landing.pricing.premium.feature5') },
                { icon: Trophy, text: t('landing.pricing.premium.feature6') },
              ]}
              ctaText={t('landing.pricing.premium.cta') || 'Get Started'}
              ctaHref="/sign-up"
            />

            {/* Custom Plan */}
            <PricingCard
              title={t('landing.pricing.custom.title')}
              price={t('landing.pricing.custom.price')}
              period={` ${t('landing.pricing.custom.period')}`}
              description={t('landing.pricing.custom.description')}
              features={[
                { icon: Briefcase, text: t('landing.pricing.custom.feature1') },
                { icon: Sparkles, text: t('landing.pricing.custom.feature2') },
                { icon: Rocket, text: t('landing.pricing.custom.feature3') },
                { icon: Sparkles, text: t('landing.pricing.custom.feature4') },
                { icon: Wrench, text: t('landing.pricing.custom.feature5') },
                { icon: UserCog, text: t('landing.pricing.custom.feature6') },
              ]}
              ctaText={t('landing.pricing.custom.cta')}
              className="mt-6"
              ctaHref="https://calendly.com/flowstarter-app/custom-plan"
              ctaClassName="inline-flex h-11 w-full items-center justify-center rounded-[12px] px-4 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 bg-[rgba(243,243,243,0.4)] dark:bg-[rgba(58,58,74,0.4)] text-gray-900 dark:text-white hover:bg-[rgba(243,243,243,0.6)] dark:hover:bg-[rgba(58,58,74,0.6)] shadow-md hover:shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
