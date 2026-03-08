'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { ArrowRight, HelpCircle, X } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';

interface ScaffoldClarifyProps {
  questions: string[];
  answers: string[];
  onUpdateAnswer: (index: number, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function ScaffoldClarify({
  questions,
  answers,
  onUpdateAnswer,
  onSubmit,
  onReset,
}: ScaffoldClarifyProps) {
  const { t } = useTranslations();
  const hasAnyAnswer = answers.some((a) => a.trim().length > 0);

  return (
    <GlassCard noHover>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {t('scaffold.clarify.title')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {t('scaffold.clarify.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-5">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 block">
              {question}
            </label>
            <input
              type="text"
              value={answers[i] || ''}
              onChange={(e) => onUpdateAnswer(i, e.target.value)}
              placeholder={t('scaffold.clarify.placeholder')}
              className="w-full px-3 py-2.5 text-sm bg-white/80 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/30 ring-0 focus:ring-0 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline" size="sm" className="flex-1">
          {t('scaffold.action.startOver')}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!hasAnyAnswer}
          variant="accent"
          size="sm"
          className="flex-1"
        >
          {t('scaffold.action.continue')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-[0.625rem] text-gray-400 dark:text-white/30 mt-2 text-center">
        {t('scaffold.clarify.hint')}
      </p>
    </GlassCard>
  );
}
