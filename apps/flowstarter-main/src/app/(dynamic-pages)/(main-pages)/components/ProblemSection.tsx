'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING } from './landing-content';

const p = LANDING.problem;

export function ProblemSection() {
  return (
    <SectionWrapper id="problem" tinted>
      <SectionHeading className="text-center">{p.title}</SectionHeading>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {p.pains.map((pain) => (
          <div key={pain.title} className="rounded-2xl bg-[var(--landing-card-bg)] p-6 ring-1 ring-[var(--landing-card-border)] backdrop-blur-sm text-center md:text-left">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 md:mx-0">
              <LandingIcon name={pain.icon as IconName} className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{pain.title}</h3>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{pain.description}</p>
          </div>
        ))}
      </div>

      <p className="mt-16 text-center text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {p.closing}
      </p>
    </SectionWrapper>
  );
}
