'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EXTERNAL_URLS } from '@/lib/constants';
import {
  Calendar,
  Check,
  Clock,
  Crown,
  Lock,
  Rocket,
  Sparkles,
  Star,
} from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import { useTranslations } from '@/lib/i18n';


export default function PricingPage() {
  const { t } = useTranslations();

  const quickFeatures = [
    t('pricing.starter.feature1'), t('pricing.starter.feature2'), t('pricing.starter.feature3'),
    t('pricing.starter.feature4'), t('pricing.starter.feature5'), t('pricing.starter.feature6'),
    t('pricing.starter.feature7'),
  ];

  const setupFeatures = [
    t('pricing.setup.feature1'), t('pricing.setup.feature2'), t('pricing.setup.feature3'),
    t('pricing.setup.feature4'), t('pricing.setup.feature5'), t('pricing.setup.feature6'),
    t('pricing.setup.feature7'), t('pricing.setup.feature8'), t('pricing.setup.feature9'),
    t('pricing.setup.feature10'), t('pricing.setup.feature11'), t('pricing.setup.feature12'),
    t('pricing.setup.feature13'), t('pricing.setup.feature14'), t('pricing.setup.feature15'),
    t('pricing.setup.feature16'), t('pricing.setup.feature17'), t('pricing.setup.feature18'),
    t('pricing.setup.feature19'),
  ];

  const monthlyFeatures = [
    t('pricing.monthly.feature1'), t('pricing.monthly.feature2'), t('pricing.monthly.feature3'),
    t('pricing.monthly.feature4'), t('pricing.monthly.feature5'), t('pricing.monthly.feature6'),
    t('pricing.monthly.feature7'),
  ];

  const proFeatures = [
    t('pricing.pro.feature1'), t('pricing.pro.feature2'),
    t('pricing.pro.feature3'), t('pricing.pro.feature4'),
  ];

  const businessFeatures = [
    t('pricing.business.feature1'), t('pricing.business.feature2'),
    t('pricing.business.feature3'), t('pricing.business.feature4'),
  ];

  return (
    <div className="relative min-h-screen page-gradient">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <SupportHeader />

      {/* Hero Section */}
      <div className="relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-[var(--purple)] to-cyan-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('pricing.badge')}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              {t('pricing.title1')}
              <span className="bg-gradient-to-r from-[var(--purple)] to-cyan-500 bg-clip-text text-transparent">
                {t('pricing.title2')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              {t('pricing.description')}
            </p>

            <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{t('pricing.betaSpots')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Plan Card */}
      <section className="relative z-10 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto">
            <Card className="relative bg-white dark:bg-gray-800 border-2 border-[var(--purple)]/30 shadow-xl shadow-[var(--purple)]/5 overflow-hidden">
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[var(--purple)] to-cyan-500" />

              <CardContent className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-cyan-500/20 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-[var(--purple)]" />
                    </div>
                    <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('pricing.starter.name')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('pricing.starter.subtitle')}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[var(--purple)] text-white border-0">
                    {t('pricing.starter.badge')}
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    {/* Setup */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                        {t('pricing.starter.setupLabel')}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-gray-400 line-through">
                          {t('pricing.starter.setupOriginal')}
                        </span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {t('pricing.starter.setupPrice')}
                        </span>
                      </div>
                    </div>

                    {/* Monthly */}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1">
                        {t('pricing.starter.monthlyLabel')}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-gray-400 line-through">
                          {t('pricing.starter.monthlyOriginal')}
                        </span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {t('pricing.starter.monthlyPrice')}
                        </span>
                        <span className="text-gray-500">{t('pricing.starter.monthlySuffix')}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--purple)] mt-3">
                    {t('pricing.starter.subscriptionNote')}
                  </p>
                </div>

                {/* Quick Features */}
                <div className="space-y-2.5 mb-6">
                  {quickFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={EXTERNAL_URLS.calendly.discovery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3.5 px-6 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--landing-btn-from) 0%, var(--landing-btn-via) 100%)',
                  }}
                >
                  {t('pricing.starter.cta')}
                  <span className="ml-2">{"\u2192"}</span>
                </a>

                <p className="text-center text-xs text-gray-400 dark:text-white/40 mt-4">
                  {t('pricing.starter.disclaimer')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="relative z-10 py-16 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.details.heading')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('pricing.details.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Setup Column */}
            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-[var(--purple)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('pricing.setup.title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('pricing.setup.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <span className="text-lg text-gray-400 line-through">
                    {t('pricing.setup.originalPrice')}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('pricing.setup.price')}
                  </span>
                  <span className="text-sm text-[var(--purple)]">
                    {t('pricing.setup.badge')}
                  </span>
                </div>

                <div className="space-y-3">
                  {setupFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Column */}
            <Card className="bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('pricing.monthly.title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('pricing.monthly.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <span className="text-lg text-gray-400 line-through">
                    {t('pricing.monthly.originalPrice')}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('pricing.monthly.price')}
                  </span>
                  <span className="text-sm text-gray-500">{t('pricing.monthly.suffix')}</span>
                  <span className="text-sm text-[var(--purple)]">
                    {t('pricing.monthly.badge')}
                  </span>
                </div>

                <div className="space-y-3">
                  {monthlyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--green)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[var(--green)]" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 dark:text-white/30 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                  {t('pricing.monthly.note')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon Tiers */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('pricing.comingSoon.heading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('pricing.comingSoon.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro */}
            <Card className="relative bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/30 pointer-events-none" />

              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Star className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      {t('pricing.pro.name')}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {t('pricing.pro.badge')}
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  {t('pricing.pro.price')}
                </p>

                <div className="space-y-2">
                  {proFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  disabled
                  className="w-full mt-5 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  {t('pricing.pro.cta')}
                </Button>
              </CardContent>
            </Card>

            {/* Business */}
            <Card className="relative bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50 dark:to-gray-900/30 pointer-events-none" />

              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      {t('pricing.business.name')}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-400 border-gray-300 dark:border-gray-600 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {t('pricing.business.badge')}
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  {t('pricing.business.price')}
                </p>

                <div className="space-y-2">
                  {businessFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  disabled
                  className="w-full mt-5 bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  {t('pricing.business.cta')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early Access Banner */}
      <section className="relative z-10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--purple)]/10 via-cyan-500/10 to-[var(--purple)]/10 border-[var(--purple)]/20">
            <CardContent className="p-8 sm:p-12 text-center">
              <Badge className="mb-4 bg-[var(--purple)]/10 text-[var(--purple)] border-[var(--purple)]/20">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('pricing.earlyAccess.badge')}
              </Badge>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('pricing.earlyAccess.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
                {t('pricing.earlyAccess.description')}
              </p>

              <a
                href={EXTERNAL_URLS.calendly.discovery}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }}
              >
                <Calendar className="w-5 h-5" />
                {t('pricing.earlyAccess.cta')}
              </a>

              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  {t('pricing.earlyAccess.noCreditCard')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  {t('pricing.earlyAccess.consultation')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[var(--green)]" />
                  {t('pricing.earlyAccess.cancelAnytime')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
