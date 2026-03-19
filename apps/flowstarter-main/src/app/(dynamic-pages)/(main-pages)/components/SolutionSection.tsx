'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING } from './landing-content';

const s = LANDING.solution;

export function SolutionSection() {
  return (
    <SectionWrapper id="solution">
      <SectionHeading className="text-center">{s.title}</SectionHeading>

      <div className="mt-8 grid gap-12 md:grid-cols-3">
        {s.steps.map((step) => (
          <div key={step.number} className="relative">
            <span className="font-display text-5xl font-bold text-[var(--purple-primary-lightest)] dark:text-[var(--purple-primary-lighter)]">{step.number}</span>
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
