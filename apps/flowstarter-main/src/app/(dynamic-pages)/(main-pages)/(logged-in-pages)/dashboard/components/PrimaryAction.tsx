'use client';

import { useTranslations } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { GlassCard } from '@flowstarter/flow-design-system';
import {
  Sparkles, MessageSquarePlus, Upload, ArrowRight,
} from 'lucide-react';

interface PrimaryActionProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
}

export function PrimaryAction({ hasAnyProject, hasLiveProject }: PrimaryActionProps) {
  const { t } = useTranslations();

  if (!hasAnyProject) {
    return (
      <GlassCard noHover className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
              {t('dashboard.action.kickoffTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50">
              {t('dashboard.action.kickoffDesc')}
            </p>
          </div>
          <a
            href={EXTERNAL_URLS.calendly.discovery}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02] whitespace-nowrap"
          >
            {t('dashboard.stepper.bookCallButton')}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </GlassCard>
    );
  }

  if (hasLiveProject) {
    return (
      <GlassCard noHover className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
            <MessageSquarePlus className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
              {t('dashboard.action.requestChange')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50">
              {t('dashboard.action.requestChangeSub')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-all">
              <Upload className="w-4 h-4" />
              {t('dashboard.action.uploadAssets')}
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02]">
              {t('dashboard.action.requestChange')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Building phase
  return (
    <GlassCard noHover className="mb-8 ring-1 ring-[var(--purple)]/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
            {t('dashboard.stats.buildPhase')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            {t('dashboard.stats.currentMilestone', { phase: t('dashboard.stepper.design') })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-4 py-2.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t('dashboard.stats.buildPhaseActive')}
          </span>
          <a
            href={EXTERNAL_URLS.calendly.checkIn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-all whitespace-nowrap"
          >
            {t('sidebar.scheduleCheckin')}
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
