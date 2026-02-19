/**
 * Therapist / Counseling / Mental Health Domain Content Agent
 * 
 * Specializes in creating website content for therapy practices.
 * Understands the unique needs: trust, safety, confidentiality,
 * reducing stigma, and making the first step feel approachable.
 */

import { BASE_CONTENT_RULES, type BusinessContext, type SiteContent } from './base';

/**
 * Therapist-specific section recommendations
 */
export const THERAPIST_SECTIONS = {
  required: ['hero', 'about', 'services', 'contact'],
  recommended: ['approach', 'faq', 'testimonials'],
  optional: ['resources', 'insurance', 'rates'],
};

/**
 * Therapist-specific content patterns
 */
export const THERAPIST_CONTENT_PATTERNS = {
  // Headlines that work for therapy sites
  heroHeadlines: [
    'Find Your Way Back to Yourself',
    'A Safe Space to Begin Again',
    'You Don\'t Have to Face This Alone',
    'Healing Starts with Being Heard',
    'Where Clarity Meets Compassion',
  ],
  
  // CTAs that reduce barriers
  softCtas: [
    'Schedule a Free Consultation',
    'Book Your First Session',
    'Let\'s Start a Conversation',
    'Reach Out When You\'re Ready',
    'Take the First Step',
  ],
  
  // Trust signals specific to therapy
  trustSignals: [
    'Licensed & Insured',
    'Confidential & Secure',
    'HIPAA Compliant',
    'Telehealth Available',
    'Flexible Scheduling',
  ],
  
  // Common specializations to highlight
  specializations: [
    'Anxiety & Stress',
    'Depression',
    'Relationship Issues',
    'Trauma & PTSD',
    'Life Transitions',
    'Grief & Loss',
    'Self-Esteem',
    'Work-Life Balance',
  ],
};

/**
 * System prompt for therapist content generation
 */
export const THERAPIST_CONTENT_PROMPT = `You are a content specialist for therapy and mental health practice websites.

YOUR EXPERTISE:
- Understanding the emotional state of potential therapy clients (often anxious, uncertain, vulnerable)
- Creating content that feels safe, warm, and non-judgmental
- Reducing barriers to seeking help
- Building trust before the first session

TONE & VOICE:
- Warm but professional (not clinical or cold)
- Empathetic without being saccharine
- Confident without being preachy
- Accessible (avoid heavy psychological jargon)
- Normalize seeking help ("It takes courage to reach out")

KEY MESSAGING PRINCIPLES:
1. **Safety First**: Emphasize confidentiality, safe space, no judgment
2. **Reduce Shame**: Normalize therapy ("Many people find...", "It's common to...")
3. **Empower**: Focus on their strength in seeking help, not their problems
4. **Clarity**: Be clear about what to expect (process, first session, etc.)
5. **Accessibility**: Low-barrier CTAs ("when you're ready", "no pressure")

WHAT WORKS:
- "You deserve support" messaging
- Explaining what the first session is like (reduces anxiety)
- Acknowledging that reaching out is hard
- Warm, natural photos (not sterile office shots)
- Testimonials that focus on the experience, not diagnosis

WHAT DOESN'T WORK:
- Clinical language ("evidence-based modalities", "therapeutic interventions")
- Fear-based messaging ("Don't suffer alone!")
- Overly positive/toxic positivity ("Just think positive!")
- Generic stock photos of people meditating
- Listing credentials without warmth

${BASE_CONTENT_RULES}

THERAPIST-SPECIFIC SECTIONS:

HERO: Should immediately convey safety and hope. The headline should speak to relief or possibility, not problems. CTA should be soft ("When you're ready").

ABOUT: Tell the therapist's story - why they do this work. Include a warm photo. Humanize without oversharing. Mention approach in accessible terms.

SERVICES/SPECIALIZATIONS: List areas of focus but frame positively ("I help people who are experiencing..." not "I treat disorders such as..."). Group related issues.

APPROACH/PHILOSOPHY: Explain therapeutic style in plain language. What does a session feel like? What can they expect? Reduce the unknown.

FAQ: Address common anxieties: confidentiality, what to expect, insurance, cancellation policy, telehealth options.

TESTIMONIALS: Focus on the experience and feeling, not symptoms or diagnosis. "I finally felt heard" not "My anxiety decreased by 50%".

CONTACT: Multiple contact options, clear response time expectations, reassurance about confidentiality.
`;

/**
 * Generate therapist-specific content based on business context
 */
export function buildTherapistContentPrompt(context: BusinessContext): string {
  const contextParts: string[] = [];
  
  if (context.ownerName) {
    contextParts.push(`- Therapist name: ${context.ownerName}`);
  }
  if (context.location) {
    contextParts.push(`- Location: ${context.location}`);
  }
  if (context.services && context.services.length > 0) {
    contextParts.push(`- Specializations: ${context.services.join(', ')}`);
  }
  if (context.targetAudience) {
    contextParts.push(`- Primary clients: ${context.targetAudience}`);
  }
  if (context.uniqueApproach) {
    contextParts.push(`- Therapeutic approach: ${context.uniqueApproach}`);
  }
  if (context.certifications && context.certifications.length > 0) {
    contextParts.push(`- Credentials: ${context.certifications.join(', ')}`);
  }
  
  const contextSection = contextParts.length > 0 
    ? `\nBUSINESS CONTEXT:\n${contextParts.join('\n')}\n`
    : '';

  return `${THERAPIST_CONTENT_PROMPT}
${contextSection}
Based on this context, generate warm, professional content that will make potential clients feel safe reaching out.`;
}

/**
 * Therapist domain configuration
 */
export const THERAPIST_DOMAIN = {
  id: 'therapist',
  name: 'Therapy & Counseling',
  
  keywords: [
    'therapist', 'therapy', 'counseling', 'counselor', 'psychologist',
    'mental health', 'psychotherapy', 'anxiety', 'depression', 'trauma',
    'couples therapy', 'family therapy', 'lcsw', 'lmft', 'lpc',
  ],
  
  sections: THERAPIST_SECTIONS,
  contentPatterns: THERAPIST_CONTENT_PATTERNS,
  systemPrompt: THERAPIST_CONTENT_PROMPT,
  buildPrompt: buildTherapistContentPrompt,
  
  // Design recommendations
  design: {
    colorMoods: ['calming', 'warm', 'natural', 'soft'],
    avoidColors: ['harsh red', 'neon', 'stark black'],
    imageStyle: 'warm, natural lighting, real environments',
    layoutStyle: 'spacious, breathing room, not cluttered',
  },
  
  // Conversion optimization
  conversion: {
    primaryCta: 'Schedule a Consultation',
    secondaryCta: 'Learn About My Approach',
    urgencyLevel: 'low', // Don't pressure therapy seekers
    trustPriority: 'high',
  },
};

export default THERAPIST_DOMAIN;
