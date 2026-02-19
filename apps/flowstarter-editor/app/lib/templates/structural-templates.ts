/**
 * Structural Template Archetypes
 * 
 * 6 conversion-optimized templates organized by business model, not vertical.
 * Each archetype represents a proven persuasion structure.
 * 
 * Maps legacy 12 templates → 6 archetypes for streamlined selection.
 */

import type { QuickProfile, BusinessGoal, OfferType, BrandTone } from '~/components/editor/editor-chat/types';

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE ARCHETYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type TemplateArchetype = 
  | 'authority-builder'
  | 'service-provider'
  | 'portfolio-showcase'
  | 'course-creator'
  | 'local-expert'
  | 'event-host';

export interface ArchetypeDefinition {
  id: TemplateArchetype;
  name: string;
  tagline: string;
  description: string;
  structure: string[];
  bestFor: string[];
  goalAlignment: BusinessGoal[];
  offerAlignment: OfferType[];
  toneAlignment: BrandTone[];
  icon: string;
}

export const TEMPLATE_ARCHETYPES: Record<TemplateArchetype, ArchetypeDefinition> = {
  'authority-builder': {
    id: 'authority-builder',
    name: 'Authority Builder',
    tagline: 'Establish expertise, generate leads',
    description: 'Perfect for coaches, consultants, and experts who sell high-ticket services. Emphasizes credibility, proof, and clear next steps.',
    structure: ['Hero', 'Problem Statement', 'Solution', 'Proof/Testimonials', 'CTA'],
    bestFor: ['Coaches', 'Consultants', 'Business advisors', 'Executive coaches'],
    goalAlignment: ['leads', 'bookings'],
    offerAlignment: ['high-ticket'],
    toneAlignment: ['professional', 'bold'],
    icon: 'briefcase',
  },
  
  'service-provider': {
    id: 'service-provider',
    name: 'Service Provider',
    tagline: 'Book appointments, build trust',
    description: 'Ideal for therapists, wellness practitioners, and health professionals. Focuses on trust, services, and easy booking.',
    structure: ['Services Overview', 'About/Credibility', 'Booking CTA', 'Trust Signals'],
    bestFor: ['Therapists', 'Wellness practitioners', 'Healthcare providers', 'Counselors'],
    goalAlignment: ['bookings'],
    offerAlignment: ['low-ticket', 'high-ticket'],
    toneAlignment: ['professional', 'friendly'],
    icon: 'heart-pulse',
  },
  
  'portfolio-showcase': {
    id: 'portfolio-showcase',
    name: 'Portfolio Showcase',
    tagline: 'Show your work, get hired',
    description: 'Best for creatives and freelancers. Leads with visual work samples and makes it easy to inquire about projects.',
    structure: ['Work Gallery', 'Process/Approach', 'Hire Me CTA', 'Contact'],
    bestFor: ['Photographers', 'Designers', 'Videographers', 'Artists', 'Freelancers'],
    goalAlignment: ['leads'],
    offerAlignment: ['high-ticket', 'low-ticket'],
    toneAlignment: ['bold', 'professional'],
    icon: 'palette',
  },
  
  'course-creator': {
    id: 'course-creator',
    name: 'Course Creator',
    tagline: 'Teach and sell online',
    description: 'Optimized for selling courses, programs, and educational content. Highlights transformation and curriculum.',
    structure: ['Transformation Promise', 'Curriculum Overview', 'Testimonials', 'Enroll CTA'],
    bestFor: ['Course creators', 'Tutors', 'Language teachers', 'Music teachers', 'Online educators'],
    goalAlignment: ['sales'],
    offerAlignment: ['low-ticket', 'high-ticket'],
    toneAlignment: ['friendly', 'professional'],
    icon: 'graduation-cap',
  },
  
  'local-expert': {
    id: 'local-expert',
    name: 'Local Expert',
    tagline: 'Serve your community',
    description: 'Great for local service providers. Emphasizes location, services, and easy booking with local SEO in mind.',
    structure: ['Services', 'Location/Map', 'Booking', 'Reviews'],
    bestFor: ['Beauty professionals', 'Fitness trainers', 'Local coaches', 'Personal services'],
    goalAlignment: ['bookings'],
    offerAlignment: ['low-ticket'],
    toneAlignment: ['friendly', 'bold'],
    icon: 'map-pin',
  },
  
  'event-host': {
    id: 'event-host',
    name: 'Event Host',
    tagline: 'Fill your workshops & webinars',
    description: 'Perfect for workshop facilitators and webinar hosts. Focuses on event details and urgency-driven registration.',
    structure: ['Event Details', 'Speaker/Host Bio', 'Schedule/Agenda', 'Register CTA'],
    bestFor: ['Workshop facilitators', 'Webinar hosts', 'Retreat organizers', 'Seminar leaders'],
    goalAlignment: ['leads', 'sales'],
    offerAlignment: ['low-ticket', 'free'],
    toneAlignment: ['bold', 'friendly'],
    icon: 'mic',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY TEMPLATE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps old 12 templates to new 6 archetypes.
 * Used for migration and backwards compatibility.
 */
export const LEGACY_TEMPLATE_MAPPING: Record<string, TemplateArchetype> = {
  'academic-tutor': 'course-creator',
  'beauty-stylist': 'local-expert',
  'coach-pro': 'authority-builder',
  'coding-bootcamp': 'course-creator',
  'creative-portfolio': 'portfolio-showcase',
  'edu-course-creator': 'course-creator',
  'fitness-coach': 'local-expert',
  'language-teacher': 'course-creator',
  'music-teacher': 'course-creator',
  'therapist-care': 'service-provider',
  'wellness-holistic': 'service-provider',
  'workshop-host': 'event-host',
};

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

interface ArchetypeScore {
  archetype: TemplateArchetype;
  score: number;
  reasons: string[];
}

/**
 * Score an archetype based on QuickProfile match.
 * Higher score = better fit.
 */
function scoreArchetype(
  archetype: ArchetypeDefinition,
  profile: QuickProfile,
): ArchetypeScore {
  let score = 0;
  const reasons: string[] = [];
  
  // Goal alignment (most important)
  if (archetype.goalAlignment.includes(profile.goal)) {
    score += 40;
    reasons.push(`Matches your ${profile.goal} goal`);
  }
  
  // Offer type alignment
  if (archetype.offerAlignment.includes(profile.offerType)) {
    score += 30;
    reasons.push(`Great for ${profile.offerType} offers`);
  }
  
  // Tone alignment
  if (archetype.toneAlignment.includes(profile.tone)) {
    score += 20;
    reasons.push(`Fits your ${profile.tone} brand style`);
  }
  
  // Primary goal match gets bonus
  if (archetype.goalAlignment[0] === profile.goal) {
    score += 10;
    reasons.push('Primary use case');
  }
  
  return {
    archetype: archetype.id,
    score,
    reasons,
  };
}

/**
 * Get recommended archetypes based on QuickProfile.
 * Returns 3 recommendations: primary, secondary, and wild card.
 */
export function recommendArchetypes(profile: QuickProfile): ArchetypeScore[] {
  const scores = Object.values(TEMPLATE_ARCHETYPES)
    .map(archetype => scoreArchetype(archetype, profile))
    .sort((a, b) => b.score - a.score);
  
  // Take top 3
  return scores.slice(0, 3);
}

/**
 * Get the best single archetype for a profile.
 */
export function getBestArchetype(profile: QuickProfile): TemplateArchetype {
  const recommendations = recommendArchetypes(profile);
  return recommendations[0].archetype;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS TYPE TO ARCHETYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps detected business categories to recommended archetypes.
 * Used when we have category from auto-inference but no explicit profile.
 */
export const CATEGORY_TO_ARCHETYPE: Record<string, TemplateArchetype[]> = {
  'coaching': ['authority-builder', 'event-host', 'course-creator'],
  'mental-health': ['service-provider', 'authority-builder'],
  'fitness': ['local-expert', 'course-creator', 'authority-builder'],
  'wellness': ['service-provider', 'local-expert', 'authority-builder'],
  'beauty': ['local-expert', 'portfolio-showcase'],
  'creative': ['portfolio-showcase', 'authority-builder', 'local-expert'],
  'education': ['course-creator', 'authority-builder', 'event-host'],
};

/**
 * Get archetype recommendations based on business category.
 */
export function getArchetypesForCategory(category: string): TemplateArchetype[] {
  return CATEGORY_TO_ARCHETYPE[category] || ['authority-builder', 'service-provider', 'local-expert'];
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE SLUG RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps archetypes to actual template slugs in the library.
 * Update these when adding new templates.
 */
export const ARCHETYPE_TO_TEMPLATES: Record<TemplateArchetype, string[]> = {
  'authority-builder': ['coach-pro'],
  'service-provider': ['therapist-care', 'wellness-holistic'],
  'portfolio-showcase': ['creative-portfolio'],
  'course-creator': ['edu-course-creator', 'coding-bootcamp', 'language-teacher', 'music-teacher'],
  'local-expert': ['fitness-coach', 'beauty-stylist'],
  'event-host': ['workshop-host'],
};

/**
 * Get actual template slugs for recommended archetypes.
 */
export function getTemplateSlugsForProfile(profile: QuickProfile): string[] {
  const archetypes = recommendArchetypes(profile);
  const slugs: string[] = [];
  
  for (const { archetype } of archetypes) {
    const templates = ARCHETYPE_TO_TEMPLATES[archetype];
    if (templates && templates.length > 0) {
      // Take first template from each archetype
      slugs.push(templates[0]);
    }
  }
  
  return slugs;
}

export default TEMPLATE_ARCHETYPES;
