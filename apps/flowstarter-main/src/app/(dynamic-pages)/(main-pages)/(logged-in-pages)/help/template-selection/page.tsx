'use client';

import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  PlusCircle,
  Rocket,
  Store,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DashboardSubtitle } from '../../dashboard/components/DashboardSubtitle';
import { PageSectionHeader } from '../../dashboard/components/PageSectionHeader';

// Steps will be populated from translations
const getSteps = (t: (key: string) => string) => [
  {
    id: 'understand',
    title: t('help.templateSelection.steps.understand.title'),
    description: t('help.templateSelection.steps.understand.description'),
    details: [
      t('help.templateSelection.steps.understand.details.1'),
      t('help.templateSelection.steps.understand.details.2'),
      t('help.templateSelection.steps.understand.details.3'),
      t('help.templateSelection.steps.understand.details.4'),
    ],
    tips: [
      t('help.templateSelection.steps.understand.tips.1'),
      t('help.templateSelection.steps.understand.tips.2'),
    ],
    estimatedTime: t('help.templateSelection.steps.understand.time'),
  },
  {
    id: 'explore',
    title: t('help.templateSelection.steps.explore.title'),
    description: t('help.templateSelection.steps.explore.description'),
    details: [
      t('help.templateSelection.steps.explore.details.1'),
      t('help.templateSelection.steps.explore.details.2'),
      t('help.templateSelection.steps.explore.details.3'),
      t('help.templateSelection.steps.explore.details.4'),
    ],
    tips: [
      t('help.templateSelection.steps.explore.tips.1'),
      t('help.templateSelection.steps.explore.tips.2'),
      t('help.templateSelection.steps.explore.tips.3'),
    ],
    estimatedTime: t('help.templateSelection.steps.explore.time'),
  },
  {
    id: 'select',
    title: t('help.templateSelection.steps.select.title'),
    description: t('help.templateSelection.steps.select.description'),
    details: [
      t('help.templateSelection.steps.select.details.1'),
      t('help.templateSelection.steps.select.details.2'),
      t('help.templateSelection.steps.select.details.3'),
      t('help.templateSelection.steps.select.details.4'),
    ],
    tips: [
      t('help.templateSelection.steps.select.tips.1'),
      t('help.templateSelection.steps.select.tips.2'),
      t('help.templateSelection.steps.select.tips.3'),
    ],
    estimatedTime: t('help.templateSelection.steps.select.time'),
  },
];

// Templates will be populated from translations
const getTemplates = (t: (key: string) => string) => [
  {
    id: 'personal-brand',
    name: t('help.templateSelection.templates.personalBrand.name'),
    description: t(
      'help.templateSelection.templates.personalBrand.description'
    ),
    icon: <User className="h-6 w-6" />,
    complexity: t('help.templateSelection.templates.personalBrand.complexity'),
    estimatedTime: t('help.templateSelection.templates.personalBrand.time'),
    bestFor: [
      t('help.templateSelection.templates.personalBrand.bestFor.1'),
      t('help.templateSelection.templates.personalBrand.bestFor.2'),
      t('help.templateSelection.templates.personalBrand.bestFor.3'),
      t('help.templateSelection.templates.personalBrand.bestFor.4'),
    ],
    features: [
      t('help.templateSelection.templates.personalBrand.features.1'),
      t('help.templateSelection.templates.personalBrand.features.2'),
      t('help.templateSelection.templates.personalBrand.features.3'),
      t('help.templateSelection.templates.personalBrand.features.4'),
    ],
    useCases: [
      t('help.templateSelection.templates.personalBrand.useCases.1'),
      t('help.templateSelection.templates.personalBrand.useCases.2'),
      t('help.templateSelection.templates.personalBrand.useCases.3'),
      t('help.templateSelection.templates.personalBrand.useCases.4'),
    ],
  },
  {
    id: 'local-business',
    name: t('help.templateSelection.templates.localBusiness.name'),
    description: t(
      'help.templateSelection.templates.localBusiness.description'
    ),
    icon: <Store className="h-6 w-6" />,
    complexity: t('help.templateSelection.templates.localBusiness.complexity'),
    estimatedTime: t('help.templateSelection.templates.localBusiness.time'),
    bestFor: [
      t('help.templateSelection.templates.localBusiness.bestFor.1'),
      t('help.templateSelection.templates.localBusiness.bestFor.2'),
      t('help.templateSelection.templates.localBusiness.bestFor.3'),
      t('help.templateSelection.templates.localBusiness.bestFor.4'),
    ],
    features: [
      t('help.templateSelection.templates.localBusiness.features.1'),
      t('help.templateSelection.templates.localBusiness.features.2'),
      t('help.templateSelection.templates.localBusiness.features.3'),
      t('help.templateSelection.templates.localBusiness.features.4'),
    ],
    useCases: [
      t('help.templateSelection.templates.localBusiness.useCases.1'),
      t('help.templateSelection.templates.localBusiness.useCases.2'),
      t('help.templateSelection.templates.localBusiness.useCases.3'),
      t('help.templateSelection.templates.localBusiness.useCases.4'),
    ],
  },
  {
    id: 'saas-product',
    name: t('help.templateSelection.templates.saasProduct.name'),
    description: t('help.templateSelection.templates.saasProduct.description'),
    icon: <Rocket className="h-6 w-6" />,
    complexity: t('help.templateSelection.templates.saasProduct.complexity'),
    estimatedTime: t('help.templateSelection.templates.saasProduct.time'),
    bestFor: [
      t('help.templateSelection.templates.saasProduct.bestFor.1'),
      t('help.templateSelection.templates.saasProduct.bestFor.2'),
      t('help.templateSelection.templates.saasProduct.bestFor.3'),
      t('help.templateSelection.templates.saasProduct.bestFor.4'),
    ],
    features: [
      t('help.templateSelection.templates.saasProduct.features.1'),
      t('help.templateSelection.templates.saasProduct.features.2'),
      t('help.templateSelection.templates.saasProduct.features.3'),
      t('help.templateSelection.templates.saasProduct.features.4'),
    ],
    useCases: [
      t('help.templateSelection.templates.saasProduct.useCases.1'),
      t('help.templateSelection.templates.saasProduct.useCases.2'),
      t('help.templateSelection.templates.saasProduct.useCases.3'),
      t('help.templateSelection.templates.saasProduct.useCases.4'),
    ],
  },
];

export default function TemplateSelectionGuide() {
  const { t } = useI18n();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const steps = getSteps(t);
  const templates = getTemplates(t);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  const progress = (completedSteps.length / steps.length) * 100;
  const totalEstimatedTime = steps.reduce((total, step) => {
    const minutes = parseInt(step.estimatedTime);
    return total + minutes;
  }, 0);

  return (
    <PageContainer gradientVariant="help">
      <div className="space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/help"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {t('help.breadcrumb.helpCenter')}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">
            {t('help.breadcrumb.templateSelection')}
          </span>
        </div>

        {/* Header */}
        <div>
          <PageSectionHeader
            title={t('help.templateSelection.title')}
            uppercaseTitle
            className="mb-4"
          />
          <DashboardSubtitle>
            {t('help.templateSelection.subtitlePrefix')} {totalEstimatedTime}{' '}
            {t('help.common.minutes')}
          </DashboardSubtitle>
        </div>

        {/* Progress Overview */}
        <Card className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: 'var(--green)' }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('help.progress.title')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {completedSteps.length} of {steps.length} steps completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>~{totalEstimatedTime} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t('help.progress.difficultyBeginner')}</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            {completedSteps.length === steps.length && (
              <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium text-sm">
                    {t('help.completed.templateSelection.title')}
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  {t('help.completed.templateSelection.subtitle')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-5">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <Card
                key={step.id}
                className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] transition-all ${
                  isCompleted
                    ? 'border-green-200/50 dark:border-green-800/50 bg-green-50/30 dark:bg-green-900/5'
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleStep(step.id)}
                      className="mt-1"
                    />
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isCompleted
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-[#3a3a42] dark:text-gray-200'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2 ${
                          isCompleted ? 'line-through opacity-75' : ''
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{step.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pl-12">
                    {/* Detailed Steps */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm">
                        {t('help.section.whatToConsider')}
                      </h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li
                            key={detailIndex}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm">
                        💡 {t('help.section.tips')}
                      </h4>
                      <ul className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                          <li
                            key={tipIndex}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Template Overview */}
        <div>
          <PageSectionHeader
            title={t('help.section.availableTemplates.title')}
            subtitle={t('help.section.availableTemplates.subtitle')}
            uppercaseTitle
            className="mb-6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 rounded-xl text-white p-3 bg-gradient-to-br from-gray-900 to-gray-800">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {template.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-200 dark:border-gray-700"
                        >
                          {template.complexity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Ready in ~{template.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Best For */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                        {t('help.section.bestFor')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {template.bestFor.map((item, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-gray-200 dark:border-gray-700"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Key Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                        {t('help.section.keyFeatures')}
                      </h4>
                      <ul className="space-y-1.5">
                        {template.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                        {t('help.section.perfectFor')}
                      </h4>
                      <ul className="space-y-1.5">
                        {template.useCases.map((useCase, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 shrink-0" />
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
            <CardContent className="py-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                {t('help.cta.readyToChooseTemplate.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {t('help.cta.readyToChooseTemplate.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/new">
                  <Button size="lg" className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    {t('help.cta.chooseYourTemplate')}
                  </Button>
                </Link>
                <Link href="/help/customization">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {t('help.cta.nextGuide.customization')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
