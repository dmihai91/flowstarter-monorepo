import type { SystemFont, SuggestedReply, CategoryColors } from './types';
import { en } from '~/lib/i18n/locales/en';

/*
 * ─── Translation Keys for Suggested Replies ──────────────────────────────────
 * All user-facing labels should use these keys for i18n support
 */

/**
 * Translation key constants for suggested replies.
 * Use these instead of hardcoded strings to enable future translation.
 */
export const DEFAULT_PROJECT_NAME_GENERATION = 'My Project';

export const REPLY_KEYS = {
  // Welcome step
  WELCOME_LETS_GO: 'welcome.lets_go',
  
  // Describe step - example prompts
  DESCRIBE_COACH: 'describe.coach',
  DESCRIBE_THERAPIST: 'describe.therapist',
  DESCRIBE_PHOTOGRAPHER: 'describe.photographer',
  DESCRIBE_TRAINER: 'describe.trainer',

  // UVP step
  UVP_SKIP: 'uvp.skip',
  UVP_EXAMPLE_METHOD: 'uvp.example_method',
  UVP_EXAMPLE_EXPERIENCE: 'uvp.example_experience',
  UVP_EXAMPLE_RESULTS: 'uvp.example_results',

  // Name step - suggestions and refinement
  NAME_USE_THIS: 'name.use_this',
  NAME_MAKE_PUNCHY: 'name.make_punchy',
  NAME_MORE_CREATIVE: 'name.more_creative',
  NAME_MORE_PROFESSIONAL: 'name.more_professional',
  NAME_SHORTER: 'name.shorter',
  NAME_TRY_ANOTHER: 'name.try_another',
  NAME_I_HAVE_OWN: 'name.i_have_own',
  NAME_TYPE_OWN: 'name.type_own',
  NAME_SUGGEST: 'name.suggest',
  NAME_TRY_AGAIN: 'name.try_again',

  // Business discovery step
  BUSINESS_LOOKS_GOOD: 'business.looks_good',
  BUSINESS_LOOKS_GOOD_NOW: 'business.looks_good_now',
  BUSINESS_ADJUST: 'business.adjust',
  BUSINESS_SKIP: 'business.skip',

  // Build/ready step
  BUILD_CUSTOMIZE: 'build.customize',
  BUILD_DIFFERENT_COLORS: 'build.different_colors',
  BUILD_ADD_SECTIONS: 'build.add_sections',

  // Error recovery suggestions
  ERROR_TRY_AGAIN: 'error.try_again',
  ERROR_TYPE_OWN_NAME: 'error.type_own_name',
  ERROR_PICK_DIFFERENT_TEMPLATE: 'error.pick_different_template',
  ERROR_START_OVER: 'error.start_over',
  ERROR_REFRESH_TEMPLATES: 'error.refresh_templates',
  ERROR_BROWSE_ALL: 'error.browse_all',
  ERROR_TRY_SIMPLER: 'error.try_simpler',
  ERROR_UNDO_CHANGES: 'error.undo_changes',
  ERROR_REFRESH_PAGE: 'error.refresh_page',
} as const;

export type ReplyKey = (typeof REPLY_KEYS)[keyof typeof REPLY_KEYS];

/**
 * Default English labels for all reply keys.
 * This object can be replaced with translations for i18n.
 */
export const REPLY_LABELS: Record<ReplyKey, string> = {
  // Welcome step - example prompts (these go directly to describe flow)
  [REPLY_KEYS.WELCOME_LETS_GO]: en.quickIdeas['life-coach'],

  // More welcome examples
  [REPLY_KEYS.DESCRIBE_COACH]: en.quickIdeas['business-coach'],
  [REPLY_KEYS.DESCRIBE_THERAPIST]: en.quickIdeas['therapist'],
  [REPLY_KEYS.DESCRIBE_PHOTOGRAPHER]: en.quickIdeas['photographer'],
  [REPLY_KEYS.DESCRIBE_TRAINER]: en.quickIdeas['personal-trainer'],

  // UVP step
  [REPLY_KEYS.UVP_SKIP]: "Skip for now",
  [REPLY_KEYS.UVP_EXAMPLE_METHOD]: "I have a unique method",
  [REPLY_KEYS.UVP_EXAMPLE_EXPERIENCE]: "Years of experience",
  [REPLY_KEYS.UVP_EXAMPLE_RESULTS]: "Proven results",

  // Name step
  [REPLY_KEYS.NAME_USE_THIS]: 'Use this name',
  [REPLY_KEYS.NAME_MAKE_PUNCHY]: 'Make it punchy',
  [REPLY_KEYS.NAME_MORE_CREATIVE]: 'More creative',
  [REPLY_KEYS.NAME_MORE_PROFESSIONAL]: 'More professional',
  [REPLY_KEYS.NAME_SHORTER]: 'Shorter',
  [REPLY_KEYS.NAME_TRY_ANOTHER]: 'Try another',
  [REPLY_KEYS.NAME_I_HAVE_OWN]: 'I have my own',
  [REPLY_KEYS.NAME_TYPE_OWN]: 'Type my own',
  [REPLY_KEYS.NAME_SUGGEST]: 'Suggest a name',
  [REPLY_KEYS.NAME_TRY_AGAIN]: 'Try again',

  // Business discovery
  [REPLY_KEYS.BUSINESS_LOOKS_GOOD]: 'Looks good!',
  [REPLY_KEYS.BUSINESS_LOOKS_GOOD_NOW]: 'Actually, looks good now',
  [REPLY_KEYS.BUSINESS_ADJUST]: 'Let me adjust something',
  [REPLY_KEYS.BUSINESS_SKIP]: 'Skip this',

  // Build/ready
  [REPLY_KEYS.BUILD_CUSTOMIZE]: 'Make some changes',
  [REPLY_KEYS.BUILD_DIFFERENT_COLORS]: 'Try different colors',
  [REPLY_KEYS.BUILD_ADD_SECTIONS]: 'Add more sections',

  // Error recovery
  [REPLY_KEYS.ERROR_TRY_AGAIN]: 'Try again',
  [REPLY_KEYS.ERROR_TYPE_OWN_NAME]: 'Type my own name',
  [REPLY_KEYS.ERROR_PICK_DIFFERENT_TEMPLATE]: 'Pick different template',
  [REPLY_KEYS.ERROR_START_OVER]: 'Start over',
  [REPLY_KEYS.ERROR_REFRESH_TEMPLATES]: 'Refresh templates',
  [REPLY_KEYS.ERROR_BROWSE_ALL]: 'Browse all templates',
  [REPLY_KEYS.ERROR_TRY_SIMPLER]: 'Try something simpler',
  [REPLY_KEYS.ERROR_UNDO_CHANGES]: 'Undo recent changes',
  [REPLY_KEYS.ERROR_REFRESH_PAGE]: 'Refresh page',
};

/**
 * Get translated label for a reply key.
 * @param key - The reply key constant
 * @returns The translated label text
 */
export function getReplyLabel(key: ReplyKey): string {
  return REPLY_LABELS[key] || key;
}

/**
 * Create a SuggestedReply object from a key.
 * @param id - The reply id (used for action handling)
 * @param key - The translation key for the label
 * @returns SuggestedReply object with translated text
 */
export function createReply(id: string, key: ReplyKey): SuggestedReply {
  return { id, text: getReplyLabel(key) };
}

/**
 * Pre-built suggested reply sets for common scenarios.
 * These use the translation keys for i18n support.
 */
export const SUGGESTED_REPLIES = {
  /** Welcome step - example prompts that go directly to describe flow */
  welcomeStart: (): SuggestedReply[] => [
    createReply('example-coach', REPLY_KEYS.WELCOME_LETS_GO),
    createReply('example-business', REPLY_KEYS.DESCRIBE_COACH),
    createReply('example-therapist', REPLY_KEYS.DESCRIBE_THERAPIST),
    createReply('example-photographer', REPLY_KEYS.DESCRIBE_PHOTOGRAPHER),
    createReply('example-trainer', REPLY_KEYS.DESCRIBE_TRAINER),
  ],
  
  /** Describe step - same examples for describe step */
  describeExamples: (): SuggestedReply[] => [
    createReply('example-coach', REPLY_KEYS.WELCOME_LETS_GO),
    createReply('example-business', REPLY_KEYS.DESCRIBE_COACH),
    createReply('example-therapist', REPLY_KEYS.DESCRIBE_THERAPIST),
    createReply('example-photographer', REPLY_KEYS.DESCRIBE_PHOTOGRAPHER),
    createReply('example-trainer', REPLY_KEYS.DESCRIBE_TRAINER),
  ],

  /** UVP step - prompts to help user describe their unique value */
  uvpPrompts: (): SuggestedReply[] => [
    createReply('uvp-method', REPLY_KEYS.UVP_EXAMPLE_METHOD),
    createReply('uvp-experience', REPLY_KEYS.UVP_EXAMPLE_EXPERIENCE),
    createReply('uvp-results', REPLY_KEYS.UVP_EXAMPLE_RESULTS),
    createReply('uvp-skip', REPLY_KEYS.UVP_SKIP),
  ],

  /** Full refinement options for name generation */
  nameRefinement: (): SuggestedReply[] => [
    createReply('accept-name', REPLY_KEYS.NAME_USE_THIS),
    createReply('more-punchy', REPLY_KEYS.NAME_MAKE_PUNCHY),
    createReply('more-creative', REPLY_KEYS.NAME_MORE_CREATIVE),
    createReply('more-professional', REPLY_KEYS.NAME_MORE_PROFESSIONAL),
    createReply('shorter', REPLY_KEYS.NAME_SHORTER),
    createReply('try-another', REPLY_KEYS.NAME_TRY_ANOTHER),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],

  /** Refinement options with dynamic accept button showing the name */
  nameRefinementWithName: (suggestedName: string): SuggestedReply[] => [
    { id: 'accept-name', text: `Yes, use "${suggestedName}"` },
    createReply('more-punchy', REPLY_KEYS.NAME_MAKE_PUNCHY),
    createReply('more-creative', REPLY_KEYS.NAME_MORE_CREATIVE),
    createReply('more-professional', REPLY_KEYS.NAME_MORE_PROFESSIONAL),
    createReply('shorter', REPLY_KEYS.NAME_SHORTER),
    createReply('try-another', REPLY_KEYS.NAME_TRY_ANOTHER),
    createReply('own-name', REPLY_KEYS.NAME_TYPE_OWN),
  ],

  /** Options after refinement error */
  nameRefinementError: (): SuggestedReply[] => [
    createReply('try-another', REPLY_KEYS.NAME_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],

  /** Options for asking user's name preference */
  nameChoice: (): SuggestedReply[] => [
    createReply('generate-name', REPLY_KEYS.NAME_SUGGEST),
    createReply('own-name', REPLY_KEYS.NAME_I_HAVE_OWN),
  ],

  /** Options after extraction error */
  nameExtractionError: (): SuggestedReply[] => [
    createReply('retry', REPLY_KEYS.NAME_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.NAME_TYPE_OWN),
  ],

  /** Business summary confirmation options */
  businessSummary: (): SuggestedReply[] => [
    createReply('confirm-summary', REPLY_KEYS.BUSINESS_LOOKS_GOOD),
    createReply('edit-summary', REPLY_KEYS.BUSINESS_ADJUST),
  ],

  /** After user wants to edit, show option to confirm once done */
  businessSummaryAfterEdit: (): SuggestedReply[] => [
    createReply('confirm-summary', REPLY_KEYS.BUSINESS_LOOKS_GOOD_NOW),
  ],

  /** Skip option for optional fields */
  skipOption: (): SuggestedReply[] => [createReply('skip-pricing', REPLY_KEYS.BUSINESS_SKIP)],

  /** Post-build customization options */
  buildReady: (): SuggestedReply[] => [
    createReply('customize', REPLY_KEYS.BUILD_CUSTOMIZE),
    createReply('different-style', REPLY_KEYS.BUILD_DIFFERENT_COLORS),
    createReply('add-features', REPLY_KEYS.BUILD_ADD_SECTIONS),
  ],

  // ─── Error Recovery Suggestions ────────────────────────────────────────────

  /** Build error recovery */
  errorBuild: (): SuggestedReply[] => [
    createReply('retry-build', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('change-template', REPLY_KEYS.ERROR_PICK_DIFFERENT_TEMPLATE),
    createReply('start-fresh', REPLY_KEYS.ERROR_START_OVER),
  ],

  /** Name error recovery */
  errorName: (): SuggestedReply[] => [
    createReply('retry-name', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('own-name', REPLY_KEYS.ERROR_TYPE_OWN_NAME),
  ],

  /** Template error recovery */
  errorTemplate: (): SuggestedReply[] => [
    createReply('retry-templates', REPLY_KEYS.ERROR_REFRESH_TEMPLATES),
    createReply('browse-all', REPLY_KEYS.ERROR_BROWSE_ALL),
  ],

  /** Agent error recovery */
  errorAgent: (): SuggestedReply[] => [
    createReply('retry-request', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('simpler-change', REPLY_KEYS.ERROR_TRY_SIMPLER),
    createReply('undo-changes', REPLY_KEYS.ERROR_UNDO_CHANGES),
  ],

  /** Generic error recovery */
  errorGeneric: (): SuggestedReply[] => [
    createReply('retry', REPLY_KEYS.ERROR_TRY_AGAIN),
    createReply('refresh', REPLY_KEYS.ERROR_REFRESH_PAGE),
  ],
};

/*
 * ─── Assistant Message Keys ──────────────────────────────────────────────────
 * All assistant message templates should use these keys for i18n support
 */

/**
 * Message key constants for assistant messages.
 */
export const MESSAGE_KEYS = {
  // ─── Streamlined Flow Messages ─────────────────────────────────────────────
  // Welcome step
  WELCOME_GREETING: 'message.welcome.greeting',
  WELCOME_GREETING_USER: 'message.welcome.greeting_user',
  WELCOME_SHOWCASE: 'message.welcome.showcase',
  WELCOME_CTA: 'message.welcome.cta',
  
  // ─── Internal Flow (Template-First) ────────────────────────────────────────
  // When project already has business details from team dashboard
  INTERNAL_WELCOME: 'message.internal.welcome',
  INTERNAL_WELCOME_WITH_NAME: 'message.internal.welcome_with_name',
  INTERNAL_TEMPLATE_PROMPT: 'message.internal.template_prompt',
  
  // Describe step
  DESCRIBE_PROMPT: 'message.describe.prompt',
  DESCRIBE_ACK: 'message.describe.ack',
  
  // Quick Profile step
  QUICK_PROFILE_INTRO: 'message.quick_profile.intro',
  QUICK_PROFILE_ACK: 'message.quick_profile.ack',
  
  // UVP step (after quick profile)
  UVP_PROMPT: 'message.uvp.prompt',
  UVP_ACK: 'message.uvp.ack',

  // Name step messages
  NAME_GENERATION_ERROR: 'message.name.generation_error',
  NAME_PROMPT_MANUAL: 'message.name.prompt_manual',
  NAME_SKIP_BUSINESS: 'message.name.skip_business',
  NAME_TYPE_BELOW: 'message.name.type_below',
  NAME_CONFIRMATION: 'message.name.confirmation',

  // Build messages
  BUILD_SELECT_TEMPLATE_FIRST: 'message.build.select_template_first',
  BUILD_SELECT_PALETTE_FIRST: 'message.build.select_palette_first',

  // Ready state messages
  READY_SETUP_FIRST: 'message.ready.setup_first',
  READY_HELP_PROMPT: 'message.ready.help_prompt',
  READY_TELL_MORE: 'message.ready.tell_more',

  // API fallback messages
  API_NAME_CONFIRM: 'message.api.name_confirm',
  API_NAME_UNCLEAR: 'message.api.name_unclear',
} as const;

export type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];

/**
 * Default English labels for all message keys.
 */
export const MESSAGE_LABELS: Record<MessageKey, string> = {
  // ─── Streamlined Flow ──────────────────────────────────────────────────────
  // Welcome step
  [MESSAGE_KEYS.WELCOME_GREETING]: '**Welcome to Flowstarter Editor** 👋\n\nHow can I help you build today?',
  [MESSAGE_KEYS.WELCOME_GREETING_USER]: '**Hey {{username}}!** 👋',
  [MESSAGE_KEYS.WELCOME_SHOWCASE]: '',
  [MESSAGE_KEYS.WELCOME_CTA]: 'Tell me what you do and I\'ll build your site.',
  
  // ─── Internal Flow (Template-First) ────────────────────────────────────────
  [MESSAGE_KEYS.INTERNAL_WELCOME]: 
    "**Let's build your website!** 🚀\n\n" +
    "I have all your business details. Now let's pick a template that matches your brand.",
  [MESSAGE_KEYS.INTERNAL_WELCOME_WITH_NAME]: 
    "**Let's build {{businessName}}'s website!** 🚀\n\n" +
    "I have all your business details. Let's pick a template that matches your brand.",
  [MESSAGE_KEYS.INTERNAL_TEMPLATE_PROMPT]: 
    "I've selected **3 templates** that match your business profile.\n\n" +
    "Click any template to preview it, or browse all options below.",
  
  // Describe step
  [MESSAGE_KEYS.DESCRIBE_PROMPT]: 
    '**Tell me about your business.**\n\n' +
    'What service do you offer, and who do you help?\n\n' +
    '**Examples:**\n' +
    '• "I\'m a life coach helping busy professionals find work-life balance"\n' +
    '• "I\'m a therapist specializing in anxiety and stress management"\n' +
    '• "I\'m a wedding photographer in Chicago"\n' +
    '• "I\'m a personal trainer for women over 40"',
  [MESSAGE_KEYS.DESCRIBE_ACK]: 'A **{{businessType}}** — I love it! {{audienceNote}}Let\'s find the perfect name for your site.',
  
  // Quick Profile step
  [MESSAGE_KEYS.QUICK_PROFILE_INTRO]: 'Choose the options that best describe your business:',
  [MESSAGE_KEYS.QUICK_PROFILE_ACK]: '{{goalResponse}} One more question to personalize your copy...',
  
  // UVP step
  [MESSAGE_KEYS.UVP_PROMPT]: 
    '**What makes you stand out?**\n\n' +
    'What\'s your unique approach that gets results for clients?\n\n' +
    '*Example: "I use a holistic 3-step method that combines mindfulness with practical action plans."*',
  [MESSAGE_KEYS.UVP_ACK]: '"{{uvp}}" — that\'s powerful! This will make your site copy really compelling.',

  // Name step
  [MESSAGE_KEYS.NAME_GENERATION_ERROR]:
    "I couldn't generate a name right now. What would you like to call your project?",
  [MESSAGE_KEYS.NAME_PROMPT_MANUAL]: 'Great! Type your business or project name below.',
  [MESSAGE_KEYS.NAME_SKIP_BUSINESS]: "No problem! Let's pick a template to get started.",
  [MESSAGE_KEYS.NAME_TYPE_BELOW]: "Great! Type your name below and I'll use it for your project.",
  [MESSAGE_KEYS.NAME_CONFIRMATION]: "I'll use **{{name}}** as your project name. Sound good?",

  // Build
  [MESSAGE_KEYS.BUILD_SELECT_TEMPLATE_FIRST]: 'Please select a template first.',
  [MESSAGE_KEYS.BUILD_SELECT_PALETTE_FIRST]: 'Please select a color palette first.',

  // Ready state
  [MESSAGE_KEYS.READY_SETUP_FIRST]: "Let's set up your project first. What kind of website would you like to create?",
  [MESSAGE_KEYS.READY_HELP_PROMPT]: "I'm ready to help! What would you like me to change?",
  [MESSAGE_KEYS.READY_TELL_MORE]: 'Sure thing. Tell me more about what you have in mind.',

  // API fallbacks
  [MESSAGE_KEYS.API_NAME_CONFIRM]: "I'll use **{{name}}** as your project name. Sound good?",
  [MESSAGE_KEYS.API_NAME_UNCLEAR]: "I didn't catch that. What would you like to name your project?",
};

/**
 * Get translated message for a message key.
 * Supports template variables like {{name}} using an optional context object.
 */
export function getMessage(key: MessageKey, context?: Record<string, string>): string {
  let message = MESSAGE_LABELS[key] || key;

  if (context) {
    for (const [varName, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    }
  }

  return message;
}

// ─── Project Name Defaults ───────────────────────────────────────────────────

/** Default project name when user doesn't provide one (for name generation) */
// REMOVED: No fallback names - errors should be visible

/** Default project name for build process (when no name available) */
// REMOVED: No fallback names - errors should be visible

// ─── Font Configuration ──────────────────────────────────────────────────────

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

/**
 * Context-aware suggestions for the "ready" state based on business type.
 * These are more engaging and specific than generic suggestions.
 */
interface ReadySuggestionsContext {
  templateId?: string;
  businessType?: string;
  projectName?: string;
}

// Suggestion pools organized by action type
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
  // Wellness & Coaching
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

  // Beauty & Personal Care
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

  // Health & Medical
  dental: [
    { id: 'services-list', text: 'List dental services' },
    { id: 'insurance', text: 'Add insurance information' },
    { id: 'team', text: 'Introduce your team' },
  ],

  // Professional Services
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

/**
 * Get contextual suggestions for the ready state.
 * Returns 4 suggestions: 1 content, 1 visual, 2 features (or business-specific).
 */
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

/**
 * Get the default ready state suggestions (used as fallback).
 */
export function getDefaultReadySuggestions(): SuggestedReply[] {
  return [
    { id: 'headline', text: 'Make the headline more compelling' },
    { id: 'photos', text: 'Add professional photos' },
    { id: 'contact-form', text: 'Add a contact form' },
    { id: 'testimonials', text: 'Add client testimonials' },
  ];
}


