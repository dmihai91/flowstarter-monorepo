'use client';

import { useTranslations } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants';
import { Sparkles, MessageSquarePlus, Upload, ArrowRight, CalendarClock } from 'lucide-react';

interface PrimaryActionProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
}

export function PrimaryAction({ hasAnyProject, hasLiveProject }: PrimaryActionProps) {
  const { t } = useTranslations();

  // No project yet — elevated book call CTA
  if (!hasAnyProject) {
    return (
      <div className="mb-6 p-[1px] rounded-2xl bg-gradient-to-r from-[var(--purple)] via-blue-500 to-cyan-500 shadow-[0_8px_32px_rgba(77,93,217,0.25)]">
        <div className="bg-white/[0.06] backdrop-blur-sm rounded-[calc(16px-1px)] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/30">
              <CalendarClock className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--purple)] border-2 border-[#0a0810] animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-semibold text-white">
                  {t('dashboard.action.kickoffTitle')}
                </h3>
                <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--purple)] bg-[var(--purple)]/15 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[var(--purple)] animate-pulse" />
                  Step 1
                </span>
              </div>
              <p className="text-sm text-white/50">{t('dashboard.action.kickoffDesc')}</p>
              <p className="text-xs text-white/30 mt-0.5">45 minutes — free, no commitment</p>
            </div>
            <a
              href={EXTERNAL_URLS.calendly.discovery}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--purple)] to-blue-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/30 hover:scale-[1.02] whitespace-nowrap"
            >
              {t('dashboard.stepper.bookCallButton')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasLiveProject) {
    return (
      <div className="mb-6 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
            <MessageSquarePlus className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-0.5">{t('dashboard.action.requestChange')}</h3>
            <p className="text-sm text-white/50">{t('dashboard.action.requestChangeSub')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] text-white text-sm font-medium hover:bg-white/[0.10] transition-all border border-white/[0.06]">
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
    <div className="mb-6 bg-white/[0.04] border border-[var(--purple)]/20 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0a0810] animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white mb-0.5">{t('dashboard.stats.buildPhase')}</h3>
          <p className="text-sm text-white/50">{t('dashboard.stats.currentMilestone', { phase: t('dashboard.stepper.design') })}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t('dashboard.stats.buildPhaseActive')}
          </span>
          <a
            href={EXTERNAL_URLS.calendly.checkIn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] text-white text-sm font-medium hover:bg-white/[0.10] transition-all border border-white/[0.06] whitespace-nowrap"
          >
            {t('sidebar.scheduleCheckin')}
          </a>
        </div>
      </div>
    </div>
  );
}
