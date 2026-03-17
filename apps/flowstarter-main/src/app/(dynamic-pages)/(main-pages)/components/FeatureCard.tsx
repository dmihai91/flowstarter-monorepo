'use client';

import { LandingIcon, type IconName } from './LandingIcons';

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl bg-[var(--landing-card-bg)] p-6 ring-1 ring-[var(--landing-card-border)] backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-[var(--landing-glow)]">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-bg-tint)] dark:bg-indigo-500/10 text-[var(--landing-text-accent)]">
        <LandingIcon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
