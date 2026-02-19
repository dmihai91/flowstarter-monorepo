/**
 * Generic / Fallback category
 *
 * Used when no specific category matches. These names need to be
 * versatile enough to work across industries while still being
 * distinctive and memorable.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const GENERIC_CATEGORY = {
  id: 'generic',
  keywords: [], // This is the fallback - no specific keywords

  systemPrompt: `You are a world-class brand naming expert.

YOUR TASK: Generate 3 distinctive, memorable business names based on the project description.

NAMING PHILOSOPHY:
The best business names share these qualities:
1. **Memorable** - Easy to remember after hearing once
2. **Distinctive** - Stands out from competitors
3. **Appropriate** - Fits the business type and audience
4. **Speakable** - Sounds good when said aloud
5. **Ownable** - Could become a recognized brand

APPROACH BY BUSINESS TYPE:
- For SERVICE businesses: Names that feel premium and trustworthy. Unexpected metaphors that intrigue. Crisp invented words.
- For CREATIVE businesses: Evocative, artistic names. Sensory concepts. Poetic fragments.
- For FOOD/HOSPITALITY: Warm, textural names. Ingredient-inspired. Place-evoking.
- For TECH/SAAS: Modern, sharp, 1-2 syllable names. Verb-like energy.
- For PROFESSIONAL services: Precise, authoritative names. Material metaphors.
- For E-COMMERCE/RETAIL: Short, punchy, shoppable names.

NAME STYLES TO CONSIDER:
1. **Bold metaphor**: An unexpected word that captures the energy
2. **Evocative phrase**: 2-3 words that paint a vivid picture
3. **Invented word**: A new word that feels real
4. **Object or texture**: Something concrete and memorable

${BASE_RULES}

Think carefully about the business type, then generate 3 names that a founder would genuinely be proud to use.

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'The Practice',
    'Studio',
    'Keystone',
    'Cornerstone',
    'Basecamp',
    'The Workshop',
    'Foundation',
    'Anchor',
    'Form',
    'Framework',
    'Craft',
    'The Lab',
    'Made',
    'Build',
    'Works',
  ],

  refinementHints: {
    punchy: 'Short and powerful: Form, Mark, Push, Make, Build',
    professional: 'Established feel: Foundation, Framework, The Practice, Cornerstone',
    creative: 'Distinctive angles: The Lab, Made, Craft, Works',
    shorter: 'Single strong words: Form, Make, Craft, Build, Mark',
    warm: 'Approachable: The Workshop, Handmade, Craft, Studio',
  },
};

export default GENERIC_CATEGORY;
