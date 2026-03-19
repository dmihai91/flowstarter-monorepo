'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function AudienceSection() {
  const audience = LANDING_COPY.audience;

  return (
    <SectionWrapper id="audience">
      <SectionHeading className="text-center">{audience.title}</SectionHeading>

      <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {audience.items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[var(--landing-card-bg)] px-4 py-3.5 ring-1 ring-[var(--landing-card-border)] backdrop-blur-sm">
            <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--landing-bg-tint)] dark:bg-[var(--purple-primary-lightest)] text-[var(--landing-text-accent)]">
              <LandingIcon name={item.icon as IconName} className="h-5 w-5" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-tight">{item.label}</h3>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
