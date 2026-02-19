/**
 * Creative / Photography / Design Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const CREATIVE_SECTIONS = {
  required: ['hero', 'portfolio', 'about', 'contact'],
  recommended: ['services', 'process', 'testimonials'],
  optional: ['pricing', 'blog', 'press', 'awards'],
};

export const CREATIVE_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Capturing Moments That Matter',
    'Design That Tells Your Story',
    'Where Vision Meets Craft',
    'Creating What You\'ll Treasure',
    'Art Meets Purpose',
  ],
  ctas: [
    'View Portfolio',
    'Book Your Session',
    'Start a Project',
    'Get in Touch',
    'Check Availability',
  ],
  services: [
    'Wedding Photography',
    'Brand Identity',
    'Portrait Sessions',
    'Commercial Work',
    'Event Coverage',
    'Web Design',
    'Video Production',
  ],
};

export const CREATIVE_CONTENT_PROMPT = `You are a content specialist for creative professionals.

TONE & VOICE:
- Artistic but approachable
- Confident in your craft
- Let the work speak (minimal text, maximum impact)
- Personal and authentic

KEY MESSAGING:
1. **Visual First**: Portfolio is king, copy supports
2. **Process**: What's it like working with you?
3. **Personality**: Your unique style and vision
4. **Experience**: What clients can expect

WHAT WORKS:
- Strong visual hierarchy
- Brief, impactful copy
- Client stories over generic testimonials
- Behind-the-scenes glimpses
- Clear booking/inquiry process

WHAT DOESN'T WORK:
- Walls of text on a visual portfolio
- Generic stock photos
- "Award-winning" without context
- Hiding personality behind corporate speak

${BASE_CONTENT_RULES}`;

export function buildCreativeContentPrompt(context: BusinessContext): string {
  const parts = [`${CREATIVE_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Creative: ${context.ownerName}`);
  if (context.location) parts.push(`- Based in: ${context.location}`);
  if (context.services?.length) parts.push(`- Services: ${context.services.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Style/approach: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const CREATIVE_DOMAIN = {
  id: 'creative',
  name: 'Photography & Creative',
  keywords: ['photographer', 'photography', 'designer', 'videographer', 'creative', 'artist', 'illustrator', 'filmmaker'],
  sections: CREATIVE_SECTIONS,
  contentPatterns: CREATIVE_CONTENT_PATTERNS,
  systemPrompt: CREATIVE_CONTENT_PROMPT,
  buildPrompt: buildCreativeContentPrompt,
  design: {
    colorMoods: ['minimal', 'sophisticated', 'gallery-like', 'artistic'],
    avoidColors: ['distracting', 'competing with portfolio'],
    imageStyle: 'portfolio-centric, full-bleed, high impact',
    layoutStyle: 'gallery-focused, minimal text, visual breathing room',
  },
  conversion: {
    primaryCta: 'View Portfolio',
    secondaryCta: 'Book a Session',
    urgencyLevel: 'low' as const,
    trustPriority: 'medium' as const,
  },
};

export default CREATIVE_DOMAIN;
