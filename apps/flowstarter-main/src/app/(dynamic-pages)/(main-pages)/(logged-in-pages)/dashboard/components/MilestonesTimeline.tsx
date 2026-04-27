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
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200',
        status === 'active'
          ? 'bg-[var(--fs-accent)] text-white ring-2 ring-[var(--fs-accent-ring)]'
          : status === 'completed'
          ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
          : 'border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-faint)]'
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
          'text-[0.62rem] font-semibold uppercase tracking-wide',
          status === 'active'
            ? 'text-[var(--fs-accent)]'
            : status === 'completed'
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-[var(--fs-ink-faint)]'
        )}
      >
        Step {index + 1}
      </span>
      {status === 'active' && (
        <span className="flex items-center gap-1 rounded-md border border-[var(--fs-rule-accent)] bg-[var(--fs-accent-bg)] px-1.5 py-0.5 text-[0.55rem] font-semibold text-[var(--fs-accent)]">
          <span className="h-1 w-1 rounded-full bg-[var(--fs-accent)]" />
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
        'w-full rounded-lg border p-4 transition-all duration-200',
        status === 'active'
          ? 'bg-[var(--fs-glass-bg)] border-[var(--fs-rule-accent)]'
          : status === 'completed'
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'bg-[var(--fs-bg-elevated)] border-[var(--fs-rule)]'
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
              ? 'text-[var(--fs-ink-disabled)]'
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
          <div className="absolute left-[19px] top-5 bottom-5 w-[2px] rounded-full bg-[var(--fs-rule)]" />
          {/* Progress fill */}
          {completedCount > 0 && (
            <div
              className="absolute left-[19px] top-5 w-[2px] rounded-full bg-gradient-to-b from-[var(--fs-accent)] to-emerald-500 transition-all duration-500"
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
              'relative flex items-center gap-3 rounded-lg border p-4 transition-all duration-200',
              m.status === 'active'
                ? 'bg-[var(--fs-glass-bg)] border-[var(--fs-rule-accent)]'
                : m.status === 'completed'
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'bg-[var(--fs-bg-elevated)] border-[var(--fs-rule)]'
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
          <div className="absolute top-5 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-[2px] rounded-full bg-[var(--fs-rule)]" />
          {completedCount > 0 && (
            <div
              className="absolute top-5 left-[calc(12.5%+24px)] z-[1] h-[2px] rounded-full bg-gradient-to-r from-[var(--fs-accent)] to-emerald-500 transition-all duration-500"
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
