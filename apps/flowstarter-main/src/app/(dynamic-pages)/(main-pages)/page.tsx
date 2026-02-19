'use client';

/* eslint-disable @next/next/no-img-element */
import { AuthRedirectWrapper } from '@/components/AuthRedirectWrapper';
import { ScrollToTopPortal } from '@/components/ScrollToTopPortal';
import { useHashScroll } from '@/hooks/useHashScroll';
import '@/styles/landing.css';
import {
  BenefitsSection,
  CTASection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  PricingSection,
  TemplatesSection,
  TestimonialsSection,
} from './components';

export default function LandingPage() {
  // Enable smooth scrolling to hash on page load and hash changes
  useHashScroll();

  return (
    <>
      <AuthRedirectWrapper>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TemplatesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </AuthRedirectWrapper>

      {/* Scroll to top button - rendered via portal at body level */}
      <ScrollToTopPortal />
    </>
  );
}
