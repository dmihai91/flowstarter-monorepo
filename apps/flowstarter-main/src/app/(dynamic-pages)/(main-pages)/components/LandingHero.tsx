'use client';

import { CTAButton } from './CTAButton';
import { LANDING } from './landing-content';

const h = LANDING.hero;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Subtle radial gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-500/[0.07] blur-[120px] dark:bg-indigo-500/[0.12]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
          {h.headline}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl">
          {h.subheadline}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CTAButton size="lg" href="/team/dashboard">{h.primaryCta}</CTAButton>
          <CTAButton variant="secondary" size="lg" href="#pricing">{h.secondaryCta}</CTAButton>
        </div>

        <p className="mt-10 text-sm text-gray-500 dark:text-gray-500">
          {h.trustLine}
        </p>
      </div>
    </section>
  );
}
