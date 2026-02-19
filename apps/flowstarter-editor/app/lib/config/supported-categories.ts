/**
 * Supported Business Categories Configuration
 *
 * This is the SINGLE SOURCE OF TRUTH for what business types the MVP supports.
 * 
 * 🎯 MVP FOCUS: Service-based entrepreneurs who trade time for money
 *    - Coaches, consultants, therapists
 *    - Fitness trainers, wellness practitioners
 *    - Creative service providers (photographers, designers)
 *    - Beauty & styling professionals
 *    - Healthcare practitioners
 *
 * ❌ NOT SUPPORTED (Yet):
 *    - E-commerce / product-based businesses
 *    - Blogs / content-only sites
 *    - SaaS / tech products
 *    - Restaurants / physical stores
 *    - Agencies / multi-person companies
 *    - Non-profits / organizations
 */

// ─── TYPES ─────────────────────────────────────────────────────────────

export interface BusinessCategory {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Coaches & Consultants") */
  label: string;
  /** Short label for compact UI (e.g., "Coaching") */
  shortLabel: string;
  /** Emoji for visual recognition */
  emoji: string;
  /** Example business types within this category */
  examples: string[];
  /** Keywords for matching user descriptions to this category */
  keywords: string[];
  /** Template category IDs that best match this business type */
  preferredTemplateCategories: string[];
  /** Quick idea prompts for onboarding (shown as starter suggestions) */
  quickIdeas: Array<{ id: string; text: string }>;
  /** Example goals relevant to this category */
  exampleGoals: string[];
  /** Common selling methods for this category */
  commonSellingMethods: string[];
}

// ─── SUPPORTED SERVICE CATEGORIES ──────────────────────────────────────

export const SUPPORTED_CATEGORIES: BusinessCategory[] = [
  {
    id: 'coaching',
    label: 'Coaches & Consultants',
    shortLabel: 'Coaching',
    emoji: '🎯',
    examples: ['life coach', 'business coach', 'career coach', 'executive coach', 'mindset coach', 'relationship coach'],
    keywords: ['coach', 'coaching', 'consultant', 'consulting', 'mentor', 'mentoring', 'advisor', 'strategist'],
    preferredTemplateCategories: ['business', 'health'],
    quickIdeas: [
      { id: 'life-coach', text: 'A life coach website with transformation packages, testimonials, and booking calendar' },
      { id: 'business-coach', text: 'A business coach site with programs, success stories, and free discovery call booking' },
      { id: 'career-coach', text: 'A career coaching site with resume services, testimonials, and session booking' },
    ],
    exampleGoals: ['get more bookings', 'attract ideal clients', 'build authority'],
    commonSellingMethods: ['bookings', 'subscriptions', 'content'],
  },
  {
    id: 'mental-health',
    label: 'Therapists & Counselors',
    shortLabel: 'Therapy',
    emoji: '🧠',
    examples: ['psychologist', 'therapist', 'counselor', 'psychotherapist', 'marriage counselor', 'family therapist'],
    keywords: ['psycholog', 'therap', 'counselor', 'counselling', 'counseling', 'mental health', 'psychotherapy', 'CBT', 'EMDR'],
    preferredTemplateCategories: ['health', 'healthcare'],
    quickIdeas: [
      { id: 'psychologist', text: 'A psychologist practice site with services, credentials, and appointment booking' },
      { id: 'therapist', text: 'A therapist website with specializations, session types, and online booking' },
      { id: 'counselor', text: 'A counseling practice site with services, approach, and contact form' },
    ],
    exampleGoals: ['fill appointment slots', 'reach new clients', 'establish credibility'],
    commonSellingMethods: ['bookings', 'leads'],
  },
  {
    id: 'fitness',
    label: 'Personal Trainers & Fitness',
    shortLabel: 'Fitness',
    emoji: '💪',
    examples: ['personal trainer', 'fitness coach', 'yoga instructor', 'Pilates instructor', 'strength coach', 'online fitness coach'],
    keywords: ['fitness', 'trainer', 'training', 'yoga', 'pilates', 'workout', 'exercise', 'strength', 'crossfit', 'HIIT'],
    preferredTemplateCategories: ['fitness', 'health'],
    quickIdeas: [
      { id: 'personal-trainer', text: 'A personal trainer site with programs, transformation gallery, and session booking' },
      { id: 'yoga-instructor', text: 'A yoga instructor website with class schedule, online sessions, and memberships' },
      { id: 'online-coach', text: 'An online fitness coach site with programs, client results, and coaching packages' },
    ],
    exampleGoals: ['get more clients', 'sell training packages', 'fill class spots'],
    commonSellingMethods: ['bookings', 'subscriptions', 'ecommerce'],
  },
  {
    id: 'wellness',
    label: 'Wellness & Holistic Health',
    shortLabel: 'Wellness',
    emoji: '🌿',
    examples: ['nutritionist', 'health coach', 'massage therapist', 'acupuncturist', 'naturopath', 'wellness practitioner'],
    keywords: ['nutrition', 'dietitian', 'massage', 'acupunctur', 'naturopath', 'holistic', 'wellness', 'healing', 'reiki', 'chiropract'],
    preferredTemplateCategories: ['health', 'healthcare'],
    quickIdeas: [
      { id: 'nutritionist', text: 'A nutritionist site with meal plans, consultation packages, and booking' },
      { id: 'massage-therapist', text: 'A massage therapist site with services, pricing, and appointment booking' },
      { id: 'wellness-coach', text: 'A wellness practitioner site with services, approach, and online booking' },
    ],
    exampleGoals: ['book more appointments', 'attract local clients', 'build recurring clientele'],
    commonSellingMethods: ['bookings', 'subscriptions'],
  },
  {
    id: 'beauty-styling',
    label: 'Beauty & Styling Professionals',
    shortLabel: 'Beauty',
    emoji: '✨',
    examples: ['hairstylist', 'makeup artist', 'nail technician', 'personal stylist', 'esthetician', 'barber'],
    keywords: ['stylist', 'styling', 'hair', 'makeup', 'beauty', 'nails', 'salon', 'barber', 'aesthet', 'lash', 'brow', 'skincare'],
    preferredTemplateCategories: ['personal-brand', 'health'],
    quickIdeas: [
      { id: 'stylist', text: 'An independent stylist site with portfolio, services, and appointment booking' },
      { id: 'makeup-artist', text: 'A makeup artist site with portfolio, packages, and booking form' },
      { id: 'esthetician', text: 'An esthetician site with treatment menu, pricing, and online booking' },
    ],
    exampleGoals: ['book more appointments', 'showcase portfolio', 'attract local clients'],
    commonSellingMethods: ['bookings', 'ecommerce'],
  },
  {
    id: 'creative-services',
    label: 'Creative Freelancers',
    shortLabel: 'Creative',
    emoji: '🎨',
    examples: ['photographer', 'videographer', 'graphic designer', 'web designer', 'brand designer', 'illustrator'],
    keywords: ['photographer', 'photography', 'videograph', 'designer', 'design', 'illustrat', 'creative', 'freelance', 'brand'],
    preferredTemplateCategories: ['personal-brand', 'creative'],
    quickIdeas: [
      { id: 'photographer', text: 'A freelance photographer portfolio with galleries, packages, and booking' },
      { id: 'designer', text: 'A freelance designer portfolio with case studies, services, and inquiry form' },
      { id: 'videographer', text: 'A videographer site with showreel, packages, and project inquiry form' },
    ],
    exampleGoals: ['get hired for projects', 'showcase work', 'attract ideal clients'],
    commonSellingMethods: ['leads', 'bookings'],
  },
  {
    id: 'tutoring-education',
    label: 'Tutors & Educators',
    shortLabel: 'Education',
    emoji: '📚',
    examples: ['private tutor', 'music teacher', 'language tutor', 'test prep tutor', 'academic coach', 'online instructor'],
    keywords: ['tutor', 'tutoring', 'teacher', 'teaching', 'instructor', 'lesson', 'education', 'music teacher', 'language'],
    preferredTemplateCategories: ['business', 'education'],
    quickIdeas: [
      { id: 'private-tutor', text: 'A private tutor site with subjects, rates, testimonials, and booking' },
      { id: 'music-teacher', text: 'A music teacher site with lesson types, student showcases, and scheduling' },
      { id: 'language-tutor', text: 'A language tutor site with programs, pricing, and trial lesson booking' },
    ],
    exampleGoals: ['fill lesson schedule', 'attract new students', 'build reputation'],
    commonSellingMethods: ['bookings', 'subscriptions'],
  },
];

// ─── UNSUPPORTED BUSINESS TYPES (for detection) ────────────────────────
// NOTE: These patterns should be EXPLICIT about the unsupported type
// Avoid generic words that could appear in supported contexts

export const UNSUPPORTED_KEYWORDS = {
  ecommerce: [
    'online store', 'e-commerce', 'ecommerce', 'sell products online', 
    'dropship', 'wholesale', 'retail store', 'merchandise store',
    'product catalog', 'shopping cart', 'inventory management'
  ],
  saas: [
    'saas product', 'software product', 'tech startup', 'mobile app',
    'web app', 'b2b software', 'api service', 'software company'
  ],
  restaurant: [
    'restaurant', 'cafe ', 'coffee shop', 'bar ', 'food truck', 
    'catering company', 'bakery shop', 'pizzeria', 'bistro'
  ],
  agency: [
    'marketing agency', 'design agency', 'digital agency', 
    'advertising agency', 'creative agency', 'our team of',
    'we are a team', 'agency services'
  ],
  blog: [
    'personal blog', 'news site', 'magazine site', 'media publication',
    'content blog', 'blogger site'
  ],
  nonprofit: [
    'nonprofit', 'non-profit', 'charity organization', 'foundation',
    'ngo ', '501c', 'charitable organization'
  ],
  marketplace: [
    'marketplace', 'directory site', 'listing site', 'classifieds site',
    'job board', 'rental marketplace'
  ],
};

export const UNSUPPORTED_MESSAGES: Record<string, string> = {
  ecommerce: "We're focused on service businesses right now. E-commerce and product-based sites are coming soon!",
  saas: "SaaS and software product sites need special features we're still building. Coming soon!",
  restaurant: "Restaurant and food business sites need menus, ordering, and special features we're working on. Coming soon!",
  agency: "We're built for solo service providers right now. Team/agency sites are on our roadmap!",
  blog: "Content-focused blogs and media sites are coming in a future update!",
  nonprofit: "Non-profit and organization sites need special features we're still developing. Coming soon!",
  marketplace: "Marketplace and directory sites are a different beast—we're focused on personal service sites for now.",
};

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────

/**
 * Detect which category a user description matches.
 * Returns the best matching category or undefined.
 */
export function detectCategory(description: string): BusinessCategory | undefined {
  const lower = description.toLowerCase();
  let bestMatch: BusinessCategory | undefined;
  let bestScore = 0;

  for (const cat of SUPPORTED_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // Longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
}

/**
 * Check if a description matches an unsupported business type.
 * 
 * IMPORTANT: This function only returns unsupported if:
 * 1. The description does NOT match any supported category
 * 2. AND the description matches an explicit unsupported pattern
 * 
 * This prevents false positives where service providers mention
 * "online" or "program" or other generic words.
 */
export function detectUnsupportedType(description: string): { type: string; message: string } | null {
  const lower = description.toLowerCase();
  
  // FIRST: Check if this matches a supported category
  // If it does, it's NOT unsupported even if it has some matching keywords
  const supportedCategory = detectCategory(description);
  if (supportedCategory) {
    // User clearly describes a supported service - don't flag as unsupported
    return null;
  }
  
  // SECOND: Only if no supported category matched, check for unsupported patterns
  for (const [type, keywords] of Object.entries(UNSUPPORTED_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return {
          type,
          message: UNSUPPORTED_MESSAGES[type] || "This type of site isn't supported yet, but we're working on it!",
        };
      }
    }
  }
  
  // Neither supported nor explicitly unsupported - let it through
  // (The LLM will handle ambiguous cases)
  return null;
}

/**
 * Check if a description is supported (matches a known category).
 */
export function isSupportedBusinessType(description: string): boolean {
  // First check if it's explicitly unsupported
  if (detectUnsupportedType(description)) {
    return false;
  }
  
  // Then check if it matches a supported category
  const category = detectCategory(description);
  return category !== undefined;
}

/**
 * Get all quick ideas across all categories, shuffled.
 */
export function getAllQuickIdeas(count = 4): Array<{ id: string; text: string }> {
  const all = SUPPORTED_CATEGORIES.flatMap((c) => c.quickIdeas);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get all category short labels for display.
 * Returns: "life coach, therapist, personal trainer, nutritionist, hairstylist, photographer, or private tutor"
 */
export function getCategoryExamplesText(): string {
  // Pick one representative example from each category
  const examples = SUPPORTED_CATEGORIES.map((c) => c.examples[0]);
  const last = examples.pop();
  return `${examples.join(', ')}, or ${last}`;
}

/**
 * Get a list of categories with emojis for display.
 */
export function getCategoryListWithEmojis(): string {
  return SUPPORTED_CATEGORIES.map((c) => `${c.emoji} ${c.shortLabel}`).join(' • ');
}

/**
 * Get a comma-separated list of category labels.
 */
export function getCategoryLabelsText(): string {
  return SUPPORTED_CATEGORIES.map((c) => c.label).join(', ');
}

/**
 * Get example goals across all categories for prompts.
 */
export function getExampleGoalsText(): string {
  const goals = new Set<string>();
  for (const cat of SUPPORTED_CATEGORIES) {
    for (const g of cat.exampleGoals) {
      goals.add(g);
    }
  }
  const arr = [...goals];
  return arr.slice(0, 3).join(', ');
}

/**
 * Get preferred template categories for a detected business type.
 */
export function getPreferredTemplateCategories(description: string): string[] {
  const cat = detectCategory(description);
  return cat?.preferredTemplateCategories || [];
}

/**
 * Build a prompt-friendly description of all supported categories.
 * Used in LLM system prompts.
 */
export function buildCategoryPromptContext(): string {
  return SUPPORTED_CATEGORIES.map((c) => {
    return `- **${c.emoji} ${c.label}**: ${c.examples.join(', ')}`;
  }).join('\n');
}

/**
 * Get the MVP scope description for system prompts.
 */
export function getMVPScopeDescription(): string {
  return `
🎯 **MVP SCOPE: Service-Based Entrepreneurs**

We build websites for independent professionals who offer services:
${buildCategoryPromptContext()}

❌ **NOT YET SUPPORTED:**
- E-commerce / product stores
- SaaS / software products  
- Restaurants / physical stores
- Agencies / multi-person teams
- Blogs / content-only sites
- Non-profits / organizations

If a user asks for an unsupported type, politely explain we're focused on service providers and their request type is coming soon.
`.trim();
}
