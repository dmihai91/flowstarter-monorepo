'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { CTAButton } from './CTAButton';
import { LANDING } from './landing-content';

const f = LANDING.finalCta;

export function FinalCTASection() {
  return (
    <SectionWrapper className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-indigo-500/[0.06] blur-[100px] dark:bg-indigo-500/[0.1]" />
      </div>
      <div className="relative text-center">
        <SectionHeading>{f.headline}</SectionHeading>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">{f.text}</p>
        <div className="mt-10">
          <CTAButton size="lg" href="/team/dashboard">{f.cta}</CTAButton>
        </div>
      </div>
    </SectionWrapper>
  );
}
