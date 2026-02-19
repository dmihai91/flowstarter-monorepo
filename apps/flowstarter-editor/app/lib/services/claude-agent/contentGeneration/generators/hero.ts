/**
 * Hero.md Generator
 */

import type { ContentContext, IntegrationConfig, GeneratedAsset } from '../types';
import { pickRandom, findAsset } from '../context';

/** Domain-specific badge text */
const BADGES: Record<string, string> = {
  therapist: 'Safe & Confidential',
  fitness: 'Results Guaranteed',
  yoga: 'All Levels Welcome',
  coaching: 'Transform Your Life',
  creative: 'Award-Winning Work',
  beauty: 'Luxury Experience',
  food: 'Fresh & Delicious',
  professional: 'Trusted Expertise',
  realestate: 'Local Expert',
  tech: 'Start Free Today',
  generic: 'Trusted by Professionals',
};

/** Domain-specific stats */
const DOMAIN_STATS: Record<string, Array<{ value: string; label: string }>> = {
  therapist: [
    { value: '500+', label: 'Clients Helped' },
    { value: '15+', label: 'Years Experience' },
    { value: '100%', label: 'Confidential' },
    { value: '48h', label: 'Response Time' },
  ],
  fitness: [
    { value: '1000+', label: 'Transformations' },
    { value: '98%', label: 'Success Rate' },
    { value: '10+', label: 'Years Experience' },
    { value: '5★', label: 'Average Rating' },
  ],
  yoga: [
    { value: '50+', label: 'Classes/Week' },
    { value: '20+', label: 'Instructors' },
    { value: 'All', label: 'Levels Welcome' },
    { value: '4.9', label: 'Student Rating' },
  ],
  food: [
    { value: '4.8★', label: 'On Google' },
    { value: 'Fresh', label: 'Daily Ingredients' },
    { value: '15+', label: 'Years Serving' },
    { value: '1000+', label: 'Happy Guests' },
  ],
  realestate: [
    { value: '$50M+', label: 'In Sales' },
    { value: '200+', label: 'Homes Sold' },
    { value: '10+', label: 'Years Local' },
    { value: '5★', label: 'Client Reviews' },
  ],
  tech: [
    { value: '10K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
    { value: '4.9', label: 'App Rating' },
  ],
};

const DEFAULT_STATS = [
  { value: '100+', label: 'Happy Clients' },
  { value: '5+', label: 'Years Experience' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Support' },
];

export function generateHeroMd(
  businessInfo: any,
  integrations?: IntegrationConfig[],
  assets?: GeneratedAsset[],
  ctx?: ContentContext
): string {
  const headline = businessInfo.tagline ||
    (ctx ? pickRandom(ctx.suggestions.headlines) : `Welcome to ${businessInfo.name}`);

  const subheadline = businessInfo.description ||
    'Professional services tailored to your needs.';

  // Check if booking integration is configured
  const bookingIntegration = integrations?.find(i => i.id === 'booking');
  const hasBooking = !!(bookingIntegration?.config?.provider && bookingIntegration?.config?.url);

  // Get domain-appropriate CTAs
  const primaryCta = ctx?.conversion.primaryCta || 'Contact Us';
  const secondaryCta = ctx?.conversion.secondaryCta || 'Learn More';

  const ctaPrimary = hasBooking
    ? { text: primaryCta, href: '#booking' }
    : { text: primaryCta, href: '#contact' };
  const ctaSecondary = { text: secondaryCta, href: '#services' };

  // Domain-specific badge
  const badge = BADGES[ctx?.domain.id || 'generic'] || BADGES.generic;

  // Get hero image from generated assets
  const heroAsset = findAsset(assets, 'hero');
  const imageSection = heroAsset
    ? `image:
  url: "${heroAsset.url}"
  alt: "${(heroAsset.prompt || 'Hero banner').replace(/"/g, "'")}"
  position: "center"`
    : `image:
  url: null
  alt: "Hero banner"
  position: "center"`;

  // Domain-specific stats
  const stats = DOMAIN_STATS[ctx?.domain.id || ''] || DEFAULT_STATS;
  const statsYaml = stats.map(s => `  - value: "${s.value}"\n    label: "${s.label}"`).join('\n');

  return `---
headline: "${headline}"
subheadline: "${subheadline}"
badge: "${badge}"
${imageSection}
cta_primary:
  text: "${ctaPrimary.text}"
  href: "${ctaPrimary.href}"
cta_secondary:
  text: "${ctaSecondary.text}"
  href: "${ctaSecondary.href}"
stats:
${statsYaml}
---
`;
}
