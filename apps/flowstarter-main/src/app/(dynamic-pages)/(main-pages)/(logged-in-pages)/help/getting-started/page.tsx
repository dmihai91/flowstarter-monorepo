'use client';

import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Lightbulb,
  ListChecks,
  PlusCircle,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DashboardSubtitle } from '../../dashboard/components/DashboardSubtitle';
import { PageSectionHeader } from '../../dashboard/components/PageSectionHeader';

// Steps will be populated from translations
const getSteps = (t: (key: string) => string) => [
  {
    id: 'signup',
    title: t('help.gettingStarted.steps.signup.title'),
    description: t('help.gettingStarted.steps.signup.description'),
    details: [
      t('help.gettingStarted.steps.signup.details.1'),
      t('help.gettingStarted.steps.signup.details.2'),
      t('help.gettingStarted.steps.signup.details.3'),
      t('help.gettingStarted.steps.signup.details.4'),
    ],
    tips: [
      t('help.gettingStarted.steps.signup.tips.1'),
      t('help.gettingStarted.steps.signup.tips.2'),
    ],
    estimatedTime: t('help.gettingStarted.steps.signup.time'),
  },
  {
    id: 'details',
    title: t('help.gettingStarted.steps.details.title'),
    description: t('help.gettingStarted.steps.details.description'),
    details: [
      t('help.gettingStarted.steps.details.details.1'),
      t('help.gettingStarted.steps.details.details.2'),
      t('help.gettingStarted.steps.details.details.3'),
      t('help.gettingStarted.steps.details.details.4'),
      t('help.gettingStarted.steps.details.details.5'),
      t('help.gettingStarted.steps.details.details.6'),
    ],
    tips: [
      t('help.gettingStarted.steps.details.tips.1'),
      t('help.gettingStarted.steps.details.tips.2'),
      t('help.gettingStarted.steps.details.tips.3'),
    ],
    estimatedTime: t('help.gettingStarted.steps.details.time'),
  },
  {
    id: 'template',
    title: t('help.gettingStarted.steps.template.title'),
    description: t('help.gettingStarted.steps.template.description'),
    details: [
      t('help.gettingStarted.steps.template.details.1'),
      t('help.gettingStarted.steps.template.details.2'),
      t('help.gettingStarted.steps.template.details.3'),
      t('help.gettingStarted.steps.template.details.4'),
    ],
    tips: [
      t('help.gettingStarted.steps.template.tips.1'),
      t('help.gettingStarted.steps.template.tips.2'),
      t('help.gettingStarted.steps.template.tips.3'),
    ],
    estimatedTime: t('help.gettingStarted.steps.template.time'),
  },
  {
    id: 'review',
    title: t('help.gettingStarted.steps.review.title'),
    description: t('help.gettingStarted.steps.review.description'),
    details: [
      t('help.gettingStarted.steps.review.details.1'),
      t('help.gettingStarted.steps.review.details.2'),
      t('help.gettingStarted.steps.review.details.3'),
      t('help.gettingStarted.steps.review.details.4'),
      t('help.gettingStarted.steps.review.details.5'),
    ],
    tips: [
      t('help.gettingStarted.steps.review.tips.1'),
      t('help.gettingStarted.steps.review.tips.2'),
      t('help.gettingStarted.steps.review.tips.3'),
    ],
    estimatedTime: t('help.gettingStarted.steps.review.time'),
  },
];

export default function GettingStartedGuide() {
  const { t } = useI18n();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const steps = getSteps(t);

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
            {t('help.breadcrumb.gettingStarted')}
          </span>
        </div>

        {/* Header */}
        <div>
          <PageSectionHeader
            title={t('help.gettingStarted.title')}
            className="mb-4"
          />
          <DashboardSubtitle>
            {t('help.gettingStarted.subtitlePrefix')} {totalEstimatedTime}{' '}
            {t('help.common.minutes')}
          </DashboardSubtitle>
        </div>

        {/* Progress Overview */}
        <GlassCard>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: 'var(--green)' }}
                />
                <div>
                  <h3
                    className="font-semibold"
                    style={{ color: 'var(--copy-headlines)' }}
                  >
                    {t('help.progress.title')}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--copy-body)' }}>
                    {t('help.progress.stepsCompleted', {
                      completed: completedSteps.length,
                      total: steps.length,
                    })}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-6 text-sm"
                style={{ color: 'var(--copy-body)' }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    ~{totalEstimatedTime} {t('help.common.min')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t('help.progress.difficultyBeginnerLabel')}</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </GlassCard>

        {/* Steps */}
        <div className="space-y-5">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <GlassCard
                key={step.id}
                className={`transition-all ${
                  isCompleted
                    ? 'ring-2 ring-green-500/30 dark:ring-green-500/20'
                    : ''
                }`}
              >
                <div>
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
                        className={`text-lg font-semibold mb-2 ${
                          isCompleted ? 'line-through opacity-75' : ''
                        }`}
                        style={{ color: 'var(--copy-headlines)' }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-sm mb-3"
                        style={{ color: 'var(--copy-body)' }}
                      >
                        {step.description}
                      </p>
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--copy-labels)' }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{step.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pl-12">
                    {/* Detailed Steps */}
                    <div>
                      <h4
                        className="font-medium mb-3 flex items-center gap-2 text-sm"
                        style={{ color: 'var(--copy-headlines)' }}
                      >
                        <ListChecks
                          className="h-4 w-4"
                          style={{ color: 'var(--copy-labels)' }}
                        />
                        {t('help.section.whatToDo')}
                      </h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li
                            key={detailIndex}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: 'var(--copy-body)' }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                              style={{ backgroundColor: 'var(--copy-labels)' }}
                            />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4
                        className="font-medium mb-3 flex items-center gap-2 text-sm"
                        style={{ color: 'var(--copy-headlines)' }}
                      >
                        <Lightbulb
                          className="h-4 w-4"
                          style={{ color: 'var(--copy-labels)' }}
                        />
                        {t('help.section.tips')}
                      </h4>
                      <ul className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                          <li
                            key={tipIndex}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: 'var(--copy-body)' }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                              style={{ backgroundColor: 'var(--copy-labels)' }}
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <GlassCard className="py-8">
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold mb-3"
                style={{ color: 'var(--copy-headlines)' }}
              >
                {t('help.cta.readyToGetStarted.title')}
              </h2>
              <p
                className="text-sm mb-6 max-w-2xl mx-auto"
                style={{ color: 'var(--copy-body)' }}
              >
                {t('help.cta.readyToGetStarted.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/new">
                  <Button size="lg" className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    {t('help.cta.startCreatingProject')}
                  </Button>
                </Link>
                <Link href="/help/template-selection">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {t('help.cta.nextGuide.templateSelection')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}
