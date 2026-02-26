'use client';

import { PageContainer } from '@/components/PageContainer';
import FooterCompact from '@/components/FooterCompact';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { ClientHeader } from './components/ClientHeader';
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

function OnboardingStepper() {
  const currentStepIndex = steps.findIndex(s => s.status === 'active');
  
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {steps.map((step, index) => {
        const isActive = step.status === 'active';
        const isCompleted = step.status === 'completed';
        const isLocked = step.status === 'locked';
        const isPast = index < currentStepIndex;
        
        return (
          <div
            key={step.number}
            className={`
              relative p-5 rounded-2xl border transition-all h-full flex flex-col
              ${isActive 
                ? 'border-[var(--purple)]/30 bg-white/80 dark:bg-[#1a1a1f]/80 shadow-lg shadow-[var(--purple)]/5' 
                : isCompleted || isPast
                ? 'border-green-500/30 bg-green-50/50 dark:bg-green-500/5'
                : 'border-gray-200/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'
              }
              backdrop-blur-xl
            `}
          >
            {/* Step badge */}
            <span className={`
              inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-3
              ${isActive 
                ? 'bg-[var(--purple)] text-white' 
                : isCompleted || isPast
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50'
              }
            `}>
              Step {step.number}
            </span>
            
            <div className="flex items-start gap-3 mb-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${isActive 
                  ? 'bg-[var(--purple)]/10 text-[var(--purple)]' 
                  : isCompleted || isPast
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`
                  text-sm font-semibold
                  ${isLocked 
                    ? 'text-gray-400 dark:text-white/40' 
                    : 'text-gray-900 dark:text-white'
                  }
                `}>
                  {step.title}
                </h3>
                <p className={`
                  text-xs mt-0.5
                  ${isLocked 
                    ? 'text-gray-400 dark:text-white/30' 
                    : 'text-gray-500 dark:text-white/50'
                  }
                `}>
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
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg shadow-[var(--purple)]/20"
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
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardWrapper>
      <ClientHeader />

      {/* Spacer for fixed header */}
      <div className="h-16" />

      <PageContainer gradientVariant="dashboard">
        {/* Messages */}
        <DashboardMessages />

        <DashboardInit>
          {/* Welcome message */}
          <div className="mb-8">
            <p className="text-gray-500 dark:text-white/50 mb-1">
              {greeting}, <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
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
      </PageContainer>

      {/* Footer */}
      <FooterCompact />
    </DashboardWrapper>
  );
}
