'use client';

import { useUser } from '@clerk/nextjs';
import { EXTERNAL_URLS } from '@/lib/constants';
import {
  useScrollAnimation,
  getStaggeredAnimation,
} from '@/hooks/useScrollAnimation';
import { Calendar, CheckCircle2, Globe, Lock, Sparkles } from 'lucide-react';
import React from 'react';


// Feature flag
const SHOW_CREATE_FEATURES = false;

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Onboarding steps
const steps: Array<{number: number; title: string; description: string; icon: any; status: 'active' | 'locked' | 'completed'}> = [
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
  const currentStepIndex = steps.findIndex((s) => s.status === 'active');

  return (
    <div ref={ref} className="mb-6">
      {/* Desktop Layout - Horizontal with premium progress bar */}
      <div className="hidden md:block relative pt-10">
        {/* Progress Bar Container - positioned above cards */}
        <div className="absolute top-0 left-[calc(16.67%)] right-[calc(16.67%)] h-[14px] flex items-center">
          {/* Track (unfilled background) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-white/10 rounded-full" />

          {/* Fill (gradient progress) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
            }}
          />

          {/* Step Dots */}
          <div className="relative w-full flex justify-between z-10">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isLocked = index > currentStepIndex;

              return (
                <div
                  key={`dot-${index}`}
                  className={`
                    w-3.5 h-3.5 rounded-full border-2 transition-all duration-300
                    ${
                      isActive || isCompleted
                        ? 'bg-[var(--purple)] border-white dark:border-gray-900 shadow-[0_0_0_2px_rgba(124,58,237,0.2),0_2px_8px_rgba(124,58,237,0.3)]'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-white/20'
                    }
                  `}
                />
              );
            })}
          </div>
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
                className={animation.className}
                style={animation.style}
              >
                <div
                  className={`
                    relative p-5 rounded-2xl transition-all duration-300 h-full flex flex-col
                    ${
                      isActive
                        ? 'bg-gradient-to-br from-white to-[#FAFAFF] dark:from-white/[0.08] dark:to-white/[0.04] border-2 border-[var(--purple)]/20 shadow-[0_4px_20px_rgba(124,58,237,0.08)]'
                        : isCompleted || isPast
                        ? 'bg-[var(--green)]/5 dark:bg-[var(--green)]/10 border border-[var(--green)]/30'
                        : 'bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5'
                    }
                  `}
                >
                  {/* Step number badge - solid filled, positioned inside card */}
                  <div
                    className={`
                    inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3
                    ${
                      isActive
                        ? 'bg-[var(--purple)] text-white shadow-sm'
                        : isCompleted || isPast
                        ? 'bg-[var(--green)] text-white'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50'
                    }
                  `}
                  >
                    Step {step.number}
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`
                      w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${
                        isActive
                          ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                          : isCompleted || isPast
                          ? 'bg-[var(--green)]/10 text-[var(--green)]'
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

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`
                        text-sm font-semibold mb-0.5
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
                        text-xs
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

                  {/* Active step CTA - Navy gradient */}
                  {isActive ? (
                    <a
                      href={EXTERNAL_URLS.calendly.discovery}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background:
                          'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #1f1f3a 0%, #1b2847 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 0 20px rgba(124, 58, 237, 0.15), 0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                        e.currentTarget.style.boxShadow =
                          '0 4px 12px rgba(0,0,0,0.15)';
                      }}
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

      {/* Mobile Layout - Vertical with premium progress bar */}
      <div className="md:hidden relative pl-8">
        {/* Vertical Progress Bar - left side */}
        <div className="absolute left-[7px] top-4 bottom-4 w-[14px] flex flex-col items-center">
          {/* Track (unfilled background) */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gray-200 dark:bg-white/10 rounded-full" />

          {/* Fill (gradient progress) */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 rounded-full"
            style={{
              height: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
              background: 'linear-gradient(180deg, #7C3AED, #06B6D4)',
            }}
          />

          {/* Step Dots - positioned at card centers */}
          <div className="relative h-full flex flex-col justify-between z-10">
            {steps.map((step, index) => {
              const isActiveOrCompleted = index <= currentStepIndex;

              return (
                <div
                  key={`mobile-dot-${index}`}
                  className={`
                    w-3.5 h-3.5 rounded-full border-2 transition-all duration-300
                    ${
                      isActiveOrCompleted
                        ? 'bg-[var(--purple)] border-white dark:border-gray-900 shadow-[0_0_0_2px_rgba(124,58,237,0.2),0_2px_8px_rgba(124,58,237,0.3)]'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-white/20'
                    }
                  `}
                />
              );
            })}
          </div>
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
                    relative rounded-2xl transition-all duration-300 flex items-center gap-3
                    ${
                      isActive
                        ? 'p-4 bg-gradient-to-br from-white to-[#FAFAFF] dark:from-white/[0.08] dark:to-white/[0.04] border-2 border-[var(--purple)]/20 shadow-[0_4px_20px_rgba(124,58,237,0.08)]'
                        : 'p-3 bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5'
                    }
                  `}
                >
                  {/* Step indicator */}
                  <div
                    className={`
                    w-[46px] h-[46px] rounded-xl flex items-center justify-center flex-shrink-0
                    ${
                      isActive
                        ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                        : isCompleted || isPast
                        ? 'bg-[var(--green)]/10 text-[var(--green)]'
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`
                        text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                        ${
                          isActive
                            ? 'bg-[var(--purple)] text-white'
                            : 'text-gray-400 dark:text-white/40'
                        }
                      `}
                      >
                        Step {step.number}
                      </span>
                    </div>
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
                    {isActive && (
                      <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Mobile CTA */}
                  {isActive && (
                    <a
                      href={EXTERNAL_URLS.calendly.discovery}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-all duration-300"
                      style={{
                        background:
                          'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                      }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book
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
  const greeting = getGreeting();

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Welcome message with time-based greeting */}
        <div
          ref={ref}
          className={`mt-8 mb-8 transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-lg text-gray-500 dark:text-white/50 mb-2">
            {greeting},{' '}
            <span className="text-gray-700 dark:text-white/70 font-medium">
              {firstName}
            </span>
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>

        {/* Onboarding Stepper */}
        <OnboardingStepper />

        {/* Create features hidden */}
        {SHOW_CREATE_FEATURES && (
          <>{/* Action cards and assistant would go here */}</>
        )}

        {/* Dashboard Sections */}
        {children}
      </div>
    </section>
  );
}

export default DashboardHero;
