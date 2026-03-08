'use client';

import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import type { AiStep } from './useScaffoldForm';

interface ScaffoldProgressProps {
  steps: AiStep[];
}

export function ScaffoldProgress({ steps }: ScaffoldProgressProps) {
  const { t } = useTranslations();

  return (
    <GlassCard noHover>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[var(--purple)] animate-pulse" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {t('scaffold.progress.title')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-white/40">
            {t('scaffold.progress.subtitle')}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                step.done
                  ? 'bg-green-500 text-white'
                  : 'border-2 border-gray-300 dark:border-white/20'
              )}
            >
              {step.done ? (
                <Check className="w-3 h-3" />
              ) : i === steps.filter((s) => s.done).length ? (
                <Loader2 className="w-3 h-3 animate-spin text-[var(--purple)]" />
              ) : null}
            </div>
            <span
              className={cn(
                'text-sm transition-colors',
                step.done
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-white/30'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
