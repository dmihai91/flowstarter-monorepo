'use client';

import { useTranslations } from '@/lib/i18n';
import React from 'react';
import { PageSectionHeader } from './PageSectionHeader';

// Feature flag - set to true to show create/edit features
const SHOW_CREATE_FEATURES = false;

export function DashboardHero({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslations();

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Dashboard Title with gradient accent */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            <span className="text-gray-900 dark:text-white">Welcome to your </span>
            <span className="bg-gradient-to-r from-[#7C3AED] to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-2 text-gray-500 dark:text-white/50">
            Manage your website and track performance
          </p>
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
