/**
 * Restaurant / Cafe / Food Service Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const FOOD_SECTIONS = {
  required: ['hero', 'menu', 'about', 'contact'],
  recommended: ['gallery', 'reservations', 'location', 'hours'],
  optional: ['catering', 'events', 'chef', 'reviews', 'gift-cards'],
};

export const FOOD_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Taste the Difference',
    'Where Every Bite Tells a Story',
    'Fresh. Local. Delicious.',
    'A Culinary Experience Awaits',
    'Good Food, Good People',
  ],
  ctas: [
    'View Menu',
    'Make a Reservation',
    'Order Online',
    'Book a Table',
    'See Today\'s Specials',
  ],
  highlights: [
    'Farm to Table',
    'House-Made',
    'Local Ingredients',
    'Chef\'s Specials',
    'Seasonal Menu',
    'Private Dining',
    'Catering Available',
  ],
};

export const FOOD_CONTENT_PROMPT = `You are a content specialist for restaurants and food businesses.

TONE & VOICE:
- Appetizing and sensory
- Warm and welcoming
- Authentic to the cuisine/concept
- Community-focused

KEY MESSAGING:
1. **The Food**: Hero the menu, describe dishes enticingly
2. **The Story**: What makes this place special?
3. **The Experience**: Atmosphere, service, vibe
4. **Convenience**: Hours, location, reservations, delivery

WHAT WORKS:
- Mouthwatering food photography
- Easy-to-read menus with descriptions
- Clear hours and location info
- Online reservation/ordering
- Chef/owner story

WHAT DOESN'T WORK:
- PDF-only menus
- Missing hours or outdated info
- No food photos
- Hard to find address
- Complicated reservation process

${BASE_CONTENT_RULES}`;

export function buildFoodContentPrompt(context: BusinessContext): string {
  const parts = [`${FOOD_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Owner/Chef: ${context.ownerName}`);
  if (context.location) parts.push(`- Location: ${context.location}`);
  if (context.services?.length) parts.push(`- Cuisine/Offerings: ${context.services.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Concept: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const FOOD_DOMAIN = {
  id: 'food',
  name: 'Restaurant & Food',
  keywords: ['restaurant', 'cafe', 'bakery', 'catering', 'chef', 'food', 'dining', 'bistro', 'bar', 'coffee shop', 'pizzeria'],
  sections: FOOD_SECTIONS,
  contentPatterns: FOOD_CONTENT_PATTERNS,
  systemPrompt: FOOD_CONTENT_PROMPT,
  buildPrompt: buildFoodContentPrompt,
  design: {
    colorMoods: ['appetizing', 'warm', 'inviting', 'authentic'],
    avoidColors: ['clinical', 'unappetizing blues/greens'],
    imageStyle: 'food photography, ambiance shots, team',
    layoutStyle: 'menu-focused, easy navigation, mobile-friendly',
  },
  conversion: {
    primaryCta: 'Make a Reservation',
    secondaryCta: 'View Menu',
    urgencyLevel: 'medium' as const,
    trustPriority: 'low' as const,
  },
};

export default FOOD_DOMAIN;
