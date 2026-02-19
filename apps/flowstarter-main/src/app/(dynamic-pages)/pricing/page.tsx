'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WaitlistDialog } from '@/components/WaitlistDialog';
import { useTranslations } from '@/lib/i18n';
import {
  Bell,
  Check,
  Crown,
  Gift,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type PlanKey = 'free' | 'starter' | 'pro' | 'business';

interface Plan {
  key: PlanKey;
  price: string;
  period: string;
  yearlyPrice: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  popular: boolean;
  credits: number;
  creditsLabelKey: 'pricing.credits.lifetime' | 'pricing.credits.perMonth';
  sites: number | 'unlimited';
  creditDiscount?: number;
  featureKeys: string[];
  ctaStyle: 'outline' | 'default' | 'primary';
}

export default function PricingPage() {
  const { t } = useTranslations();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [selectedTier, setSelectedTier] = useState<PlanKey>('pro');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPlan, setWaitlistPlan] = useState<PlanKey | undefined>();

  const openWaitlist = (plan?: PlanKey) => {
    setWaitlistPlan(plan);
    setWaitlistOpen(true);
  };

  const plans: Plan[] = [
    {
      key: 'free',
      price: '$0',
      period: '',
      yearlyPrice: '$0',
      icon: <Gift className="h-6 w-6" />,
      color: 'from-gray-500/20 to-slate-500/20',
      textColor: 'text-gray-600 dark:text-gray-400',
      popular: false,
      credits: 50,
      creditsLabelKey: 'pricing.credits.lifetime',
      sites: 1,
      featureKeys: [
        'pricing.feature.free.sites',
        'pricing.feature.free.credits',
        'pricing.feature.free.pages',
        'pricing.feature.free.preview',
        'pricing.feature.free.branding',
        'pricing.feature.free.support',
      ],
      ctaStyle: 'outline',
    },
    {
      key: 'starter',
      price: '$15',
      period: '/month',
      yearlyPrice: '$12',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-blue-500/20 to-cyan-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      popular: false,
      credits: 300,
      creditsLabelKey: 'pricing.credits.perMonth',
      sites: 3,
      creditDiscount: 10,
      featureKeys: [
        'pricing.feature.starter.sites',
        'pricing.feature.starter.credits',
        'pricing.feature.starter.pages',
        'pricing.feature.starter.domains',
        'pricing.feature.starter.branding',
        'pricing.feature.starter.support',
        'pricing.feature.starter.discount',
      ],
      ctaStyle: 'default',
    },
    {
      key: 'pro',
      price: '$25',
      period: '/month',
      yearlyPrice: '$20',
      icon: <Star className="h-6 w-6" />,
      color: 'from-purple-500/20 to-pink-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      popular: true,
      credits: 800,
      creditsLabelKey: 'pricing.credits.perMonth',
      sites: 10,
      creditDiscount: 20,
      featureKeys: [
        'pricing.feature.pro.sites',
        'pricing.feature.pro.credits',
        'pricing.feature.pro.pages',
        'pricing.feature.pro.domains',
        'pricing.feature.pro.aiModels',
        'pricing.feature.pro.ecommerce',
        'pricing.feature.pro.support',
        'pricing.feature.pro.discount',
      ],
      ctaStyle: 'primary',
    },
    {
      key: 'business',
      price: '$45',
      period: '/month',
      yearlyPrice: '$38',
      icon: <Crown className="h-6 w-6" />,
      color: 'from-orange-500/20 to-red-500/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      popular: false,
      credits: 2000,
      creditsLabelKey: 'pricing.credits.perMonth',
      sites: 'unlimited',
      creditDiscount: 25,
      featureKeys: [
        'pricing.feature.business.sites',
        'pricing.feature.business.credits',
        'pricing.feature.business.pages',
        'pricing.feature.business.domains',
        'pricing.feature.business.aiModels',
        'pricing.feature.business.ecommerce',
        'pricing.feature.business.team',
        'pricing.feature.business.api',
        'pricing.feature.business.discount',
      ],
      ctaStyle: 'default',
    },
  ];

  const creditPacks = [
    { credits: 300, basePrice: 5 },
    { credits: 1000, basePrice: 15 },
    { credits: 3000, basePrice: 40 },
  ];

  const usageExamples: {
    tierKey: PlanKey;
    credits: number;
    exampleKeys: string[];
  }[] = [
    {
      tierKey: 'starter',
      credits: 300,
      exampleKeys: [
        'pricing.usage.starter.example1',
        'pricing.usage.starter.example2',
        'pricing.usage.starter.example3',
      ],
    },
    {
      tierKey: 'pro',
      credits: 800,
      exampleKeys: [
        'pricing.usage.pro.example1',
        'pricing.usage.pro.example2',
        'pricing.usage.pro.example3',
      ],
    },
    {
      tierKey: 'business',
      credits: 2000,
      exampleKeys: [
        'pricing.usage.business.example1',
        'pricing.usage.business.example2',
        'pricing.usage.business.example3',
      ],
    },
  ];

  const getDiscountedPrice = (basePrice: number, discount: number) => {
    return (basePrice * (1 - discount / 100)).toFixed(2);
  };

  const getSelectedDiscount = () => {
    const plan = plans.find((p) => p.key === selectedTier);
    return plan?.creditDiscount || 0;
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      titleKey: 'pricing.why.aiPowered.title',
      descriptionKey: 'pricing.why.aiPowered.description',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      titleKey: 'pricing.why.businessFirst.title',
      descriptionKey: 'pricing.why.businessFirst.description',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      titleKey: 'pricing.why.credits.title',
      descriptionKey: 'pricing.why.credits.description',
    },
  ];

  const faqItems = [
    {
      questionKey: 'pricing.faq.whatIsCredit.question',
      answerKey: 'pricing.faq.whatIsCredit.answer',
    },
    {
      questionKey: 'pricing.faq.rollover.question',
      answerKey: 'pricing.faq.rollover.answer',
    },
    {
      questionKey: 'pricing.faq.upgrade.question',
      answerKey: 'pricing.faq.upgrade.answer',
    },
    {
      questionKey: 'pricing.faq.freeCredits.question',
      answerKey: 'pricing.faq.freeCredits.answer',
    },
  ];

  const getFeatureText = (featureKey: string, plan: Plan): string => {
    // Handle discount features with variable substitution
    if (featureKey.includes('.discount') && plan.creditDiscount) {
      return t(featureKey as any, { percent: plan.creditDiscount });
    }
    return t(featureKey as any);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        plan={waitlistPlan}
      />

      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-5xl mx-auto">
            <Badge
              variant="outline"
              className="mb-6 text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-900/20"
            >
              {t('pricing.badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              {t('pricing.hero.title')}{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('pricing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('pricing.hero.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4 pb-8">
        <span
          className={`text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('pricing.billing.monthly')}
        </span>
        <button
          onClick={() =>
            setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingPeriod === 'yearly'
              ? 'bg-purple-600'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            billingPeriod === 'yearly'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('pricing.billing.yearly')}
        </span>
        {billingPeriod === 'yearly' && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            {t('pricing.billing.savePercent', { percent: 20 })}
          </Badge>
        )}
      </div>

      {/* Pricing Plans */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl relative flex flex-col ${
                  plan.popular
                    ? 'ring-2 ring-purple-500/50 dark:ring-purple-400/50 lg:scale-105 z-10'
                    : ''
                } [@media(hover:hover)]:hover:shadow-2xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('pricing.badge.popular')}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="text-center mb-6">
                    <div
                      className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center ${plan.textColor}`}
                    >
                      {plan.icon}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {t(`pricing.plan.${plan.key}` as any)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 min-h-[40px]">
                      {t(`pricing.plan.${plan.key}.description` as any)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {billingPeriod === 'yearly' && plan.yearlyPrice !== '$0'
                          ? plan.yearlyPrice
                          : plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {plan.period}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' &&
                      plan.price !== '$0' &&
                      plan.period && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('pricing.billing.billedYearly', {
                            amount:
                              parseInt(plan.yearlyPrice.replace('$', '')) * 12,
                          })}
                        </p>
                      )}
                  </div>

                  {/* Credits Highlight */}
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4 border border-purple-100 dark:border-purple-800/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800/50">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.credits.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('pricing.credits')} {t(plan.creditsLabelKey)}
                      </div>
                    </div>
                  </div>

                  {/* Sites */}
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.sites === 'unlimited'
                        ? t('pricing.sites.unlimited')
                        : plan.sites}
                    </span>{' '}
                    {plan.sites === 1
                      ? t('pricing.sites.single')
                      : t('pricing.sites.plural')}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {plan.featureKeys.map((featureKey, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {getFeatureText(featureKey, plan)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button - Now opens waitlist */}
                  <div className="mt-6">
                    <Button
                      onClick={() => openWaitlist(plan.key)}
                      className={`w-full ${
                        plan.ctaStyle === 'primary'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 [@media(hover:hover)]:hover:from-purple-700 [@media(hover:hover)]:hover:to-pink-700 text-white'
                          : plan.ctaStyle === 'outline'
                          ? 'bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white [@media(hover:hover)]:hover:bg-gray-100 dark:[@media(hover:hover)]:hover:bg-gray-800'
                          : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 [@media(hover:hover)]:hover:bg-gray-800 dark:[@media(hover:hover)]:hover:bg-gray-100'
                      }`}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      {t('waitlist.cta.joinWaitlist')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Can You Build Section */}
      <section className="py-16 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.usage.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('pricing.usage.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {usageExamples.map((item, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-lg"
              >
                <CardContent className="p-6 text-center">
                  <Badge
                    variant="outline"
                    className="mb-3 text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-900/20"
                  >
                    {t(`pricing.plan.${item.tierKey}` as any)}
                  </Badge>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {item.credits.toLocaleString()}{' '}
                    <span className="text-base font-normal text-gray-500">
                      {t('pricing.credits.label')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {item.exampleKeys.map((exampleKey, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <Rocket className="h-4 w-4 text-purple-500" />
                        {t(exampleKey as any)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Packs Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.creditPacks.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('pricing.creditPacks.description')}
            </p>
          </div>

          {/* Tier Selector */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {plans
              .filter((p) => p.creditDiscount)
              .map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedTier(plan.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTier === plan.key
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 [@media(hover:hover)]:hover:bg-gray-200 dark:[@media(hover:hover)]:hover:bg-gray-700'
                  }`}
                >
                  {t(`pricing.plan.${plan.key}` as any)}
                  <span className="ml-1.5 text-xs opacity-75">
                    -{plan.creditDiscount}%
                  </span>
                </button>
              ))}
          </div>

          {/* Credit Packs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {creditPacks.map((pack, index) => {
              const discount = getSelectedDiscount();
              const discountedPrice = getDiscountedPrice(
                pack.basePrice,
                discount
              );
              const savings = (
                pack.basePrice - parseFloat(discountedPrice)
              ).toFixed(2);

              return (
                <Card
                  key={index}
                  className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-lg relative [@media(hover:hover)]:hover:shadow-xl transition-all [@media(hover:hover)]:hover:scale-[1.02]"
                >
                  {discount > 0 && (
                    <div className="absolute -top-2.5 right-4">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        -{discount}%
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {pack.credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {t('pricing.credits.label')}
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                      {discount > 0 && (
                        <span className="text-lg text-gray-400 line-through">
                          ${pack.basePrice}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${discountedPrice}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="text-xs text-green-600 dark:text-green-400 mb-4">
                        {t('pricing.creditPacks.savings', { amount: savings })}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      $
                      {(
                        (parseFloat(discountedPrice) / pack.credits) *
                        100
                      ).toFixed(2)}
                      {t('pricing.creditPacks.perCredit')}
                    </div>

                    <Button
                      onClick={() => openWaitlist(selectedTier)}
                      variant="outline"
                      className="w-full mt-4 border-purple-200 text-purple-600 [@media(hover:hover)]:hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:[@media(hover:hover)]:hover:bg-purple-900/20"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      {t('waitlist.cta.notifyMe')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.why.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('pricing.why.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-lg text-center"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t(feature.titleKey as any)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t(feature.descriptionKey as any)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.faq.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faqItems.map((item, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-lg"
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t(item.questionKey as any)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {t(item.answerKey as any)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="backdrop-blur-md bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-white/40 shadow-xl max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('pricing.cta.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                {t('pricing.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => openWaitlist()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 [@media(hover:hover)]:hover:from-purple-700 [@media(hover:hover)]:hover:to-pink-700 text-white px-8 py-3 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('waitlist.cta.getEarlyAccess')}
                </Button>
                <Button variant="outline" className="px-8 py-3 text-lg">
                  {t('pricing.cta.contactSales')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
