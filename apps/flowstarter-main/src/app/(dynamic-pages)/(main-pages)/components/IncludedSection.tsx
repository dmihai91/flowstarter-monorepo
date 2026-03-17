'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { FeatureCard } from './FeatureCard';
import { LANDING } from './landing-content';
import type { IconName } from './LandingIcons';

const inc = LANDING.included;

export function IncludedSection() {
  return (
    <SectionWrapper id="included" tinted>
      <SectionHeading className="text-center">{inc.title}</SectionHeading>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {inc.features.map((f) => (
          <FeatureCard key={f.title} icon={f.icon as IconName} title={f.title} description={f.description} />
        ))}
      </div>
    </SectionWrapper>
  );
}
