'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardMilestones, type MilestoneStatus } from '../hooks/useDashboardMilestones';
import {
  Compass, Palette, Code2, Rocket,
  CheckCircle2, Lock,
} from 'lucide-react';

interface MilestonesTimelineProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
}

export function MilestonesTimeline({ hasAnyProject, hasLiveProject }: MilestonesTimelineProps) {
  const { t } = useTranslations();
  const { statuses } = useDashboardMilestones(hasAnyProject, hasLiveProject);

  const milestones = [
    { icon: Compass,  title: t('dashboard.stepper.strategy'),    desc: t('dashboard.stepper.strategyDescription'),    status: statuses[0] },
    { icon: Palette,  title: t('dashboard.stepper.design'),      desc: t('dashboard.stepper.designDescription'),      status: statuses[1] },
    { icon: Code2,    title: t('dashboard.stepper.development'), desc: t('dashboard.stepper.developmentDescription'), status: statuses[2] },
    { icon: Rocket,   title: t('dashboard.stepper.launch'),      desc: t('dashboard.stepper.launchDescription'),      status: statuses[3] },
  ];

  return (
    <div className="mb-8">
      {/* Tablet: 2x2 grid */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4">
        {milestones.map((m, i) => {
          const isActive = m.status === 'active';
          const isCompleted = m.status === 'completed';
          const isLocked = m.status === 'locked';
          const Icon = m.icon;
          return (
            <div key={i} className={`
              relative p-4 flex items-center gap-3 transition-all duration-300 rounded-xl
              ${isActive
                ? 'bg-white/80 dark:bg-white/[0.06] ring-2 ring-[var(--purple)]/30 shadow-[0_4px_20px_rgba(77,93,217,0.15)]'
                : isCompleted
                ? 'bg-green-50/90 dark:bg-green-500/[0.08] ring-1 ring-green-500/40 shadow-[0_4px_16px_rgba(34,197,94,0.15)]'
                : 'bg-white/50 dark:bg-white/[0.03] ring-1 ring-gray-200/40 dark:ring-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'}
            `}>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${isActive
                  ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-md shadow-[var(--purple)]/25 ring-4 ring-[var(--purple)]/15 animate-pulse'
                  : isCompleted
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 ring-4 ring-green-400/20'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/15 text-gray-400 dark:text-white/30'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[0.625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-wider ${
                  isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40'
                }`}>
                  {t('dashboard.stepper.milestone', { number: i + 1 })}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className={`text-[0.9375rem] font-semibold ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                    {m.title}
                  </h3>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                      ✓ {t('dashboard.stepper.done')}
                    </span>
                  )}
                </div>
                <p className={`text-[0.6875rem] sm:text-xs leading-snug text-gray-500 dark:text-white/50 ${isLocked ? 'opacity-60' : ''}`}>
                  {m.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal timeline */}
      <div className="hidden lg:block">
        <div className="relative flex items-start">
          {/* Background line — spans from center of first circle to center of last */}
          <div className="absolute top-5 left-[12.5%] right-[12.5%] h-[2px] bg-gray-200/80 dark:bg-white/10 rounded-full" />
          {/* Completed progress line */}
          {milestones.filter(m => m.status === 'completed').length > 0 && (
            <div
              className="absolute top-5 left-[12.5%] h-[2px] bg-gradient-to-r from-green-400 to-green-400/60 rounded-full z-[1] transition-all duration-700"
              style={{ width: `${(milestones.filter(m => m.status === 'completed').length / (milestones.length - 1)) * 75}%` }}
            />
          )}

          {/* Steps */}
          <div className="relative z-[2] grid grid-cols-4 w-full">
            {milestones.map((m, i) => {
              const isActive = m.status === 'active';
              const isCompleted = m.status === 'completed';
              const isLocked = m.status === 'locked';
              const Icon = m.icon;

              return (
                <div key={i} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-lg shadow-[var(--purple)]/30 ring-[5px] ring-[var(--purple)]/15 animate-pulse'
                      : isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 ring-4 ring-green-400/20'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/15 text-gray-400 dark:text-white/30'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className={`
                    w-full max-w-[180px] p-3 rounded-xl text-center transition-all duration-300
                    ${isActive
                      ? 'bg-white/80 dark:bg-white/[0.06] ring-2 ring-[var(--purple)]/30 shadow-[0_4px_20px_rgba(77,93,217,0.15)]'
                      : isCompleted
                      ? 'bg-green-50/90 dark:bg-green-500/[0.08] ring-1 ring-green-500/40 shadow-[0_4px_16px_rgba(34,197,94,0.15)]'
                      : 'bg-white/50 dark:bg-white/[0.03] ring-1 ring-gray-200/40 dark:ring-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'}
                  `}>
                    <span className={`text-[0.625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-wider ${
                      isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40'
                    }`}>
                      {t('dashboard.stepper.milestone', { number: i + 1 })}
                    </span>
                    <h3 className={`text-sm font-semibold mt-0.5 ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                      {m.title}
                    </h3>
                    <p className={`text-[0.6875rem] sm:text-xs leading-snug mt-0.5 ${isLocked ? 'text-gray-400 dark:text-white/30' : 'text-gray-500 dark:text-white/50'}`}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical compact list */}
      <div className="sm:hidden space-y-3">
        {milestones.map((m, i) => {
          const isActive = m.status === 'active';
          const isCompleted = m.status === 'completed';
          const isLocked = m.status === 'locked';
          const Icon = m.icon;

          return (
            <div key={i} className={`
              flex items-center gap-4 p-4 rounded-xl transition-all
              ${isActive
                ? 'bg-white/80 dark:bg-white/[0.06] ring-2 ring-[var(--purple)]/30 shadow-[0_4px_16px_rgba(77,93,217,0.12)]'
                : isCompleted
                ? 'bg-green-50/90 dark:bg-green-500/[0.08] ring-1 ring-green-500/40 shadow-[0_4px_12px_rgba(34,197,94,0.1)]'
                : 'bg-white/50 dark:bg-white/[0.03] ring-1 ring-gray-200/40 dark:ring-white/5'}
            `}>
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                ${isActive
                  ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-md shadow-[var(--purple)]/25 ring-3 ring-[var(--purple)]/15 animate-pulse'
                  : isCompleted
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/25 ring-3 ring-green-400/15'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/15 text-gray-400 dark:text-white/30'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-[0.9375rem] font-semibold ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                    {m.title}
                  </h3>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                      ✓ {t('dashboard.stepper.done')}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isLocked ? 'text-gray-400 dark:text-white/30' : 'text-gray-500 dark:text-white/50'}`}>
                  {m.desc}
                </p>
              </div>
              {isActive && (
                <span className="text-[0.625rem] font-semibold text-[var(--purple)] bg-[var(--purple)]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Current
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
