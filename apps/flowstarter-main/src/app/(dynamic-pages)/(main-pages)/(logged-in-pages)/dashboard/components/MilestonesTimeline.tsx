'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardMilestones } from '../hooks/useDashboardMilestones';
import { Compass, Palette, Code2, Rocket, CheckCircle2, Lock } from 'lucide-react';

interface MilestonesTimelineProps {
  hasAnyProject: boolean;
  hasLiveProject: boolean;
}

export function MilestonesTimeline({ hasAnyProject, hasLiveProject }: MilestonesTimelineProps) {
  const { t } = useTranslations();
  const { statuses } = useDashboardMilestones(hasAnyProject, hasLiveProject);

  const milestones = [
    { icon: Compass, title: t('dashboard.stepper.strategy'),    desc: t('dashboard.stepper.strategyDescription'),    status: statuses[0] },
    { icon: Palette, title: t('dashboard.stepper.design'),      desc: t('dashboard.stepper.designDescription'),      status: statuses[1] },
    { icon: Code2,   title: t('dashboard.stepper.development'), desc: t('dashboard.stepper.developmentDescription'), status: statuses[2] },
    { icon: Rocket,  title: t('dashboard.stepper.launch'),      desc: t('dashboard.stepper.launchDescription'),      status: statuses[3] },
  ];

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  return (
    <div className="mb-8">
      {/* ── Mobile: vertical timeline (Nixon-style) ── */}
      <div className="sm:hidden">
        <div className="relative pl-8">
          {/* Vertical connector line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-white/[0.06] dark:bg-white/[0.06] rounded-full" />
          {/* Completed fill */}
          {completedCount > 0 && (
            <div
              className="absolute left-[15px] top-3 w-[2px] bg-gradient-to-b from-[var(--purple)] to-emerald-500 rounded-full transition-all duration-700"
              style={{ height: `${(completedCount / (milestones.length - 1)) * 85}%` }}
            />
          )}

          <div className="space-y-3">
            {milestones.map((m, i) => {
              const isActive = m.status === 'active';
              const isCompleted = m.status === 'completed';
              const isLocked = m.status === 'locked';
              const Icon = m.icon;

              return (
                <div key={i} className="relative flex items-center gap-3">
                  {/* Step circle */}
                  <div className={`
                    absolute -left-8 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-lg shadow-[var(--purple)]/40 ring-4 ring-[var(--purple)]/20'
                      : isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 ring-3 ring-emerald-400/20'
                      : 'bg-white/[0.04] border border-white/10 text-white/20'}
                  `}>
                    {isActive
                      ? <span className="text-xs font-bold">{i + 1}</span>
                      : isCompleted
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <Lock className="w-3 h-3" />
                    }
                  </div>

                  {/* Card */}
                  <div className={`
                    flex-1 p-3.5 rounded-xl transition-all duration-300
                    ${isActive
                      ? 'bg-white/[0.07] border border-[var(--purple)]/30 shadow-[0_4px_20px_rgba(77,93,217,0.15)] ring-1 ring-[var(--purple)]/20'
                      : isCompleted
                      ? 'bg-emerald-500/[0.06] border border-emerald-500/20'
                      : 'bg-white/[0.02] border border-white/[0.05] opacity-50'}
                  `}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${
                        isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-emerald-400' : 'text-white/30'
                      }`}>Step {i + 1}</span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[0.6rem] font-semibold text-[var(--purple)] bg-[var(--purple)]/10 px-1.5 py-0.5 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-[var(--purple)] animate-pulse" />
                          Current
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold mt-0.5 ${isLocked ? 'text-white/30' : 'text-white'}`}>{m.title}</h3>
                    {isActive && <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{m.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tablet: 2×2 grid ── */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3">
        {milestones.map((m, i) => {
          const isActive = m.status === 'active';
          const isCompleted = m.status === 'completed';
          const isLocked = m.status === 'locked';
          const Icon = m.icon;
          return (
            <div key={i} className={`
              relative p-4 flex items-center gap-3 rounded-xl transition-all duration-300
              ${isActive
                ? 'bg-white/[0.07] border border-[var(--purple)]/30 shadow-[0_4px_20px_rgba(77,93,217,0.15)]'
                : isCompleted
                ? 'bg-emerald-500/[0.06] border border-emerald-500/20'
                : 'bg-white/[0.02] border border-white/[0.05] opacity-50'}
            `}>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all
                ${isActive
                  ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-lg shadow-[var(--purple)]/40 ring-4 ring-[var(--purple)]/20'
                  : isCompleted
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white/[0.04] border border-white/10 text-white/20'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${
                    isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-emerald-400' : 'text-white/30'
                  }`}>Step {i + 1}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)] animate-pulse" />}
                </div>
                <h3 className={`text-sm font-semibold ${isLocked ? 'text-white/30' : 'text-white'}`}>{m.title}</h3>
                {isActive && <p className="text-xs text-white/50 leading-snug mt-0.5">{m.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: horizontal timeline (Nixon-style) ── */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Background track */}
          <div className="absolute top-[19px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-white/[0.06] rounded-full" />
          {/* Progress fill */}
          {completedCount > 0 && (
            <div
              className="absolute top-[19px] left-[calc(12.5%+20px)] h-[2px] bg-gradient-to-r from-[var(--purple)] to-emerald-500 rounded-full z-[1] transition-all duration-700"
              style={{ width: `${(completedCount / (milestones.length - 1)) * 75}%` }}
            />
          )}

          <div className="relative z-[2] grid grid-cols-4 w-full gap-3">
            {milestones.map((m, i) => {
              const isActive = m.status === 'active';
              const isCompleted = m.status === 'completed';
              const isLocked = m.status === 'locked';
              const Icon = m.icon;

              return (
                <div key={i} className="flex flex-col items-center">
                  {/* Circle */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-3 text-sm font-bold transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-[0_0_20px_rgba(77,93,217,0.5)] ring-[6px] ring-[var(--purple)]/15'
                      : isCompleted
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-400/20'
                      : 'bg-white/[0.04] border border-white/10 text-white/20'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : i + 1}
                  </div>

                  {/* Card */}
                  <div className={`
                    w-full p-4 rounded-xl text-center transition-all duration-300
                    ${isActive
                      ? 'bg-white/[0.07] border border-[var(--purple)]/30 shadow-[0_4px_24px_rgba(77,93,217,0.2)] ring-1 ring-[var(--purple)]/20'
                      : isCompleted
                      ? 'bg-emerald-500/[0.06] border border-emerald-500/20'
                      : 'bg-white/[0.02] border border-white/[0.05] opacity-40'}
                  `}>
                    <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${
                      isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-emerald-400' : 'text-white/30'
                    }`}>Step {i + 1}</span>
                    {isActive && (
                      <div className="flex items-center justify-center gap-1 mt-0.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)] animate-pulse" />
                        <span className="text-[0.6rem] text-[var(--purple)] font-semibold">You are here</span>
                      </div>
                    )}
                    <h3 className={`text-sm font-semibold mt-0.5 ${isLocked ? 'text-white/30' : 'text-white'}`}>{m.title}</h3>
                    <p className={`text-xs leading-snug mt-1 ${isLocked ? 'text-white/20' : 'text-white/50'}`}>{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
