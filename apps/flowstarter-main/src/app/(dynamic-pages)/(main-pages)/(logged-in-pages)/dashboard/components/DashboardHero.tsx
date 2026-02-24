'use client';

import { useUser } from '@clerk/nextjs';
import { useTranslations } from '@/lib/i18n';
import React from 'react';

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
            <span className="bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
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
