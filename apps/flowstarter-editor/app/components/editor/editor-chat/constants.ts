/**
 * Editor chat constants facade.
 * Re-exports from split modules + remaining config (fonts, services, categories, suggestions).
 */

import type { SystemFont, SuggestedReply, CategoryColors } from './types';
import { en } from '~/lib/i18n/locales/en';

// Re-export reply and message constants for backward compatibility
export { REPLY_KEYS, REPLY_LABELS, getReplyLabel, createReply, SUGGESTED_REPLIES } from './reply-constants';
export type { ReplyKey } from './reply-constants';
export { MESSAGE_KEYS, MESSAGE_LABELS, getMessage } from './message-constants';
export type { MessageKey } from './message-constants';

export const DEFAULT_PROJECT_NAME_GENERATION = 'My Project';

export const FONT_PAIRINGS: SystemFont[] = [
  // Clean & Modern
  { id: 'modern', name: 'Modern', heading: 'Inter', body: 'Inter' },
  { id: 'minimal', name: 'Minimal', heading: 'DM Sans', body: 'DM Sans' },
  { id: 'geometric', name: 'Geometric', heading: 'Poppins', body: 'Poppins' },

  // Professional & Editorial
  { id: 'classic', name: 'Classic', heading: 'Playfair Display', body: 'Source Sans Pro' },
  { id: 'editorial', name: 'Editorial', heading: 'Lora', body: 'Open Sans' },
  { id: 'professional', name: 'Professional', heading: 'Merriweather', body: 'Open Sans' },

  // Elegant & Feminine
  { id: 'elegant', name: 'Elegant', heading: 'Cormorant Garamond', body: 'Raleway' },
  { id: 'luxe', name: 'Luxe', heading: 'Libre Baskerville', body: 'Lato' },

  // Bold & Impactful
  { id: 'bold', name: 'Bold', heading: 'Montserrat', body: 'Open Sans' },
  { id: 'condensed', name: 'Condensed', heading: 'Bebas Neue', body: 'Rubik' },

  // Friendly & Rounded
  { id: 'friendly', name: 'Friendly', heading: 'Nunito', body: 'Nunito' },
  { id: 'playful', name: 'Playful', heading: 'Quicksand', body: 'Quicksand' },
];

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&family=Lora:wght@400;500;600;700&family=Open+Sans:wght@400;600&family=Cormorant+Garamond:wght@400;500;600;700&family=Raleway:wght@400;500&family=Montserrat:wght@400;600;700;800&family=Bebas+Neue&family=Rubik:wght@400;500&family=Nunito:wght@400;600;700&family=Merriweather:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Lato:wght@400;700&family=Quicksand:wght@400;500;600;700&display=swap';

/** Service business prompts with brief descriptions */
export const SERVICE_PROMPTS: SuggestedReply[] = [
  // Coaches & Consultants
  { id: 'example-coach', text: en.quickIdeas['life-coach'] },
  { id: 'example-business-coach', text: en.quickIdeas['business-coach'] },
  { id: 'example-career-coach', text: en.quickIdeas['career-coach'] },

  // Fitness & Wellness
  { id: 'example-trainer', text: en.quickIdeas['personal-trainer'] },
  { id: 'example-yoga', text: en.quickIdeas['yoga-instructor'] },
  { id: 'example-nutritionist', text: en.quickIdeas['nutritionist'] },

  // Mental Health & Therapy
  { id: 'example-therapist', text: en.quickIdeas['therapist'] },
  { id: 'example-counselor', text: en.quickIdeas['counselor'] },

  // Creative
  { id: 'example-photographer', text: en.quickIdeas['photographer'] },
  { id: 'example-designer', text: en.quickIdeas['designer'] },
  { id: 'example-videographer', text: en.quickIdeas['videographer'] },

  // Beauty & Styling
  { id: 'example-stylist', text: en.quickIdeas['stylist'] },
  { id: 'example-makeup', text: en.quickIdeas['makeup-artist'] },
  { id: 'example-esthetician', text: en.quickIdeas['esthetician'] },

  // Education
  { id: 'example-tutor', text: en.quickIdeas['private-tutor'] },
  { id: 'example-music', text: en.quickIdeas['music-teacher'] },

  // Wellness & Local Services
  { id: 'example-massage', text: en.quickIdeas['massage-therapist'] },
  { id: 'example-wellness', text: en.quickIdeas['wellness-coach'] },
];

export function getRandomServicePrompts(count = 5): SuggestedReply[] {
  const shuffled = [...SERVICE_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getCategoryColors(category: string): CategoryColors {
  const colors: Record<string, CategoryColors> = {
    landing: {
      bg: '#4D5DD9',
      text: '#ffffff',
      gradient: 'from-[#4D5DD9]/40 to-[#C1C8FF]/30',
    },
    'local-business': {
      bg: '#2563eb',
      text: '#ffffff',
      gradient: 'from-blue-600/40 to-sky-500/30',
    },
    portfolio: {
      bg: '#7c3aed',
      text: '#ffffff',
      gradient: 'from-purple-600/40 to-violet-500/30',
    },
    'personal-brand': {
      bg: '#ea580c',
      text: '#ffffff',
      gradient: 'from-orange-600/40 to-amber-500/30',
    },
    blog: {
      bg: '#16a34a',
      text: '#ffffff',
      gradient: 'from-green-600/40 to-emerald-500/30',
    },
    ecommerce: {
      bg: '#ca8a04',
      text: '#ffffff',
      gradient: 'from-yellow-600/40 to-amber-500/30',
    },
    'saas-product': {
      bg: '#db2777',
      text: '#ffffff',
      gradient: 'from-pink-600/40 to-rose-500/30',
    },
  };
  return (
    colors[category] || {
      bg: '#4D5DD9',
      text: '#ffffff',
      gradient: 'from-[#4D5DD9]/40 to-[#C1C8FF]/30',
    }
  );
}

interface ReadySuggestionsContext {
  templateId?: string;
  businessType?: string;
  projectName?: string;
}

const CONTENT_SUGGESTIONS: SuggestedReply[] = [
  { id: 'headline', text: 'Make the headline more compelling' },
  { id: 'story', text: 'Add your personal story' },
  { id: 'benefits', text: 'Highlight the key benefits' },
  { id: 'cta', text: 'Improve the call-to-action' },
];

const VISUAL_SUGGESTIONS: SuggestedReply[] = [
  { id: 'photos', text: 'Add professional photos' },
  { id: 'logo', text: 'Add my logo' },
  { id: 'colors', text: 'Adjust the color scheme' },
  { id: 'spacing', text: 'Improve the layout spacing' },
];

const FEATURE_SUGGESTIONS: SuggestedReply[] = [
  { id: 'contact-form', text: 'Add a contact form' },
  { id: 'booking', text: 'Add booking/appointment system' },
  { id: 'testimonials', text: 'Add client testimonials' },
  { id: 'gallery', text: 'Create a photo gallery' },
  { id: 'faq', text: 'Add an FAQ section' },
  { id: 'social', text: 'Add social media links' },
  { id: 'map', text: 'Add a location map' },
  { id: 'pricing', text: 'Add pricing information' },
];

const BUSINESS_SPECIFIC_SUGGESTIONS: Record<string, SuggestedReply[]> = {
  coach: [
    { id: 'coaching-packages', text: 'Add coaching packages & pricing' },
    { id: 'success-stories', text: 'Share client success stories' },
    { id: 'free-consult', text: 'Offer a free consultation' },
  ],
  fitness: [
    { id: 'workout-plans', text: 'Add workout programs' },
    { id: 'transformations', text: 'Show before/after transformations' },
    { id: 'class-schedule', text: 'Add class schedule' },
  ],
  yoga: [
    { id: 'class-types', text: 'Describe yoga class types' },
    { id: 'instructor', text: 'Share your yoga journey' },
    { id: 'retreat', text: 'Promote a retreat or workshop' },
  ],
  salon: [
    { id: 'services-menu', text: 'Add services & pricing menu' },
    { id: 'stylist-portfolio', text: 'Show stylist portfolios' },
    { id: 'book-online', text: 'Enable online booking' },
  ],
  spa: [
    { id: 'treatment-menu', text: 'Create treatment menu' },
    { id: 'spa-packages', text: 'Add spa packages' },
    { id: 'gift-cards', text: 'Offer gift cards' },
  ],
  dental: [
    { id: 'services-list', text: 'List dental services' },
    { id: 'insurance', text: 'Add insurance information' },
    { id: 'team', text: 'Introduce your team' },
  ],
  photography: [
    { id: 'portfolio', text: 'Expand the portfolio gallery' },
    { id: 'packages', text: 'Add photography packages' },
    { id: 'style', text: 'Describe your shooting style' },
  ],
  realestate: [
    { id: 'listings', text: 'Add property listings' },
    { id: 'neighborhoods', text: 'Feature neighborhoods you serve' },
    { id: 'credentials', text: 'Highlight your credentials' },
  ],
};

/** Get contextual suggestions: 1 content, 1 visual, 2 features (or business-specific). */
export function getReadySuggestions(context?: ReadySuggestionsContext): SuggestedReply[] {
  const suggestions: SuggestedReply[] = [];

  // Pick a random content suggestion
  const contentIdx = Math.floor(Math.random() * CONTENT_SUGGESTIONS.length);
  suggestions.push(CONTENT_SUGGESTIONS[contentIdx]);

  // Pick a random visual suggestion
  const visualIdx = Math.floor(Math.random() * VISUAL_SUGGESTIONS.length);
  suggestions.push(VISUAL_SUGGESTIONS[visualIdx]);

  // Try to get business-specific suggestions
  const businessType = context?.businessType || context?.templateId;
  const businessSuggestions = businessType ? BUSINESS_SPECIFIC_SUGGESTIONS[businessType] : null;

  if (businessSuggestions && businessSuggestions.length >= 2) {
    // Shuffle and pick 2 business-specific suggestions
    const shuffled = [...businessSuggestions].sort(() => Math.random() - 0.5);
    suggestions.push(shuffled[0], shuffled[1]);
  } else {
    // Fall back to generic feature suggestions
    const shuffledFeatures = [...FEATURE_SUGGESTIONS].sort(() => Math.random() - 0.5);
    suggestions.push(shuffledFeatures[0], shuffledFeatures[1]);
  }

  return suggestions;
}

/** Default ready state suggestions (fallback). */
export function getDefaultReadySuggestions(): SuggestedReply[] {
  return [
    { id: 'headline', text: 'Make the headline more compelling' },
    { id: 'photos', text: 'Add professional photos' },
    { id: 'contact-form', text: 'Add a contact form' },
    { id: 'testimonials', text: 'Add client testimonials' },
  ];
}

