'use client';

import { useTranslations } from '@/lib/i18n';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUser } from '@clerk/nextjs';
import { DashboardInit } from './components/DashboardInit';
import { DashboardMessages } from './components/DashboardMessages';
import { DashboardStatsClientFetcher } from './components/DashboardStatsClientFetcher';
import { DashboardWrapper } from './components/DashboardWrapper';
import { Calendar, Sparkles, Globe, Lock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

// Glassmorphism card style - shared with team dashboard
const glassCard = 'rounded-2xl border border-transparent bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_4px_16px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]';

type StepStatus = 'completed' | 'active' | 'locked';

function getStepStatuses(hasAnyProject: boolean, hasLiveProject: boolean): [StepStatus, StepStatus, StepStatus] {
  if (hasLiveProject) return ['completed', 'completed', 'active'];
  if (hasAnyProject) return ['completed', 'active', 'locked'];
  return ['active', 'locked', 'locked'];
}

function getTimeGreetingKey(hour: number): string {
  // 5-11: morning, 12-17: afternoon, 18-21: evening, 22-4: night
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  if (hour >= 18 && hour < 22) return 'dashboard.greeting.evening';
  return 'dashboard.greeting.night';
}

function OnboardingStepper({ hasAnyProject, hasLiveProject }: { hasAnyProject: boolean; hasLiveProject: boolean }) {
  const { t } = useTranslations();
  const statuses = getStepStatuses(hasAnyProject, hasLiveProject);

  const steps = [
    {
      number: 1,
      title: t('dashboard.stepper.bookCall'),
      description: t('dashboard.stepper.bookCallDescription'),
      icon: Calendar,
      status: statuses[0],
    },
    {
      number: 2,
      title: t('dashboard.stepper.weBuild'),
      description: t('dashboard.stepper.weBuildDescription'),
      icon: Sparkles,
      status: statuses[1],
    },
    {
      number: 3,
      title: t('dashboard.stepper.goLive'),
      description: t('dashboard.stepper.goLiveDescription'),
      icon: Globe,
      status: statuses[2],
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === 'active');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      {steps.map((step, index) => {
        const isActive = step.status === 'active';
        const isCompleted = step.status === 'completed';
        const isLocked = step.status === 'locked';
        const isPast = index < currentStepIndex;

        return (
          <div
            key={step.number}
            className={`
              relative p-5 h-full flex flex-col transition-all duration-300
              rounded-2xl backdrop-blur-2xl
              ${isActive 
                ? 'bg-white/70 dark:bg-white/[0.05] ring-2 ring-[var(--purple)]/40 shadow-[0_8px_32px_rgba(77,93,217,0.15),0_2px_8px_rgba(77,93,217,0.08)]' 
                : isCompleted || isPast
                ? 'bg-white/60 dark:bg-white/[0.03] ring-1 ring-green-500/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                : `${glassCard} opacity-60`}
            `}
          >
            {/* Step badge */}
            <span
              className={`
              inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-3
              ${
                isActive
                  ? 'bg-[var(--purple)] text-white'
                  : isCompleted || isPast
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50'
              }
            `}
            >
              {t('dashboard.stepper.step', { number: step.number })}
            </span>

            <div className="flex items-start gap-3 mb-3">
              <div
                className={`
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${
                  isActive
                    ? 'bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 text-[var(--purple)]'
                    : isCompleted || isPast
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30'
                }
              `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  className={`
                  text-sm font-semibold
                  ${
                    isLocked
                      ? 'text-gray-400 dark:text-white/40'
                      : 'text-gray-900 dark:text-white'
                  }
                `}
                >
                  {step.title}
                </h3>
                <p
                  className={`
                  text-xs mt-0.5
                  ${
                    isLocked
                      ? 'text-gray-400 dark:text-white/30'
                      : 'text-gray-500 dark:text-white/50'
                  }
                `}
                >
                  {step.description}
                </p>
              </div>
            </div>

            <div className="flex-1" />

            {/* CTA for active step (only step 1) */}
            {isActive && step.number === 1 && (
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[var(--purple)] text-white text-sm font-medium transition-all hover:bg-[var(--purple)]/90 hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                {t('dashboard.stepper.bookCallButton')}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      {/* Greeting skeleton */}
      <div className="mt-8 mb-8">
        <div className="h-4 w-40 bg-gray-200 dark:bg-white/10 rounded-lg mb-3" />
        <div className="h-9 w-56 bg-gray-200 dark:bg-white/10 rounded-lg" />
      </div>

      {/* Stepper skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`p-5 ${glassCard}`}>
            <div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded-full mb-3" />
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-100 dark:bg-white/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`p-5 min-h-[140px] ${glassCard}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
            <div className="h-7 w-24 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-100 dark:bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {/* Messages */}
        <DashboardMessages />

        <DashboardInit>
          {/* Welcome message */}
          <div className="mt-8 mb-8">
            <p className="text-base sm:text-lg text-gray-500 dark:text-white/50 mb-1">
              {greeting},{' '}
              <span className="text-gray-700 dark:text-white/70 font-medium">
                {firstName}
              </span>
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
          </div>

          {/* Onboarding Stepper */}
          <OnboardingStepper hasAnyProject={hasAnyProject} hasLiveProject={hasLiveProject} />

          {/* Stats Section */}
          <div className="mb-8">
            <DashboardStatsClientFetcher />
          </div>
        </DashboardInit>
      </div>
      )}
    </DashboardWrapper>
  );
}
