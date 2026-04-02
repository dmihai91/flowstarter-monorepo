'use client';

import { useTranslations } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import {
  Sparkles,
  MessageSquarePlus,
  Upload,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';

interface PrimaryActionProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
  onBookCall?: () => void;
}

export function PrimaryAction({
  hasAnyProject,
  hasLiveProject,
  onBookCall,
}: PrimaryActionProps) {
  const { t } = useTranslations();

  // No project yet — book call CTA
  if (!hasAnyProject) {
    return (
      <div className="mb-6 relative rounded-2xl overflow-hidden border border-[var(--purple)]/30 bg-[var(--purple)]/[0.06] dark:bg-[var(--purple)]/[0.06] shadow-[0_0_30px_rgba(77,93,217,0.10)]">
        {/* Subtle purple glow strip at top */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--purple)]/60 to-transparent" />
        <div className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/30">
              <CalendarClock className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--purple)] ring-2 ring-[var(--purple)]/20 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[0.9375rem] font-semibold text-gray-900 dark:text-white leading-tight">
                  {t('dashboard.action.kickoffTitle')}
                </h3>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--purple)] bg-[var(--purple)]/15 px-2 py-0.5 rounded-full">
                  Next step
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/60 leading-relaxed">
                {t('dashboard.action.kickoffDesc')}
              </p>
            </div>
            <button
              onClick={onBookCall}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold transition-all hover:bg-[var(--purple)]/90 hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02] whitespace-nowrap"
            >
              {t('dashboard.stepper.bookCallButton')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasLiveProject) {
    return (
      <div className="mb-6 bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-2xl p-5">
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
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/[0.10] transition-all border border-gray-200 dark:border-white/[0.06]">
              <Upload className="w-4 h-4" />
              {t('dashboard.action.uploadAssets')}
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--purple)] to-blue-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02]">
              {t('dashboard.action.requestChange')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Building phase
  return (
    <div className="mb-6 bg-gray-50 dark:bg-white/[0.04] border border-[var(--purple)]/20 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
            {t('dashboard.stats.buildPhase')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            {t('dashboard.stats.currentMilestone', {
              phase: t('dashboard.stepper.design'),
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t('dashboard.stats.buildPhaseActive')}
          </span>
          <a
            href={EXTERNAL_URLS.calendly.checkIn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/[0.10] transition-all border border-gray-200 dark:border-white/[0.06] whitespace-nowrap"
          >
            {t('sidebar.scheduleCheckin')}
          </a>
        </div>
      </div>
    </div>
  );
}
