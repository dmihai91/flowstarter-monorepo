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
      <div
        className="mb-6 overflow-hidden rounded-xl border"
        style={{
          background: 'var(--fs-glass-bg)',
          borderColor: 'var(--fs-rule-accent)',
          boxShadow: 'var(--fs-card-shadow)',
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--fs-accent)] text-white shadow-sm">
              <CalendarClock className="w-6 h-6 text-white" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--fs-ink)] leading-tight">
                  {t('dashboard.action.kickoffTitle')}
                </h3>
                <span className="rounded-md border border-[var(--fs-rule-accent)] bg-[var(--fs-accent-bg)] px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-[var(--fs-accent)]">
                  Next step
                </span>
              </div>
              <p className="text-sm text-[var(--fs-ink-dim)] leading-relaxed">
                {t('dashboard.action.kickoffDesc')}
              </p>
            </div>
            <button
              onClick={onBookCall}
              className="shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[var(--fs-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
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
      <div
        className="mb-6 rounded-xl border p-5 sm:p-6"
        style={{
          background: 'var(--fs-glass-bg)',
          borderColor: 'var(--fs-glass-edge)',
          boxShadow: 'var(--fs-card-shadow)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--fs-accent-bg)] text-[var(--fs-accent)]">
            <MessageSquarePlus className="h-6 w-6 text-[var(--fs-accent)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--fs-ink)] mb-0.5">
              {t('dashboard.action.requestChange')}
            </h3>
            <p className="text-sm text-[var(--fs-ink-faint)]">
              {t('dashboard.action.requestChangeSub')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--fs-ink-dim)] transition-colors hover:bg-[var(--fs-bg-overlay)]">
              <Upload className="w-4 h-4" />
              {t('dashboard.action.uploadAssets')}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--fs-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90">
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
    <div
      className="mb-6 rounded-xl border p-5 sm:p-6"
      style={{
        background: 'var(--fs-glass-bg)',
        borderColor: 'var(--fs-rule-accent)',
        boxShadow: 'var(--fs-card-shadow)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--fs-accent)] text-white shadow-sm">
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--fs-ink)] mb-0.5">
            {t('dashboard.stats.buildPhase')}
          </h3>
          <p className="text-sm text-[var(--fs-ink-faint)]">
            {t('dashboard.stats.currentMilestone', {
              phase: t('dashboard.stepper.design'),
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {t('dashboard.stats.buildPhaseActive')}
          </span>
          <a
            href={EXTERNAL_URLS.calendly.checkIn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--fs-ink-dim)] transition-colors hover:bg-[var(--fs-bg-overlay)]"
          >
            {t('sidebar.scheduleCheckin')}
          </a>
        </div>
      </div>
    </div>
  );
}
