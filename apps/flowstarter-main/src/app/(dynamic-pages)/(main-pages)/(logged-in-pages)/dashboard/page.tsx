'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUser } from '@clerk/nextjs';
import { DashboardInit } from './components/DashboardInit';
import { DashboardMessages } from './components/DashboardMessages';
import { DashboardStatsClientFetcher } from './components/DashboardStatsClientFetcher';
import { DashboardWrapper } from './components/DashboardWrapper';
import { 
  Compass, Palette, Code2, Rocket, 
  CheckCircle2, Lock, ArrowRight,
  Sparkles, MessageSquarePlus, Upload
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

const glassCard = 'rounded-2xl border border-transparent bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_4px_16px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]';

type MilestoneStatus = 'completed' | 'active' | 'locked';

function getMilestoneStatuses(hasAnyProject: boolean, hasLiveProject: boolean): [MilestoneStatus, MilestoneStatus, MilestoneStatus, MilestoneStatus] {
  if (hasLiveProject) return ['completed', 'completed', 'completed', 'completed'];
  if (hasAnyProject) return ['completed', 'active', 'locked', 'locked'];
  return ['active', 'locked', 'locked', 'locked'];
}

function getTimeGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  if (hour >= 18 && hour < 22) return 'dashboard.greeting.evening';
  return 'dashboard.greeting.night';
}

/* ─── Milestones Timeline ─── */
function MilestonesTimeline({ hasAnyProject, hasLiveProject }: { hasAnyProject: boolean; hasLiveProject: boolean }) {
  const { t } = useTranslations();
  const statuses = getMilestoneStatuses(hasAnyProject, hasLiveProject);

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
                ? 'bg-white/70 dark:bg-white/[0.05] ring-1 ring-[var(--purple)]/20 shadow-[0_4px_16px_rgba(77,93,217,0.1)]' 
                : isCompleted 
                ? 'bg-white/60 dark:bg-white/[0.04] ring-1 ring-green-500/15 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
                : 'bg-white/40 dark:bg-white/[0.025] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'}
            `}>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${isActive 
                  ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-md shadow-[var(--purple)]/25' 
                  : isCompleted 
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/15 text-gray-400 dark:text-white/30'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40'
                }`}>
                  {t('dashboard.stepper.milestone', { number: i + 1 })}
                </span>
                <h3 className={`text-sm font-semibold ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                  {m.title}
                </h3>
                <p className={`text-[11px] leading-snug text-gray-500 dark:text-white/50 ${isLocked ? 'opacity-60' : ''}`}>
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
          {/* Background line */}
          <div className="absolute top-5 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-gray-200/80 dark:bg-white/10 rounded-full" />
          {/* Completed progress line */}
          {milestones.filter(m => m.status === 'completed').length > 0 && (
            <div 
              className="absolute top-5 left-[calc(12.5%+16px)] h-[2px] bg-gradient-to-r from-green-400 to-green-400/60 rounded-full z-[1] transition-all duration-700"
              style={{ width: `${(milestones.filter(m => m.status === 'completed').length / milestones.length) * 75}%` }}
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
                      ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white shadow-lg shadow-[var(--purple)]/30 ring-4 ring-[var(--purple)]/10' 
                      : isCompleted 
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/15 text-gray-400 dark:text-white/30'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className={`
                    w-full max-w-[180px] p-3 rounded-xl text-center transition-all duration-300
                    ${isActive 
                      ? 'bg-white/70 dark:bg-white/[0.05] ring-1 ring-[var(--purple)]/20 shadow-[0_4px_16px_rgba(77,93,217,0.1)]' 
                      : isCompleted 
                      ? 'bg-white/60 dark:bg-white/[0.04] ring-1 ring-green-500/15 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
                      : 'bg-white/40 dark:bg-white/[0.025] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1)]'}
                  `}>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isActive ? 'text-[var(--purple)]' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40'
                    }`}>
                      {t('dashboard.stepper.milestone', { number: i + 1 })}
                    </span>
                    <h3 className={`text-sm font-semibold mt-0.5 ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                      {m.title}
                    </h3>
                    <p className={`text-[11px] leading-snug mt-0.5 ${isLocked ? 'text-gray-400 dark:text-white/30' : 'text-gray-500 dark:text-white/50'}`}>
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
      <div className="sm:hidden space-y-2">
        {milestones.map((m, i) => {
          const isActive = m.status === 'active';
          const isCompleted = m.status === 'completed';
          const isLocked = m.status === 'locked';
          const Icon = m.icon;

          return (
            <div key={i} className={`
              flex items-center gap-3 p-3 rounded-xl transition-all
              ${isActive 
                ? 'bg-white/70 dark:bg-white/[0.05] ring-1 ring-[var(--purple)]/30' 
                : isCompleted 
                ? 'bg-white/40 dark:bg-white/[0.02]'
                : 'opacity-40'}
            `}>
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                ${isActive 
                  ? 'bg-gradient-to-br from-[var(--purple)] to-blue-500 text-white' 
                  : isCompleted 
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${isLocked ? 'text-gray-400 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                  {m.title}
                </h3>
                <p className={`text-[11px] ${isLocked ? 'text-gray-400 dark:text-white/30' : 'text-gray-500 dark:text-white/50'}`}>
                  {m.desc}
                </p>
              </div>
              {isActive && (
                <span className="text-[10px] font-semibold text-[var(--purple)] bg-[var(--purple)]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
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

/* ─── Primary Action Banner ─── */
function PrimaryAction({ hasAnyProject, hasLiveProject }: { hasAnyProject: boolean; hasLiveProject: boolean }) {
  const { t } = useTranslations();

  if (!hasAnyProject) {
    return (
      <div className={`${glassCard} p-5 sm:p-6 mb-8`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--purple)]/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
              Ready to stand out online?
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/50">
              Book a free discovery call. We'll map your goals and build a site that works for your business.
            </p>
          </div>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02] whitespace-nowrap"
          >
            {t('dashboard.stepper.bookCallButton')}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (hasLiveProject) {
    return (
      <div className={`${glassCard} p-5 sm:p-6 mb-8`}>
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
      </div>
    );
  }

  // Building phase - active, not passive
  return (
    <div className={`${glassCard} p-5 sm:p-6 mb-8 ring-1 ring-[var(--purple)]/20`}>
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
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t('dashboard.stats.buildPhaseActive')}
          </span>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-all whitespace-nowrap"
          >
            Schedule Check-in
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Greeting */}
      <div className="mt-4 mb-6">
        <div className="h-3.5 w-36 bg-gray-200 dark:bg-white/10 rounded-lg mb-2" />
        <div className="h-7 w-44 bg-gray-200 dark:bg-white/10 rounded-lg" />
      </div>

      {/* Milestones - mobile */}
      <div className="sm:hidden space-y-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 w-20 bg-gray-200 dark:bg-white/10 rounded mb-1.5" />
              <div className="h-2.5 w-36 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Milestones - tablet: 2x2 grid */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/30 dark:bg-white/[0.015]">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-2.5 w-10 bg-gray-200 dark:bg-white/10 rounded mb-1" />
              <div className="h-3.5 w-20 bg-gray-200 dark:bg-white/10 rounded mb-1" />
              <div className="h-2.5 w-32 bg-gray-100 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Milestones - desktop: timeline with nodes */}
      <div className="hidden lg:block mb-8">
        <div className="relative flex items-start">
          <div className="absolute top-5 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-gray-200/60 dark:bg-white/5 rounded-full" />
          <div className="relative z-[2] grid grid-cols-4 w-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 mb-3" />
                <div className="w-full max-w-[180px] p-3 rounded-xl bg-white/30 dark:bg-white/[0.015] flex flex-col items-center">
                  <div className="h-2.5 w-10 bg-gray-200 dark:bg-white/10 rounded mb-1" />
                  <div className="h-3.5 w-16 bg-gray-200 dark:bg-white/10 rounded mb-1" />
                  <div className="h-2.5 w-28 bg-gray-100 dark:bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Banner */}
      <div className={`${glassCard} p-5 mb-8`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/10 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-44 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-64 bg-gray-100 dark:bg-white/5 rounded" />
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-white/10 rounded-xl hidden sm:block" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`p-5 min-h-[140px] ${glassCard}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-36 bg-gray-100 dark:bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { t } = useTranslations();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data, isLoading } = useDashboardStats();

  const loading = !isUserLoaded || isLoading;

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = t(getTimeGreetingKey(hour));

  const hasAnyProject = (data?.totalProjects ?? 0) > 0;
  const hasLiveProject = (data?.liveProjects ?? 0) > 0;

  return (
    <DashboardWrapper>
      {loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DashboardMessages />

        <DashboardInit>
          {/* Greeting */}
          <div className="mt-4 sm:mt-6 mb-6">
            <p className="text-sm sm:text-base text-gray-500 dark:text-white/50 mb-1">
              {greeting},{' '}
              <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
          </div>

          {/* Milestones Timeline */}
          <MilestonesTimeline hasAnyProject={hasAnyProject} hasLiveProject={hasLiveProject} />

          {/* Primary Action Banner */}
          <PrimaryAction hasAnyProject={hasAnyProject} hasLiveProject={hasLiveProject} />

          {/* Stats */}
          <div className="mb-8">
            <DashboardStatsClientFetcher />
          </div>
        </DashboardInit>
      </div>
      )}
    </DashboardWrapper>
  );
}
