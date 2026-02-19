/**
 * Tech / SaaS / Startup Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const TECH_SECTIONS = {
  required: ['hero', 'features', 'about', 'contact'],
  recommended: ['how-it-works', 'pricing', 'testimonials', 'integrations'],
  optional: ['demo', 'case-studies', 'blog', 'api-docs', 'security'],
};

export const TECH_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Work Smarter, Not Harder',
    'The Future of [Industry]',
    'Simplify Your [Process]',
    'Built for Teams That Ship',
    'Your [Tool] Superpower',
  ],
  ctas: [
    'Start Free Trial',
    'Get Started',
    'Request a Demo',
    'See It in Action',
    'Try It Free',
  ],
  features: [
    'Easy Integration',
    'Real-Time Analytics',
    'Team Collaboration',
    'Automation',
    'API Access',
    'Enterprise Security',
    '24/7 Support',
  ],
};

export const TECH_CONTENT_PROMPT = `You are a content specialist for tech products and SaaS companies.

TONE & VOICE:
- Clear and benefit-focused
- Modern but not jargon-heavy
- Confident and innovative
- Human (not robotic or corporate)

KEY MESSAGING:
1. **Problem/Solution**: What pain do you solve?
2. **Benefits > Features**: What outcomes do users get?
3. **Social Proof**: Who uses it? What results?
4. **Easy Start**: Low friction to try

WHAT WORKS:
- Clear value proposition above fold
- Visual feature explanations
- Transparent pricing
- Social proof (logos, testimonials)
- Easy signup/trial flow
- Product screenshots/demos

WHAT DOESN'T WORK:
- Feature lists without context
- Hidden pricing
- Too much jargon
- No social proof
- Long signup processes
- No clear CTA

${BASE_CONTENT_RULES}`;

export function buildTechContentPrompt(context: BusinessContext): string {
  const parts = [`${TECH_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Company: ${context.ownerName}`);
  if (context.services?.length) parts.push(`- Key features: ${context.services.join(', ')}`);
  if (context.targetAudience) parts.push(`- Target users: ${context.targetAudience}`);
  if (context.uniqueApproach) parts.push(`- Differentiation: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const TECH_DOMAIN = {
  id: 'tech',
  name: 'Tech & SaaS',
  keywords: ['saas', 'software', 'app', 'startup', 'tech', 'platform', 'tool', 'api', 'web app', 'mobile app', 'automation'],
  sections: TECH_SECTIONS,
  contentPatterns: TECH_CONTENT_PATTERNS,
  systemPrompt: TECH_CONTENT_PROMPT,
  buildPrompt: buildTechContentPrompt,
  design: {
    colorMoods: ['modern', 'clean', 'innovative', 'trustworthy'],
    avoidColors: ['dated', 'overly corporate'],
    imageStyle: 'product screenshots, UI mockups, team photos',
    layoutStyle: 'modern, spacious, conversion-focused',
  },
  conversion: {
    primaryCta: 'Start Free Trial',
    secondaryCta: 'See How It Works',
    urgencyLevel: 'medium' as const,
    trustPriority: 'medium' as const,
  },
};

export default TECH_DOMAIN;
