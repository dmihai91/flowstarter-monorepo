'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles, X } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import type { EnrichedFields } from './useScaffoldForm';
import type { TranslationKeys } from '@/lib/i18n';

interface FieldDef {
  key: keyof EnrichedFields;
  labelKey: TranslationKeys;
  placeholderKey: TranslationKeys;
  multiline?: boolean;
}

interface StepDef {
  titleKey: TranslationKeys;
  subtitleKey: TranslationKeys;
  fields: FieldDef[];
}

const STEPS: StepDef[] = [
  {
    titleKey: 'scaffold.review.step1.title',
    subtitleKey: 'scaffold.review.step1.subtitle',
    fields: [
      { key: 'siteName', labelKey: 'scaffold.review.field.siteName', placeholderKey: 'scaffold.review.placeholder.siteName' },
      { key: 'industry', labelKey: 'scaffold.review.field.industry', placeholderKey: 'scaffold.review.placeholder.industry' },
      { key: 'description', labelKey: 'scaffold.review.field.description', placeholderKey: 'scaffold.review.placeholder.description', multiline: true },
    ],
  },
  {
    titleKey: 'scaffold.review.step2.title',
    subtitleKey: 'scaffold.review.step2.subtitle',
    fields: [
      { key: 'targetAudience', labelKey: 'scaffold.review.field.targetAudience', placeholderKey: 'scaffold.review.placeholder.targetAudience' },
      { key: 'uvp', labelKey: 'scaffold.review.field.uvp', placeholderKey: 'scaffold.review.placeholder.uvp', multiline: true },
      { key: 'brandTone', labelKey: 'scaffold.review.field.brandTone', placeholderKey: 'scaffold.review.placeholder.brandTone' },
    ],
  },
  {
    titleKey: 'scaffold.review.step3.title',
    subtitleKey: 'scaffold.review.step3.subtitle',
    fields: [
      { key: 'offerings', labelKey: 'scaffold.review.field.offerings', placeholderKey: 'scaffold.review.placeholder.offerings', multiline: true },
      { key: 'goal', labelKey: 'scaffold.review.field.goal', placeholderKey: 'scaffold.review.placeholder.goal' },
      { key: 'offerType', labelKey: 'scaffold.review.field.offerType', placeholderKey: 'scaffold.review.placeholder.offerType' },
    ],
  },
  {
    titleKey: 'scaffold.review.step4.title',
    subtitleKey: 'scaffold.review.step4.subtitle',
    fields: [
      { key: 'contactEmail', labelKey: 'scaffold.review.field.contactEmail', placeholderKey: 'scaffold.review.placeholder.contactEmail' },
      { key: 'contactPhone', labelKey: 'scaffold.review.field.contactPhone', placeholderKey: 'scaffold.review.placeholder.contactPhone' },
      { key: 'contactAddress', labelKey: 'scaffold.review.field.contactAddress', placeholderKey: 'scaffold.review.placeholder.contactAddress' },
    ],
  },
];

interface ScaffoldReviewProps {
  fields: EnrichedFields;
  reviewStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  reviewStepCount: number;
  onUpdateField: (key: keyof EnrichedFields, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onRegenerate: () => void;
  onLaunch: () => void;
  onReset: () => void;
}

export function ScaffoldReview({
  fields,
  reviewStep,
  isFirstStep,
  isLastStep,
  reviewStepCount,
  onUpdateField,
  onNext,
  onPrev,
  onRegenerate,
  onLaunch,
  onReset,
}: ScaffoldReviewProps) {
  const { t } = useTranslations();
  const currentStep = STEPS[reviewStep];

  return (
    <GlassCard noHover>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {reviewStep + 1}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {t(currentStep.titleKey)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {t(currentStep.subtitleKey)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
            title={t('scaffold.review.regenerate')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: reviewStepCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= reviewStep
                ? 'bg-[var(--purple)]'
                : 'bg-gray-200 dark:bg-white/10'
            )}
          />
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-5">
        {currentStep.fields.map(({ key, labelKey, placeholderKey, multiline }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-500 dark:text-white/40 mb-1 block">
              {t(labelKey)}
            </label>
            {multiline ? (
              <textarea
                value={fields[key] || ''}
                onChange={(e) => onUpdateField(key, e.target.value)}
                placeholder={t(placeholderKey)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white/80 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/30 transition-colors resize-none"
              />
            ) : (
              <input
                type="text"
                value={fields[key] || ''}
                onChange={(e) => onUpdateField(key, e.target.value)}
                placeholder={t(placeholderKey)}
                className="w-full px-3 py-2 text-sm bg-white/80 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/30 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        {isFirstStep ? (
          <Button onClick={onReset} variant="outline" size="sm" className="flex-1">
            {t('scaffold.action.startOver')}
          </Button>
        ) : (
          <Button onClick={onPrev} variant="outline" size="sm" className="flex-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('scaffold.action.back')}
          </Button>
        )}

        {isLastStep ? (
          <Button onClick={onLaunch} variant="accent" size="sm" className="flex-1">
            <Sparkles className="w-3.5 h-3.5" />
            {t('scaffold.action.openInEditor')}
          </Button>
        ) : (
          <Button onClick={onNext} variant="accent" size="sm" className="flex-1">
            {t('scaffold.action.next')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Step counter */}
      <p className="text-[0.625rem] text-gray-400 dark:text-white/30 mt-2 text-center">
        {t('scaffold.review.stepCounter', { current: reviewStep + 1, total: reviewStepCount })}
      </p>
    </GlassCard>
  );
}
