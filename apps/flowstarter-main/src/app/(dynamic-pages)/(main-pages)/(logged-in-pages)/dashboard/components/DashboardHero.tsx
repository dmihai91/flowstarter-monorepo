'use client';

import { FlowstarterAssistant } from '@/app/(dynamic-pages)/(main-pages)/components/FlowstarterAssistant';
import { useTranslations } from '@/lib/i18n';
import { CalendarDays, Layers, PlusCircle } from 'lucide-react';
import React from 'react';
import ActionCard from './ActionCard';
import { ActionCardWithDropdown } from './ActionCardWithDropdown';
import { PageSectionHeader } from './PageSectionHeader';

export function DashboardHero({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslations();

  return (
    <section className="relative">
      <div className="relative z-10">
        {/* Dashboard Title - Top */}
        <PageSectionHeader
          title={t('dashboard.badge.dashboard')}
          className="mb-4"
        />

        {/* Quick Mode Actions - Cards row */}
        <div className="relative mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            <ActionCardWithDropdown
              icon={PlusCircle}
              title={t('dashboard.hero.actions.startNewProject.title')}
              description={t(
                'dashboard.hero.actions.startNewProject.description'
              )}
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-500"
            />
            <ActionCard
              icon={Layers}
              title={t('dashboard.hero.actions.chooseTemplate.title')}
              description={t(
                'dashboard.hero.actions.chooseTemplate.description'
              )}
              href="/dashboard/new?path=gallery"
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <ActionCard
              icon={CalendarDays}
              title={t('dashboard.hero.actions.exploreExamples.title')}
              description={t(
                'dashboard.hero.actions.exploreExamples.description'
              )}
              href="/dashboard/examples"
              iconBg="bg-gradient-to-br from-violet-500 to-fuchsia-500"
            />
          </div>
        </div>

        {/* Flowstarter Assistant - Below Action Cards */}
        <div id="flowstarter-assistant" className="mb-10">
          <FlowstarterAssistant
            className="flex flex-col gap-4"
            target="editor"
          />
        </div>

        {/* Dashboard Sections - Stats and Projects */}
        {children}
      </div>
    </section>
  );
}

export default DashboardHero;
