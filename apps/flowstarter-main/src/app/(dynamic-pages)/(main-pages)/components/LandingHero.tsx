'use client';

import { CTAButton } from './CTAButton';
import { LANDING } from './landing-content';

const h = LANDING.hero;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Radial halo — uses the hero wash variables */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-[radial-gradient(ellipse,var(--hero-wash-from)_0%,var(--hero-wash-via)_40%,transparent_70%)] opacity-80 dark:opacity-20 blur-[40px]" />
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[var(--landing-glow)] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h1 className="hero-fade hero-fade-1 font-display text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
          Launch your online business
          <span className="text-flow"> — without tech skills or expensive agencies</span>
        </h1>

        <p className="hero-fade hero-fade-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl">
          {h.subheadline}
        </p>

        <div className="hero-fade hero-fade-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CTAButton size="lg" href="/team/dashboard">{h.primaryCta}</CTAButton>
          <CTAButton variant="secondary" size="lg" href="#pricing">{h.secondaryCta}</CTAButton>
        </div>

        <p className="hero-fade hero-fade-4 mt-10 text-sm text-gray-500 dark:text-gray-500">
          {h.trustLine}
        </p>
      </div>
    </section>
  );
}
