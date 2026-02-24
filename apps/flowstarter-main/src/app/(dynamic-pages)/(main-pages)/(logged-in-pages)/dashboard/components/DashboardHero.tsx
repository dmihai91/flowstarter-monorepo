'use client';

import { useUser } from '@clerk/nextjs';
import { useTranslations } from '@/lib/i18n';
import { Calendar, Sparkles } from 'lucide-react';
import React from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter/discovery';

// Feature flag - set to true to show create/edit features
const SHOW_CREATE_FEATURES = false;

export function DashboardHero({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslations();
  const { user } = useUser();
  
  // Get first name or fallback to "there"
  const firstName = user?.firstName || 'there';

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Welcome message + Dashboard title */}
        <div className="mb-8">
          <p className="text-gray-500 dark:text-white/50 mb-1">
            Welcome back, <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
        </div>

        {/* Getting Started Card - for users without projects */}
        <div className="mb-8 p-6 rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--blue)] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to get your website?
              </h2>
              <p className="text-gray-500 dark:text-white/50 text-sm mb-4">
                Book a free discovery call with our team. We'll learn about your business and build your professional website in 1-2 weeks. Once it's live, you can manage and edit everything right here.
              </p>
              <a 
                href={CALENDLY_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-[var(--purple)]/10 transition-all duration-300 hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                Book Free Discovery Call
              </a>
            </div>
          </div>
        </div>

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
