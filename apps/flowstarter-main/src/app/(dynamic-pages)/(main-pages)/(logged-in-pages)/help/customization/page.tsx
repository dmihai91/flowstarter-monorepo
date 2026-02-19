'use client';

import { PageContainer } from '@/components/PageContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import {
  CheckCircle,
  Clock,
  Code,
  FileText,
  Image,
  Palette,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DashboardSubtitle } from '../../dashboard/components/DashboardSubtitle';
import { PageSectionHeader } from '../../dashboard/components/PageSectionHeader';

// Steps will be populated from translations
const getSteps = (t: (key: string) => string) => [
  {
    id: 'access',
    title: t('help.customization.steps.access.title'),
    description: t('help.customization.steps.access.description'),
    details: [
      t('help.customization.steps.access.details.1'),
      t('help.customization.steps.access.details.2'),
      t('help.customization.steps.access.details.3'),
      t('help.customization.steps.access.details.4'),
      t('help.customization.steps.access.details.5'),
    ],
    tips: [
      t('help.customization.steps.access.tips.1'),
      t('help.customization.steps.access.tips.2'),
      t('help.customization.steps.access.tips.3'),
      t('help.customization.steps.access.tips.4'),
    ],
    estimatedTime: t('help.customization.steps.access.time'),
  },
  {
    id: 'branding',
    title: t('help.customization.steps.branding.title'),
    description: t('help.customization.steps.branding.description'),
    details: [
      t('help.customization.steps.branding.details.1'),
      t('help.customization.steps.branding.details.2'),
      t('help.customization.steps.branding.details.3'),
      t('help.customization.steps.branding.details.4'),
      t('help.customization.steps.branding.details.5'),
    ],
    tips: [
      t('help.customization.steps.branding.tips.1'),
      t('help.customization.steps.branding.tips.2'),
      t('help.customization.steps.branding.tips.3'),
      t('help.customization.steps.branding.tips.4'),
    ],
    estimatedTime: t('help.customization.steps.branding.time'),
  },
  {
    id: 'content',
    title: t('help.customization.steps.content.title'),
    description: t('help.customization.steps.content.description'),
    details: [
      t('help.customization.steps.content.details.1'),
      t('help.customization.steps.content.details.2'),
      t('help.customization.steps.content.details.3'),
      t('help.customization.steps.content.details.4'),
      t('help.customization.steps.content.details.5'),
    ],
    tips: [
      t('help.customization.steps.content.tips.1'),
      t('help.customization.steps.content.tips.2'),
      t('help.customization.steps.content.tips.3'),
      t('help.customization.steps.content.tips.4'),
    ],
    estimatedTime: t('help.customization.steps.content.time'),
  },
  {
    id: 'features',
    title: t('help.customization.steps.features.title'),
    description: t('help.customization.steps.features.description'),
    details: [
      t('help.customization.steps.features.details.1'),
      t('help.customization.steps.features.details.2'),
      t('help.customization.steps.features.details.3'),
      t('help.customization.steps.features.details.4'),
      t('help.customization.steps.features.details.5'),
    ],
    tips: [
      t('help.customization.steps.features.tips.1'),
      t('help.customization.steps.features.tips.2'),
      t('help.customization.steps.features.tips.3'),
      t('help.customization.steps.features.tips.4'),
    ],
    estimatedTime: t('help.customization.steps.features.time'),
  },
  {
    id: 'test',
    title: t('help.customization.steps.test.title'),
    description: t('help.customization.steps.test.description'),
    details: [
      t('help.customization.steps.test.details.1'),
      t('help.customization.steps.test.details.2'),
      t('help.customization.steps.test.details.3'),
      t('help.customization.steps.test.details.4'),
      t('help.customization.steps.test.details.5'),
    ],
    tips: [
      t('help.customization.steps.test.tips.1'),
      t('help.customization.steps.test.tips.2'),
      t('help.customization.steps.test.tips.3'),
      t('help.customization.steps.test.tips.4'),
    ],
    estimatedTime: t('help.customization.steps.test.time'),
  },
];

// Customization areas will be populated from translations
const getCustomizationAreas = (t: (key: string) => string) => [
  {
    title: t('help.customization.areas.visualDesign.title'),
    icon: <Palette className="h-6 w-6" />,
    difficulty: t('help.customization.areas.visualDesign.difficulty'),
    items: [
      t('help.customization.areas.visualDesign.items.1'),
      t('help.customization.areas.visualDesign.items.2'),
      t('help.customization.areas.visualDesign.items.3'),
      t('help.customization.areas.visualDesign.items.4'),
      t('help.customization.areas.visualDesign.items.5'),
    ],
    description: t('help.customization.areas.visualDesign.description'),
  },
  {
    title: t('help.customization.areas.contentCopy.title'),
    icon: <FileText className="h-6 w-6" />,
    difficulty: t('help.customization.areas.contentCopy.difficulty'),
    items: [
      t('help.customization.areas.contentCopy.items.1'),
      t('help.customization.areas.contentCopy.items.2'),
      t('help.customization.areas.contentCopy.items.3'),
      t('help.customization.areas.contentCopy.items.4'),
      t('help.customization.areas.contentCopy.items.5'),
    ],
    description: t('help.customization.areas.contentCopy.description'),
  },
  {
    title: t('help.customization.areas.imagesMedia.title'),
    icon: <Image className="h-6 w-6" />,
    difficulty: t('help.customization.areas.imagesMedia.difficulty'),
    items: [
      t('help.customization.areas.imagesMedia.items.1'),
      t('help.customization.areas.imagesMedia.items.2'),
      t('help.customization.areas.imagesMedia.items.3'),
      t('help.customization.areas.imagesMedia.items.4'),
      t('help.customization.areas.imagesMedia.items.5'),
    ],
    description: t('help.customization.areas.imagesMedia.description'),
  },
  {
    title: t('help.customization.areas.functionality.title'),
    icon: <Zap className="h-6 w-6" />,
    difficulty: t('help.customization.areas.functionality.difficulty'),
    items: [
      t('help.customization.areas.functionality.items.1'),
      t('help.customization.areas.functionality.items.2'),
      t('help.customization.areas.functionality.items.3'),
      t('help.customization.areas.functionality.items.4'),
      t('help.customization.areas.functionality.items.5'),
    ],
    description: t('help.customization.areas.functionality.description'),
  },
  {
    title: t('help.customization.areas.codeStructure.title'),
    icon: <Code className="h-6 w-6" />,
    difficulty: t('help.customization.areas.codeStructure.difficulty'),
    items: [
      t('help.customization.areas.codeStructure.items.1'),
      t('help.customization.areas.codeStructure.items.2'),
      t('help.customization.areas.codeStructure.items.3'),
      t('help.customization.areas.codeStructure.items.4'),
      t('help.customization.areas.codeStructure.items.5'),
    ],
    description: t('help.customization.areas.codeStructure.description'),
  },
];

// Tools will be populated from translations
const getTools = (t: (key: string) => string) => [
  {
    name: t('help.customization.tools.vscode.name'),
    description: t('help.customization.tools.vscode.description'),
    useCase: t('help.customization.tools.vscode.useCase'),
    difficulty: t('help.customization.tools.vscode.difficulty'),
  },
  {
    name: t('help.customization.tools.figma.name'),
    description: t('help.customization.tools.figma.description'),
    useCase: t('help.customization.tools.figma.useCase'),
    difficulty: t('help.customization.tools.figma.difficulty'),
  },
  {
    name: t('help.customization.tools.devtools.name'),
    description: t('help.customization.tools.devtools.description'),
    useCase: t('help.customization.tools.devtools.useCase'),
    difficulty: t('help.customization.tools.devtools.difficulty'),
  },
  {
    name: t('help.customization.tools.github.name'),
    description: t('help.customization.tools.github.description'),
    useCase: t('help.customization.tools.github.useCase'),
    difficulty: t('help.customization.tools.github.difficulty'),
  },
];

export default function CustomizationGuide() {
  const { t } = useI18n();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const steps = getSteps(t);
  const customizationAreas = getCustomizationAreas(t);
  const tools = getTools(t);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

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
            {t('help.breadcrumb.customization')}
          </span>
        </div>

        {/* Header */}
        <div>
          <PageSectionHeader
            title={t('help.customization.title')}
            className="mb-4"
          />
          <DashboardSubtitle>
            {t('help.customization.subtitlePrefix')} {totalEstimatedTime}{' '}
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
                  <span>
                    {t('help.progress.difficultyBeginnerIntermediate')}
                  </span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            {completedSteps.length === steps.length && (
              <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium text-sm">
                    {t('help.completed.customization.title')}
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  {t('help.completed.customization.subtitle')}
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
                        {t('help.section.whatToDo')}
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
                        💡 {t('help.section.proTips')}
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

        {/* Customization Areas */}
        <div>
          <PageSectionHeader
            title={t('help.section.whatYouCanCustomize.title')}
            subtitle={t('help.section.whatYouCanCustomize.subtitle')}
            className="mb-6"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customizationAreas.map((area) => (
              <Card
                key={area.title}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 rounded-xl text-white p-3 bg-gradient-to-br from-gray-900 to-gray-800">
                      {area.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                          {area.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getDifficultyColor(
                            area.difficulty
                          )}`}
                        >
                          {area.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {area.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                      {t('help.section.youCanModify')}
                    </h4>
                    <ul className="space-y-1.5">
                      {area.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Helpful Tools */}
        <div>
          <PageSectionHeader
            title={t('help.section.helpfulTools.title')}
            subtitle={t('help.section.helpfulTools.subtitle')}
            className="mb-6"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Card
                key={tool.name}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      {tool.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-200 dark:border-gray-700"
                    >
                      {tool.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {tool.description}
                  </p>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Best for:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {tool.useCase}
                    </span>
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
                {t('help.cta.readyToCustomize.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {t('help.cta.readyToCustomize.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('help.cta.startCustomizing')}
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
