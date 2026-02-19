/**
 * Pricing.md Generator
 */

import type { ContentContext } from '../types';

/** Domain-specific pricing structures */
const DOMAIN_PRICING: Record<string, { title: string; subtitle: string; guarantee: string }> = {
  therapist: {
    title: 'Session Rates',
    subtitle: 'Investment in your wellbeing.',
    guarantee: 'Sliding scale available. Insurance accepted.',
  },
  fitness: {
    title: 'Training Packages',
    subtitle: 'Choose your transformation path.',
    guarantee: 'Results guaranteed or your money back.',
  },
  yoga: {
    title: 'Membership Options',
    subtitle: 'Find the practice that fits your life.',
    guarantee: 'First class free. No commitment required.',
  },
  coaching: {
    title: 'Coaching Packages',
    subtitle: 'Invest in your breakthrough.',
    guarantee: 'Satisfaction guaranteed.',
  },
  tech: {
    title: 'Simple Pricing',
    subtitle: 'Start free, scale as you grow.',
    guarantee: '14-day free trial. No credit card required.',
  },
};

const DEFAULT_PRICING = {
  title: 'Simple, Transparent Pricing',
  subtitle: 'Choose the plan that works for you.',
  guarantee: '30-day money-back guarantee.',
};

export function generatePricingMd(businessInfo: any, ctx?: ContentContext): string {
  const pricing = DOMAIN_PRICING[ctx?.domain.id || ''] || DEFAULT_PRICING;

  return `---
title: "${pricing.title}"
subtitle: "${pricing.subtitle}"
plans:
  - name: "Starter"
    price: 99
    period: "/month"
    description: "Perfect for getting started."
    features:
      - "Core features included"
      - "Email support"
      - "Basic analytics"
    cta: "Get Started"
    popular: false
  - name: "Professional"
    price: 199
    period: "/month"
    description: "Best for growing businesses."
    features:
      - "Everything in Starter"
      - "Priority support"
      - "Advanced analytics"
      - "Custom integrations"
    cta: "Start Free Trial"
    popular: true
  - name: "Enterprise"
    price: 499
    period: "/month"
    description: "For large teams and organizations."
    features:
      - "Everything in Professional"
      - "Dedicated account manager"
      - "Custom development"
      - "SLA guarantee"
    cta: "Contact Sales"
    popular: false
guarantee: "${pricing.guarantee}"
---
`;
}
