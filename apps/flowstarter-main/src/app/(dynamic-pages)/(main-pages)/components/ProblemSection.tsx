'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function ProblemSection() {
  const problem = LANDING_COPY.problem;

  return (
    <SectionWrapper id="problem" tinted className="relative">
      <SectionHeading className="text-center">{problem.title}</SectionHeading>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {problem.pains.map((pain) => (
          <div key={pain.title} className="rounded-3xl bg-[var(--landing-card-bg)] p-7 ring-1 ring-[var(--landing-card-border)] backdrop-blur-sm text-center md:text-left shadow-[0_10px_35px_rgba(15,23,42,0.06)] border-l-4 border-l-red-400/60 dark:border-l-red-400/40">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 md:mx-0 shadow-sm">
              <LandingIcon name={pain.icon as IconName} className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{pain.title}</h3>
            {pain.body && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{pain.body}</p>}
          </div>
        ))}
      </div>

      <p className="mt-16 text-center text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {problem.closing}
      </p>
    </SectionWrapper>
  );
}
