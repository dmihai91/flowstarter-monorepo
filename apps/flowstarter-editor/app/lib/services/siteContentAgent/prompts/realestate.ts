/**
 * Real Estate Domain
 */

import { BASE_CONTENT_RULES, type BusinessContext } from './base';

export const REALESTATE_SECTIONS = {
  required: ['hero', 'listings', 'about', 'contact'],
  recommended: ['services', 'testimonials', 'neighborhoods', 'market-insights'],
  optional: ['sold', 'blog', 'resources', 'mortgage-calculator'],
};

export const REALESTATE_CONTENT_PATTERNS = {
  heroHeadlines: [
    'Find Your Perfect Home',
    'Your Dream Home Awaits',
    'Local Expertise, Personal Service',
    'Making Moves, Building Dreams',
    'Home Is Where Your Story Begins',
  ],
  ctas: [
    'Search Listings',
    'Get a Home Valuation',
    'Schedule a Showing',
    'Contact Me',
    'Start Your Search',
  ],
  services: [
    'Buyer Representation',
    'Seller Representation',
    'Market Analysis',
    'Investment Properties',
    'First-Time Buyers',
    'Luxury Homes',
    'Relocation Services',
  ],
};

export const REALESTATE_CONTENT_PROMPT = `You are a content specialist for real estate professionals.

TONE & VOICE:
- Knowledgeable and local
- Warm and approachable
- Confident without being pushy
- Helpful and informative

KEY MESSAGING:
1. **Local Expertise**: Neighborhood knowledge, market insights
2. **Track Record**: Homes sold, happy clients
3. **Process**: What's it like working with you?
4. **Availability**: Responsive, accessible

WHAT WORKS:
- Beautiful property photography
- Clear listing information
- Neighborhood guides
- Client success stories
- Market updates and insights
- Easy property search

WHAT DOESN'T WORK:
- Outdated listings
- Poor quality photos
- No personality/agent info
- Hard to contact
- Missing neighborhood context

${BASE_CONTENT_RULES}`;

export function buildRealestateContentPrompt(context: BusinessContext): string {
  const parts = [`${REALESTATE_CONTENT_PROMPT}\n\nBUSINESS CONTEXT:`];
  if (context.ownerName) parts.push(`- Agent: ${context.ownerName}`);
  if (context.location) parts.push(`- Market: ${context.location}`);
  if (context.services?.length) parts.push(`- Specialties: ${context.services.join(', ')}`);
  if (context.uniqueApproach) parts.push(`- Approach: ${context.uniqueApproach}`);
  return parts.join('\n');
}

export const REALESTATE_DOMAIN = {
  id: 'realestate',
  name: 'Real Estate',
  keywords: ['realtor', 'real estate', 'agent', 'broker', 'property', 'homes', 'houses', 'listings', 'mortgage'],
  sections: REALESTATE_SECTIONS,
  contentPatterns: REALESTATE_CONTENT_PATTERNS,
  systemPrompt: REALESTATE_CONTENT_PROMPT,
  buildPrompt: buildRealestateContentPrompt,
  design: {
    colorMoods: ['trustworthy', 'professional', 'warm', 'local'],
    avoidColors: ['cold', 'corporate'],
    imageStyle: 'property photos, neighborhood shots, agent portraits',
    layoutStyle: 'listing-focused, search-friendly, mobile-optimized',
  },
  conversion: {
    primaryCta: 'Search Listings',
    secondaryCta: 'Get a Home Valuation',
    urgencyLevel: 'medium' as const,
    trustPriority: 'high' as const,
  },
};

export default REALESTATE_DOMAIN;
