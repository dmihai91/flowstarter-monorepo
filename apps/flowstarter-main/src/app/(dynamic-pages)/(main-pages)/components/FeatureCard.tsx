'use client';

import { LandingIcon, type IconName } from './LandingIcons';

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl bg-white/70 dark:bg-white/[0.04] p-6 ring-1 ring-gray-200 dark:ring-white/10 backdrop-blur-sm transition-all duration-200 hover:ring-gray-300 dark:hover:ring-white/20 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <LandingIcon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
