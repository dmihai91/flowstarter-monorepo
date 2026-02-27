'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { DashboardInit } from './components/DashboardInit';
import { DashboardMessages } from './components/DashboardMessages';
import { DashboardProjectsClient } from './components/DashboardProjects.client';
import { DashboardStatsClientFetcher } from './components/DashboardStatsClientFetcher';
import { DashboardWrapper } from './components/DashboardWrapper';
import { PageSectionHeader } from './components/PageSectionHeader';
import { Calendar, Sparkles, Globe, Lock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

// Onboarding steps
const steps = [
  {
    number: 1,
    title: 'Book Discovery Call',
    description: 'Schedule a free call with our team',
    icon: Calendar,
    status: 'active' as const,
  },
  {
    number: 2,
    title: 'We Build Your Site',
    description: 'Professional website in 1-2 weeks',
    icon: Sparkles,
    status: 'locked' as const,
  },
  {
    number: 3,
    title: 'Go Live & Manage',
    description: 'Edit and track from your dashboard',
    icon: Globe,
    status: 'locked' as const,
  },
];

// Glassmorphism card style - shared with team dashboard
const glassCard = 'rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]';

function OnboardingStepper() {
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
              ${glassCard}
              ${isActive ? 'border-[var(--purple)]/40 shadow-[0_8px_32px_rgba(124,58,237,0.12)]' : ''}
              ${isCompleted || isPast ? 'border-green-500/30' : ''}
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
              Step {step.number}
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

            {/* CTA for active step */}
            {isActive && (
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[var(--purple)] text-white text-sm font-medium transition-all hover:bg-[var(--purple)]/90 hover:shadow-lg hover:shadow-[var(--purple)]/25 hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                Book Free Call
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslations();
  const { user } = useUser();

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('dashboard.greeting.morning') : hour < 18 ? t('dashboard.greeting.afternoon') : t('dashboard.greeting.evening');

  return (
    <DashboardWrapper>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Messages */}
        <DashboardMessages />

        <DashboardInit>
          {/* Welcome message */}
          <div className="mb-8">
            <p className="text-gray-500 dark:text-white/50 mb-1 text-sm sm:text-base">
              {greeting},{' '}
              <span className="text-gray-700 dark:text-white/70 font-medium">
                {firstName}
              </span>
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
          </div>

          {/* Onboarding Stepper */}
          <OnboardingStepper />

          {/* Stats Section */}
          <div className="mb-8">
            <DashboardStatsClientFetcher />
          </div>

          {/* Projects Section */}
          <div className="mb-8">
            <PageSectionHeader
              title={t('projects.title')}
              subtitle={t('projects.subtitle')}
            />
            <DashboardProjectsClient />
          </div>
        </DashboardInit>
      </div>
    </DashboardWrapper>
  );
}
