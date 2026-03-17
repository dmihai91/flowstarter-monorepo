'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { PricingCard } from './PricingCard';
import { LANDING } from './landing-content';

const pr = LANDING.pricing;

export function LandingPricing() {
  return (
    <SectionWrapper id="pricing">
      <SectionHeading className="text-center">{pr.title}</SectionHeading>

      <div className="mt-16 grid gap-8 lg:grid-cols-3 items-start">
        {pr.plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-gray-500 dark:text-gray-500">{pr.note}</p>
    </SectionWrapper>
  );
}
