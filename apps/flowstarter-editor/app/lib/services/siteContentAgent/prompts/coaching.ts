/**
 * Life Coaching / Business Coaching / Executive Coaching Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const COACHING_SECTIONS = {
  required: ['hero', 'about', 'services', 'contact'],
  recommended: ['process', 'results', 'testimonials', 'faq'],
  optional: ['resources', 'podcast', 'book', 'speaking'],
};

export const COACHING_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Unlock Your Next Chapter',
    'From Where You Are to Where You Want to Be',
    'Clarity. Action. Results.',
    'Your Breakthrough Starts Here',
    'Lead the Life You Were Meant to Live',
  ],
  ctas: [
    'Book a Discovery Call',
    'Schedule Your Session',
    'Start Your Transformation',
    'Apply Now',
    'Let\'s Talk',
  ],
  specializations: [
    'Executive Coaching',
    'Career Transitions',
    'Leadership Development',
    'Life Purpose',
    'Business Strategy',
    'Work-Life Balance',
    'Confidence Building',
  ],
};

export const COACHING_CONTENT_PROMPT = `You are a content specialist for coaching practices.

TONE & VOICE:
- Confident and inspiring (you've helped many succeed)
- Direct but empathetic
- Results-oriented without being salesy
- Authentic and relatable

KEY MESSAGING:
1. **Transformation**: Paint the picture of life after coaching
2. **Methodology**: What makes your approach unique?
3. **Credibility**: Results, testimonials, credentials
4. **Partnership**: Coach as partner, not guru

WHAT WORKS:
- Clear outcomes ("In 90 days, you'll...")
- Client transformation stories
- Your personal coaching journey
- Transparent process explanation

WHAT DOESN'T WORK:
- Vague promises ("live your best life")
- Guru positioning
- Too much jargon
- Avoiding talk of investment/pricing

${BASE_CONTENT_RULES}`;

export function buildCoachingContentPrompt(context: BusinessContext): string {
  const parts = [`${COACHING_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Coach: ${context.ownerName}`);
  if (context.location) parts.push(`- Location: ${context.location}`);
  if (context.services?.length) parts.push(`- Specializations: ${context.services.join(', ')}`);
  if (context.targetAudience) parts.push(`- Ideal clients: ${context.targetAudience}`);
  if (context.uniqueApproach) parts.push(`- Methodology: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const COACHING_DOMAIN = {
  id: 'coaching',
  name: 'Life & Business Coaching',
  keywords: ['coach', 'coaching', 'life coach', 'business coach', 'executive coach', 'mentor', 'consultant'],
  sections: COACHING_SECTIONS,
  contentPatterns: COACHING_CONTENT_PATTERNS,
  systemPrompt: COACHING_CONTENT_PROMPT,
  buildPrompt: buildCoachingContentPrompt,
  design: {
    colorMoods: ['confident', 'professional', 'warm', 'inspiring'],
    avoidColors: ['dull', 'corporate gray'],
    imageStyle: 'professional headshots, speaking engagements, client interactions',
    layoutStyle: 'clean, authoritative, premium feel',
  },
  conversion: {
    primaryCta: 'Book a Discovery Call',
    secondaryCta: 'Learn My Approach',
    urgencyLevel: 'medium' as const,
    trustPriority: 'high' as const,
  },
};

export default COACHING_DOMAIN;
