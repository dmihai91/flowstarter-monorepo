/**
 * Beauty / Salon / Spa Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const BEAUTY_SECTIONS = {
  required: ['hero', 'services', 'about', 'contact'],
  recommended: ['gallery', 'team', 'testimonials', 'booking'],
  optional: ['products', 'gift-cards', 'bridal', 'blog'],
};

export const BEAUTY_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Where Beauty Meets Artistry',
    'Look Good. Feel Amazing.',
    'Your Best Self, Elevated',
    'Beauty That\'s Uniquely You',
    'Crafted for You',
  ],
  ctas: [
    'Book Now',
    'Schedule Appointment',
    'View Services',
    'Book Your Visit',
    'Reserve Your Spot',
  ],
  services: [
    'Hair Color & Cuts',
    'Facials & Skincare',
    'Makeup Artistry',
    'Nail Services',
    'Massage & Body',
    'Bridal Packages',
    'Men\'s Grooming',
  ],
};

export const BEAUTY_CONTENT_PROMPT = `You are a content specialist for beauty and wellness businesses.

TONE & VOICE:
- Luxurious but welcoming
- Confident and stylish
- Warm and personable
- Aspirational yet attainable

KEY MESSAGING:
1. **Experience**: It's about how they'll feel, not just look
2. **Expertise**: Showcase skills and training
3. **Environment**: Describe the atmosphere
4. **Convenience**: Easy booking, flexible hours

WHAT WORKS:
- Beautiful imagery of work (hair, makeup, nails)
- Team introductions with personality
- Clear service menus with pricing
- Before/after transformations
- Online booking integration

WHAT DOESN'T WORK:
- Cluttered design competing with visuals
- Missing or hidden pricing
- Outdated portfolio images
- Generic "pamper yourself" messaging

${BASE_CONTENT_RULES}`;

export function buildBeautyContentPrompt(context: BusinessContext): string {
  const parts = [`${BEAUTY_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Owner/Stylist: ${context.ownerName}`);
  if (context.location) parts.push(`- Location: ${context.location}`);
  if (context.services?.length) parts.push(`- Services: ${context.services.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Specialty: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const BEAUTY_DOMAIN = {
  id: 'beauty',
  name: 'Beauty & Wellness',
  keywords: ['salon', 'spa', 'hair', 'stylist', 'makeup', 'esthetician', 'barber', 'nail', 'beauty', 'skincare', 'massage'],
  sections: BEAUTY_SECTIONS,
  contentPatterns: BEAUTY_CONTENT_PATTERNS,
  systemPrompt: BEAUTY_CONTENT_PROMPT,
  buildPrompt: buildBeautyContentPrompt,
  design: {
    colorMoods: ['luxurious', 'elegant', 'clean', 'inviting'],
    avoidColors: ['harsh', 'clinical', 'masculine for feminine-focused'],
    imageStyle: 'polished portfolio, team shots, space ambiance',
    layoutStyle: 'elegant, image-forward, easy navigation',
  },
  conversion: {
    primaryCta: 'Book Now',
    secondaryCta: 'View Services',
    urgencyLevel: 'medium' as const,
    trustPriority: 'medium' as const,
  },
};

export default BEAUTY_DOMAIN;
