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
    status: 'active' as const, // active | completed | locked
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
  
  return (
    <div ref={ref} className="mb-10">
      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {steps.map((step, index) => {
          const animation = getStaggeredAnimation(index, isVisible);
          const isActive = step.status === 'active';
          const isCompleted = step.status === 'completed';
          const isLocked = step.status === 'locked';
          
          return (
            <div
              key={step.number}
              className={animation.className}
              style={animation.style}
            >
              <div
                className={`
                  relative p-5 rounded-2xl border transition-all duration-300
                  ${isActive 
                    ? 'bg-white dark:bg-white/[0.06] border-[var(--purple)]/30 shadow-lg shadow-[var(--purple)]/5' 
                    : isCompleted
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
                    : isCompleted
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
                      : isCompleted
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
                
                {/* Active step CTA */}
                {isActive && (
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] dark:from-white dark:via-gray-100 dark:to-white text-white dark:text-gray-900 text-sm font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(var(--purple-rgb),0.2)] transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Free Call
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardHero({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const { ref, isVisible } = useScrollAnimation();
  
  // Get first name or fallback to "there"
  const firstName = user?.firstName || 'there';

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Welcome message + Dashboard title - NO GRADIENT */}
        <div 
          ref={ref}
          className={`mb-8 transition-all duration-500 ease-out ${
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

        {/* Create features hidden - keeping code for later */}
        {SHOW_CREATE_FEATURES && (
          <>
            {/* Action cards and assistant would go here */}
          </>
        )}

        {/* Dashboard Sections - Stats and Projects */}
        {children}
      </div>
    </section>
  );
}

export default DashboardHero;
