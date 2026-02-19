/**
 * Professional Services (Legal, Medical, Financial) Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const PROFESSIONAL_SECTIONS = {
  required: ['hero', 'services', 'about', 'contact'],
  recommended: ['team', 'credentials', 'testimonials', 'faq'],
  optional: ['case-studies', 'blog', 'resources', 'locations'],
};

export const PROFESSIONAL_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Trusted Guidance When It Matters',
    'Experience You Can Rely On',
    'Protecting What Matters Most',
    'Professional Excellence, Personal Service',
    'Your Partner in [Practice Area]',
  ],
  ctas: [
    'Schedule a Consultation',
    'Contact Our Office',
    'Book an Appointment',
    'Get Started',
    'Request a Review',
  ],
  trustSignals: [
    'Board Certified',
    'Award-Winning',
    '20+ Years Experience',
    'Free Consultation',
    'Confidential',
    'Licensed & Insured',
  ],
};

export const PROFESSIONAL_CONTENT_PROMPT = `You are a content specialist for professional service firms.

TONE & VOICE:
- Authoritative and trustworthy
- Professional but not stuffy
- Clear and accessible (avoid jargon)
- Empathetic to client concerns

KEY MESSAGING:
1. **Trust**: Credentials, experience, track record
2. **Expertise**: What areas do you specialize in?
3. **Process**: What can clients expect?
4. **Accessibility**: Easy to reach, responsive

WHAT WORKS:
- Clear explanation of services
- Team credentials and photos
- Client testimonials (where appropriate)
- FAQ addressing common concerns
- Easy contact methods

WHAT DOESN'T WORK:
- Overly legal/medical/financial jargon
- Missing credentials or about info
- No clear way to contact
- Generic stock photos of handshakes
- Intimidating language

${BASE_CONTENT_RULES}`;

export function buildProfessionalContentPrompt(context: BusinessContext): string {
  const parts = [`${PROFESSIONAL_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Principal: ${context.ownerName}`);
  if (context.location) parts.push(`- Location: ${context.location}`);
  if (context.services?.length) parts.push(`- Practice areas: ${context.services.join(', ')}`);
  if (context.certifications?.length) parts.push(`- Credentials: ${context.certifications.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Approach: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const PROFESSIONAL_DOMAIN = {
  id: 'professional',
  name: 'Professional Services',
  keywords: ['lawyer', 'attorney', 'law firm', 'accountant', 'cpa', 'doctor', 'dentist', 'medical', 'clinic', 'financial advisor', 'consultant'],
  sections: PROFESSIONAL_SECTIONS,
  contentPatterns: PROFESSIONAL_CONTENT_PATTERNS,
  systemPrompt: PROFESSIONAL_CONTENT_PROMPT,
  buildPrompt: buildProfessionalContentPrompt,
  design: {
    colorMoods: ['trustworthy', 'professional', 'established', 'clean'],
    avoidColors: ['playful', 'casual', 'trendy'],
    imageStyle: 'professional headshots, office environment, team',
    layoutStyle: 'clean, organized, easy to navigate',
  },
  conversion: {
    primaryCta: 'Schedule a Consultation',
    secondaryCta: 'Learn About Our Services',
    urgencyLevel: 'low' as const,
    trustPriority: 'high' as const,
  },
};

export default PROFESSIONAL_DOMAIN;
