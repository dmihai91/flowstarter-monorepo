/**
 * Fitness / Personal Training / Gym Domain Content Agent
 * 
 * Specializes in creating website content for fitness businesses.
 * Understands the unique needs: motivation, transformation stories,
 * credibility through results, and energizing calls to action.
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

/**
 * Fitness-specific section recommendations
 */
export const FITNESS_SECTIONS = {
  required: ['hero', 'programs', 'about', 'contact'],
  recommended: ['results', 'testimonials', 'pricing', 'faq'],
  optional: ['schedule', 'nutrition', 'blog'],
};

/**
 * Fitness-specific content patterns
 */
export const FITNESS_CONTENT_PATTERNS = {
  // Headlines that motivate action
  heroHeadlines: [
    'Transform Your Body. Transform Your Life.',
    'Your Strongest Self Starts Here',
    'Results-Driven Training That Works',
    'Unlock Your Full Potential',
    'Where Champions Are Made',
  ],
  
  // CTAs that drive commitment
  actionCtas: [
    'Start Your Transformation',
    'Claim Your Free Session',
    'Join the Program',
    'Begin Your Journey',
    'Get Your Custom Plan',
  ],
  
  // Trust signals for fitness
  trustSignals: [
    'Certified Personal Trainer',
    '500+ Transformations',
    'Customized Programs',
    'Nutrition Guidance Included',
    'Flexible Scheduling',
  ],
  
  // Common programs to highlight
  programs: [
    'Weight Loss',
    'Muscle Building',
    'Strength Training',
    'HIIT & Conditioning',
    'Sports Performance',
    'Functional Fitness',
    'Body Recomposition',
    '1-on-1 Coaching',
  ],
};

/**
 * System prompt for fitness content generation
 */
export const FITNESS_CONTENT_PROMPT = `You are a content specialist for fitness and personal training websites.

YOUR EXPERTISE:
- Understanding what motivates people to start (and stick with) fitness
- Creating content that inspires action without being cheesy
- Showcasing transformations and results authentically
- Building credibility through demonstrated expertise

TONE & VOICE:
- Energetic and motivating (not aggressive or preachy)
- Confident and authoritative (you know what works)
- Supportive (not judgmental about starting point)
- Direct and action-oriented
- Authentic (avoid clichés like "no pain no gain")

KEY MESSAGING PRINCIPLES:
1. **Results Focus**: Show transformations, highlight outcomes
2. **Credibility**: Certifications, experience, methodology
3. **Accessibility**: "Everyone starts somewhere" - not intimidating
4. **Specificity**: Concrete programs, clear expectations
5. **Urgency**: Motivate action, limited spots, start now

WHAT WORKS:
- Before/after stories (with context and timeframes)
- Clear program structures with expected outcomes
- Trainer credentials and personal fitness journey
- Addressing common objections (time, cost, intimidation)
- Social proof through numbers ("500+ clients transformed")

WHAT DOESN'T WORK:
- Shame-based messaging ("Tired of being out of shape?")
- Unrealistic promises ("6-pack in 30 days!")
- Generic stock photos of extremely fit models
- Too much fitness jargon without explanation
- Ignoring the mental/lifestyle aspects of fitness

${BASE_CONTENT_RULES}

FITNESS-SPECIFIC SECTIONS:

HERO: Bold, energetic. Show the trainer in action or a powerful transformation shot. Headline should promise transformation. Strong CTA with urgency.

PROGRAMS/SERVICES: Clear tiers with outcomes. What's included in each? Who is it for? Duration and expected results. Make it easy to choose.

ABOUT/TRAINER: Personal story - why fitness? Credentials matter but so does relatability. Show personality. Include certifications.

RESULTS/TRANSFORMATIONS: Real stories with real people. Include timeframe and context. Before/after photos with permission. Quote the client.

TESTIMONIALS: Focus on life changes, not just physical. "I have more energy for my kids" > "I lost 20 pounds". Include variety of starting points.

PRICING/PACKAGES: Clear pricing builds trust. Show value, not just cost. Include what's in each tier. Make comparison easy.

FAQ: Address objections: "I've never worked out before", "I don't have much time", "I've tried everything". Answer honestly.

CTA BANNER: Mid-page energy boost. Limited spots, start date, urgency without being sleazy. "Next cohort starts Monday - 3 spots left"
`;

/**
 * Generate fitness-specific content based on business context
 */
export function buildFitnessContentPrompt(context: BusinessContext): string {
  const contextParts: string[] = [];
  
  if (context.ownerName) {
    contextParts.push(`- Trainer name: ${context.ownerName}`);
  }
  if (context.location) {
    contextParts.push(`- Location: ${context.location}`);
  }
  if (context.services && context.services.length > 0) {
    contextParts.push(`- Programs offered: ${context.services.join(', ')}`);
  }
  if (context.targetAudience) {
    contextParts.push(`- Target clients: ${context.targetAudience}`);
  }
  if (context.uniqueApproach) {
    contextParts.push(`- Training methodology: ${context.uniqueApproach}`);
  }
  if (context.certifications && context.certifications.length > 0) {
    contextParts.push(`- Certifications: ${context.certifications.join(', ')}`);
  }
  
  const contextSection = contextParts.length > 0 
    ? `\nBUSINESS CONTEXT:\n${contextParts.join('\n')}\n`
    : '';

  return `${FITNESS_CONTENT_PROMPT}
${contextSection}
Based on this context, generate energetic, motivating content that will inspire visitors to take action.`;
}

/**
 * Fitness domain configuration
 */
export const FITNESS_DOMAIN = {
  id: 'fitness',
  name: 'Fitness & Personal Training',
  
  keywords: [
    'personal trainer', 'fitness', 'gym', 'workout', 'training',
    'strength', 'conditioning', 'crossfit', 'hiit', 'weight loss',
    'muscle', 'bodybuilding', 'athletic', 'sports performance',
  ],
  
  sections: FITNESS_SECTIONS,
  contentPatterns: FITNESS_CONTENT_PATTERNS,
  systemPrompt: FITNESS_CONTENT_PROMPT,
  buildPrompt: buildFitnessContentPrompt,
  
  // Design recommendations
  design: {
    colorMoods: ['bold', 'energetic', 'powerful', 'dynamic'],
    avoidColors: ['pastel', 'muted', 'overly soft'],
    imageStyle: 'action shots, real training, authentic sweat',
    layoutStyle: 'bold typography, strong contrast, dynamic',
  },
  
  // Conversion optimization
  conversion: {
    primaryCta: 'Start Your Transformation',
    secondaryCta: 'See Success Stories',
    urgencyLevel: 'medium', // Some urgency is appropriate
    trustPriority: 'medium', // Results matter more than credentials alone
  },
};

export default FITNESS_DOMAIN;
