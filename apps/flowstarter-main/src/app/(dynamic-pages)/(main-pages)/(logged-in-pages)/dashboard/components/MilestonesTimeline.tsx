'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardMilestones } from '../hooks/useDashboardMilestones';
import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestonesTimelineProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
}

type StepStatus = 'active' | 'completed' | 'locked';

function StepCircle({ index, status }: { index: number; status: StepStatus }) {
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all duration-300',
        status === 'active'
          ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-[0_0_20px_rgba(77,93,217,0.4)] ring-[5px] ring-[var(--purple)]/15'
          : status === 'completed'
          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-400/20'
          : 'bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.10] text-gray-400 dark:text-white/30'
      )}
    >
      {status === 'completed' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : status === 'locked' ? (
        <Lock className="w-3.5 h-3.5" />
      ) : (
        <span>{index + 1}</span>
      )}
    </div>
  );
}

function StepLabel({ index, status }: { index: number; status: StepStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'text-[0.6rem] font-bold uppercase tracking-widest',
          status === 'active'
            ? 'text-[var(--purple)]'
            : status === 'completed'
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-gray-400 dark:text-white/30'
        )}
      >
        Step {index + 1}
      </span>
      {status === 'active' && (
        <span className="flex items-center gap-1 bg-[var(--purple)]/10 text-[var(--purple)] text-[0.55rem] font-semibold px-1.5 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-[var(--purple)] animate-pulse" />
          You are here
        </span>
      )}
    </div>
  );
}

function StepCard({
  index,
  title,
  desc,
  status,
  showDesc = false,
}: {
  index: number;
  title: string;
  desc: string;
  status: StepStatus;
  showDesc?: boolean;
}) {
  return (
    <div
      className={cn(
        'w-full p-4 rounded-xl transition-all duration-300',
        status === 'active'
          ? 'bg-white dark:bg-white/[0.07] border border-[var(--purple)]/25 dark:border-[var(--purple)]/30 shadow-[0_4px_24px_rgba(77,93,217,0.12)] ring-1 ring-[var(--purple)]/15'
          : status === 'completed'
          ? 'bg-emerald-50 dark:bg-emerald-500/[0.06] border border-emerald-200 dark:border-emerald-500/20'
          : 'bg-[var(--fs-bg-elevated)] border border-gray-200 dark:border-white/[0.07]'
      )}
    >
      <StepLabel index={index} status={status} />
      <h3
        className={cn(
          'text-sm font-semibold mt-0.5',
          status === 'locked'
            ? 'text-gray-400 dark:text-white/30'
            : 'text-[var(--fs-ink)]'
        )}
      >
        {title}
      </h3>
      {showDesc && (
        <p
          className={cn(
            'text-xs leading-snug mt-1',
            status === 'locked'
              ? 'text-gray-300 dark:text-white/20'
              : 'text-[var(--fs-ink-faint)]'
          )}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

export function MilestonesTimeline({
  hasAnyProject,
  hasLiveProject,
}: MilestonesTimelineProps) {
  const { t } = useTranslations();
  const { statuses } = useDashboardMilestones(hasAnyProject, hasLiveProject);

  const milestones = [
    {
      title: t('dashboard.stepper.strategy'),
      desc: t('dashboard.stepper.strategyDescription'),
      status: statuses[0] as StepStatus,
    },
    {
      title: t('dashboard.stepper.design'),
      desc: t('dashboard.stepper.designDescription'),
      status: statuses[1] as StepStatus,
    },
    {
      title: t('dashboard.stepper.development'),
      desc: t('dashboard.stepper.developmentDescription'),
      status: statuses[2] as StepStatus,
    },
    {
      title: t('dashboard.stepper.launch'),
      desc: t('dashboard.stepper.launchDescription'),
      status: statuses[3] as StepStatus,
    },
  ];

  const completedCount = milestones.filter(
    (m) => m.status === 'completed'
  ).length;

  return (
    <div className="mb-8">
      {/* ── Mobile: vertical timeline ── */}
      <div className="sm:hidden">
        <div className="relative pl-16">
          {/* Track */}
          <div className="absolute left-[19px] top-5 bottom-5 w-[2px] bg-gray-200 dark:bg-white/[0.06] rounded-full" />
          {/* Progress fill */}
          {completedCount > 0 && (
            <div
              className="absolute left-[19px] top-5 w-[2px] bg-gradient-to-b from-[var(--purple)] to-emerald-500 rounded-full transition-all duration-700"
              style={{
                height: `${(completedCount / (milestones.length - 1)) * 85}%`,
              }}
            />
          )}
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="relative flex items-center gap-3">
                <div className="absolute -left-16 z-10">
                  <StepCircle index={i} status={m.status} />
                </div>
                <StepCard
                  index={i}
                  title={m.title}
                  desc={m.desc}
                  status={m.status}
                  showDesc={m.status === 'active'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tablet: 2×2 grid ── */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3">
        {milestones.map((m, i) => (
          <div
            key={i}
            className={cn(
              'relative p-4 flex items-center gap-3 rounded-xl transition-all duration-300',
              m.status === 'active'
                ? 'bg-white dark:bg-white/[0.07] border border-[var(--purple)]/25 dark:border-[var(--purple)]/30 shadow-[0_4px_20px_rgba(77,93,217,0.12)]'
                : m.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-500/[0.06] border border-emerald-200 dark:border-emerald-500/20'
                : 'bg-[var(--fs-bg-elevated)] border border-gray-200 dark:border-white/[0.07]'
            )}
          >
            <StepCircle index={i} status={m.status} />
            <div className="flex-1 min-w-0">
              <StepLabel index={i} status={m.status} />
              <h3
                className={cn(
                  'text-sm font-semibold',
                  m.status === 'locked'
                    ? 'text-gray-400 dark:text-white/30'
                    : 'text-[var(--fs-ink)]'
                )}
              >
                {m.title}
              </h3>
              {m.status === 'active' && (
                <p className="text-xs text-[var(--fs-ink-faint)] leading-snug mt-0.5">
                  {m.desc}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: horizontal timeline ── */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Track */}
          <div className="absolute top-5 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-[2px] bg-gray-200 dark:bg-white/[0.06] rounded-full" />
          {completedCount > 0 && (
            <div
              className="absolute top-5 left-[calc(12.5%+24px)] h-[2px] bg-gradient-to-r from-[var(--purple)] to-emerald-500 rounded-full z-[1] transition-all duration-700"
              style={{
                width: `${(completedCount / (milestones.length - 1)) * 75}%`,
              }}
            />
          )}
          <div className="relative z-[2] grid grid-cols-4 gap-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="mb-3">
                  <StepCircle index={i} status={m.status} />
                </div>
                <StepCard
                  index={i}
                  title={m.title}
                  desc={m.desc}
                  status={m.status}
                  showDesc
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
