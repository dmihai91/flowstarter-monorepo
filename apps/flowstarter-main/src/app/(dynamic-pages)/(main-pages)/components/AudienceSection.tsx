'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function AudienceSection() {
  const audience = LANDING_COPY.audience;

  return (
    <SectionWrapper id="audience">
      <SectionHeading className="text-center">{audience.title}</SectionHeading>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {audience.items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-[var(--landing-card-bg)] p-6 ring-1 ring-[var(--landing-card-border)] text-center backdrop-blur-sm">
            <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--landing-bg-tint)] dark:bg-[var(--purple-primary-lightest)] text-[var(--landing-text-accent)]">
              <LandingIcon name={item.icon as IconName} className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</h3>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
