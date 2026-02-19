/**
 * Testimonials.md Generator
 */

import type { ContentContext } from '../types';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  result: string;
}

/** Domain-specific testimonials */
const DOMAIN_TESTIMONIALS: Record<string, Testimonial[]> = {
  therapist: [
    { quote: 'I finally feel like myself again. The support was exactly what I needed.', author: 'Sarah M.', role: 'Client', result: 'Found clarity' },
    { quote: 'A safe space where I could truly open up. Life-changing experience.', author: 'Michael R.', role: 'Client', result: 'Breakthrough' },
    { quote: 'Compassionate, professional, and genuinely caring. Highly recommend.', author: 'Jennifer L.', role: 'Client', result: 'Healing journey' },
  ],
  fitness: [
    { quote: 'Lost 30 pounds and gained confidence I never knew I had!', author: 'David K.', role: 'Client', result: 'Down 30 lbs' },
    { quote: 'Best investment in myself. The results speak for themselves.', author: 'Amanda S.', role: 'Client', result: 'Transformed' },
    { quote: 'Finally found a trainer who understands my goals. Incredible results.', author: 'Chris T.', role: 'Client', result: 'Goal achieved' },
  ],
  yoga: [
    { quote: "Found peace I didn't know was possible. This practice changed my life.", author: 'Emma W.', role: 'Student', result: 'Inner peace' },
    { quote: 'As a complete beginner, I felt welcomed from day one.', author: 'James P.', role: 'Student', result: 'New practice' },
    { quote: "The instructors truly care about each student's journey.", author: 'Lisa H.', role: 'Student', result: 'Growth' },
  ],
  food: [
    { quote: "Best meal I've had in years. The attention to detail is incredible.", author: 'Robert M.', role: 'Regular Guest', result: 'Amazing food' },
    { quote: 'Our go-to spot for every special occasion. Never disappoints!', author: 'Maria G.', role: 'Frequent Diner', result: 'Always great' },
    { quote: 'Fresh ingredients, creative dishes, wonderful atmosphere.', author: 'Tom B.', role: 'Food Critic', result: '5 stars' },
  ],
  realestate: [
    { quote: 'Found our dream home in just two weeks. Incredible service!', author: 'The Johnsons', role: 'First-Time Buyers', result: 'Dream home' },
    { quote: 'Sold our house above asking price. Expert guidance throughout.', author: 'Sandra L.', role: 'Seller', result: 'Above asking' },
    { quote: 'Made a stressful process feel easy. Highly recommend!', author: 'Mike & Amy', role: 'Buyers', result: 'Smooth closing' },
  ],
  tech: [
    { quote: 'Increased our team productivity by 40%. Game changer.', author: 'Alex C.', role: 'CEO, TechStart', result: '+40% productivity' },
    { quote: 'Finally, software that actually does what it promises.', author: 'Rachel M.', role: 'Operations Lead', result: 'Simplified workflow' },
    { quote: 'The support team is incredible. Always there when we need them.', author: 'Kevin D.', role: 'CTO, ScaleUp', result: 'Great support' },
  ],
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { quote: 'Outstanding service and results. Highly recommend!', author: 'Sarah M.', role: 'Business Owner', result: 'Exceeded expectations' },
  { quote: 'Professional, responsive, and delivered exactly what we needed.', author: 'John D.', role: 'Marketing Director', result: 'Great experience' },
  { quote: 'The team went above and beyond. Will definitely work with them again.', author: 'Emily R.', role: 'Startup Founder', result: 'Highly satisfied' },
];

/** Domain-specific section titles */
const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  therapist: { title: 'Client Experiences', subtitle: 'Stories of healing and growth.' },
  fitness: { title: 'Success Stories', subtitle: 'Real transformations from real people.' },
  yoga: { title: 'Student Stories', subtitle: 'What our community says.' },
  food: { title: 'Guest Reviews', subtitle: 'What our guests are saying.' },
  realestate: { title: 'Client Success', subtitle: 'Happy homeowners share their stories.' },
  tech: { title: 'Customer Stories', subtitle: 'See how teams are succeeding with us.' },
};

const DEFAULT_TITLES = { title: 'What Our Clients Say', subtitle: "Real feedback from people we've helped." };

export function generateTestimonialsMd(businessInfo: any, ctx?: ContentContext): string {
  const testimonials = DOMAIN_TESTIMONIALS[ctx?.domain.id || ''] || DEFAULT_TESTIMONIALS;
  const sectionTitle = SECTION_TITLES[ctx?.domain.id || ''] || DEFAULT_TITLES;

  const testimonialsYaml = testimonials.map(t => {
    const avatarName = encodeURIComponent(t.author.replace(/\./g, ''));
    const avatarUrl = `https://ui-avatars.com/api/?name=${avatarName}&background=random&color=fff&size=80`;
    return `  - quote: "${t.quote}"
    author: "${t.author}"
    role: "${t.role}"
    result: "${t.result}"
    avatar: "${avatarUrl}"`;
  }).join('\n');

  return `---
title: "${sectionTitle.title}"
subtitle: "${sectionTitle.subtitle}"
testimonials:
${testimonialsYaml}
---
`;
}
