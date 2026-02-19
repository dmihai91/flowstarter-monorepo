/**
 * Yoga / Pilates / Meditation Domain Content Agent
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const YOGA_SECTIONS = {
  required: ['hero', 'about', 'classes', 'contact'],
  recommended: ['schedule', 'philosophy', 'testimonials'],
  optional: ['workshops', 'retreats', 'teacher-training', 'blog'],
};

export const YOGA_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Find Your Center',
    'Breathe. Move. Be.',
    'Where Stillness Meets Strength',
    'Your Practice Awaits',
    'Movement as Medicine',
  ],
  softCtas: [
    'Begin Your Practice',
    'Join a Class',
    'Start Your Journey',
    'Find Your Flow',
    'Book Your First Session',
  ],
  classTypes: [
    'Vinyasa Flow',
    'Hatha',
    'Yin & Restorative',
    'Power Yoga',
    'Beginners Welcome',
    'Meditation',
    'Breathwork',
    'Prenatal',
  ],
};

export const YOGA_CONTENT_PROMPT = `You are a content specialist for yoga studios and mindfulness practices.

TONE & VOICE:
- Peaceful and grounded (not preachy or "woo-woo")
- Inclusive and welcoming (all bodies, all levels)
- Authentic (avoid Instagram yoga clichés)
- Warm but not saccharine

KEY MESSAGING:
1. **Accessibility**: "All levels welcome", "No experience needed"
2. **Benefits Beyond Physical**: Mental clarity, stress relief, community
3. **Teacher Connection**: Highlight teacher backgrounds and styles
4. **Practice, Not Performance**: It's personal, not competitive

WHAT WORKS:
- Emphasizing the feeling after practice, not poses
- Teacher bios with personality
- Clear class descriptions with level indicators
- Community aspects (not just solo practice)

WHAT DOESN'T WORK:
- Overly spiritual language that alienates beginners
- Photos of impossible poses
- "Namaste" overuse
- Excluding people who "can't touch their toes"

${BASE_CONTENT_RULES}`;

export function buildYogaContentPrompt(context: BusinessContext): string {
  const parts = [`${YOGA_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Teacher/Owner: ${context.ownerName}`);
  if (context.location) parts.push(`- Location: ${context.location}`);
  if (context.services?.length) parts.push(`- Class styles: ${context.services.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Teaching philosophy: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const YOGA_DOMAIN = {
  id: 'yoga',
  name: 'Yoga & Mindfulness',
  keywords: ['yoga', 'pilates', 'meditation', 'mindfulness', 'breathwork', 'vinyasa', 'hatha', 'wellness studio'],
  sections: YOGA_SECTIONS,
  contentPatterns: YOGA_CONTENT_PATTERNS,
  systemPrompt: YOGA_CONTENT_PROMPT,
  buildPrompt: buildYogaContentPrompt,
  design: {
    colorMoods: ['serene', 'natural', 'earthy', 'soft'],
    avoidColors: ['harsh neon', 'aggressive red'],
    imageStyle: 'natural light, real practitioners, peaceful spaces',
    layoutStyle: 'airy, spacious, breathing room',
  },
  conversion: {
    primaryCta: 'Book Your First Class',
    secondaryCta: 'View Schedule',
    urgencyLevel: 'low' as const,
    trustPriority: 'medium' as const,
  },
};

export default YOGA_DOMAIN;
