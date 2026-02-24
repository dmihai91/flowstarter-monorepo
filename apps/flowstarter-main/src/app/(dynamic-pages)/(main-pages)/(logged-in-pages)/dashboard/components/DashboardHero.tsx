'use client';

import { useUser } from '@clerk/nextjs';
import { useScrollAnimation, getStaggeredAnimation } from '@/hooks/useScrollAnimation';
import { Calendar, CheckCircle2, Globe, Lock, Sparkles } from 'lucide-react';
import React from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

// Feature flag - set to true to show create/edit features
const SHOW_CREATE_FEATURES = false;

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
  const { ref, isVisible } = useScrollAnimation();
  const currentStepIndex = steps.findIndex(s => s.status === 'active');
  
  return (
    <div ref={ref} className="mb-6">
      {/* Desktop Layout - Horizontal with connector */}
      <div className="hidden md:block relative">
        {/* Progress connector line - behind cards */}
        <div className="absolute top-8 left-[60px] right-[60px] h-0.5 bg-gray-200 dark:bg-white/10 z-0">
          <div 
            className="h-full bg-[var(--purple)] transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {steps.map((step, index) => {
            const animation = getStaggeredAnimation(index, isVisible);
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            const isLocked = step.status === 'locked';
            const isPast = index < currentStepIndex;
            
            return (
              <div
                key={step.number}
                className={`${animation.className}`}
                style={animation.style}
              >
                <div
                  className={`
                    relative p-5 rounded-2xl border transition-all duration-300 h-full flex flex-col
                    ${isActive 
                      ? 'bg-white dark:bg-white/[0.06] border-[var(--purple)]/30 shadow-lg shadow-[var(--purple)]/5' 
                      : isCompleted || isPast
                      ? 'bg-[var(--green)]/5 dark:bg-[var(--green)]/10 border-[var(--green)]/30'
                      : 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/5'
                    }
                    ${isActive ? 'hover:shadow-xl hover:shadow-[var(--purple)]/10 hover:-translate-y-0.5' : ''}
                  `}
                >
                  {/* Step number badge */}
                  <div className={`
                    absolute -top-3 left-5 px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${isActive 
                      ? 'bg-[var(--purple)] text-white' 
                      : isCompleted || isPast
                      ? 'bg-[var(--green)] text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50'
                    }
                  `}>
                    Step {step.number}
                  </div>
                  
                  <div className="flex items-start gap-4 mt-1">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isActive 
                        ? 'bg-[var(--purple)]/10 text-[var(--purple)]' 
                        : isCompleted || isPast
                        ? 'bg-[var(--green)]/10 text-[var(--green)]'
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
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`
                        text-sm font-semibold mb-0.5
                        ${isLocked 
                          ? 'text-gray-400 dark:text-white/40' 
                          : 'text-gray-900 dark:text-white'
                        }
                      `}>
                        {step.title}
                      </h3>
                      <p className={`
                        text-xs
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
                  
                  {/* Active step CTA */}
                  {isActive ? (
                    <a
                      href={CALENDLY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(77,93,217,0.15)] transition-all duration-300 hover:scale-[1.02] hover:from-[#232342] hover:via-[#1e2a4a] hover:to-[#232342] dark:hover:from-gray-100 dark:hover:via-white dark:hover:to-gray-100"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Free Call
                    </a>
                  ) : (
                    <div className="mt-4 h-[42px]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Layout - Vertical with connector */}
      <div className="md:hidden relative">
        {/* Vertical progress line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-white/10 z-0">
          <div 
            className="w-full bg-[var(--purple)] transition-all duration-500"
            style={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        <div className="space-y-3 relative z-10">
          {steps.map((step, index) => {
            const animation = getStaggeredAnimation(index, isVisible);
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            const isLocked = step.status === 'locked';
            const isPast = index < currentStepIndex;
            
            return (
              <div
                key={step.number}
                className={animation.className}
                style={animation.style}
              >
                <div
                  className={`
                    relative rounded-2xl border transition-all duration-300 flex items-center gap-3
                    ${isActive 
                      ? 'p-4 bg-white dark:bg-white/[0.06] border-[var(--purple)]/30 shadow-lg shadow-[var(--purple)]/5' 
                      : 'p-3 bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/5'
                    }
                  `}
                >
                  {/* Step indicator circle */}
                  <div className={`
                    w-[46px] h-[46px] rounded-xl flex items-center justify-center flex-shrink-0
                    ${isActive 
                      ? 'bg-[var(--purple)]/10 text-[var(--purple)]' 
                      : isCompleted || isPast
                      ? 'bg-[var(--green)]/10 text-[var(--green)]'
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
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`
                        text-[10px] font-semibold uppercase tracking-wider
                        ${isActive 
                          ? 'text-[var(--purple)]' 
                          : 'text-gray-400 dark:text-white/40'
                        }
                      `}>
                        Step {step.number}
                      </span>
                    </div>
                    <h3 className={`
                      text-sm font-semibold
                      ${isLocked 
                        ? 'text-gray-400 dark:text-white/40' 
                        : 'text-gray-900 dark:text-white'
                      }
                    `}>
                      {step.title}
                    </h3>
                    {isActive && (
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Active step CTA - Mobile */}
                  {isActive && (
                    <a
                      href={CALENDLY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 text-xs font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(77,93,217,0.15)] transition-all duration-300"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Call
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DashboardHero({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const { ref, isVisible } = useScrollAnimation();
  
  const firstName = user?.firstName || 'there';

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Welcome message + Dashboard title */}
        <div 
          ref={ref}
          className={`mb-6 transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-gray-500 dark:text-white/50 mb-1">
            Welcome back, <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>

        {/* Onboarding Stepper */}
        <OnboardingStepper />

        {/* Create features hidden */}
        {SHOW_CREATE_FEATURES && (
          <>
            {/* Action cards and assistant would go here */}
          </>
        )}

        {/* Dashboard Sections */}
        {children}
      </div>
    </section>
  );
}

export default DashboardHero;
