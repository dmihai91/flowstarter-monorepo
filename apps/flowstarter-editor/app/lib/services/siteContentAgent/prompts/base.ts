/**
 * Base content generation components shared across all domains
 */

export interface SectionContent {
  id: string;
  type: string;
  headline: string;
  subheadline?: string;
  body?: string;
  cta?: {
    text: string;
    action: string;
  };
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export interface SiteContent {
  hero: SectionContent;
  sections: SectionContent[];
  footer: {
    tagline: string;
    cta?: string;
  };
  meta: {
    title: string;
    description: string;
    tone: string;
  };
}

export interface BusinessContext {
  description: string;
  ownerName?: string;
  location?: string;
  services?: string[];
  targetAudience?: string;
  uniqueApproach?: string;
  certifications?: string[];
}

/**
 * Base content rules that apply to ALL domains
 */
export const BASE_CONTENT_RULES = `
CONTENT RULES (apply to ALL sites):
- Headlines: Clear, benefit-focused, 3-8 words
- Body text: Conversational but professional, 2-3 sentences per paragraph
- CTAs: Action-oriented, specific ("Book a Consultation" not "Click Here")
- No corporate jargon or buzzwords
- Address the visitor directly ("you", "your")
- Focus on transformation and outcomes, not features
`;

/**
 * Section types available across all domains
 */
export const COMMON_SECTIONS = [
  'hero',
  'about',
  'services',
  'process',
  'testimonials',
  'faq',
  'contact',
  'cta-banner',
] as const;

export type SectionType = typeof COMMON_SECTIONS[number];

/**
 * Default CTA styles per intent
 */
export const CTA_STYLES = {
  booking: ['Book a Consultation', 'Schedule a Call', 'Book Your Session'],
  inquiry: ['Get in Touch', 'Send a Message', 'Start a Conversation'],
  discovery: ['Learn More', 'See How It Works', 'Explore Services'],
  urgency: ['Start Today', 'Begin Your Journey', 'Take the First Step'],
};
