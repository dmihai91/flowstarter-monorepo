export const MVP_INDUSTRIES = [
  {
    id: 'consultants-coaches',
    name: 'Coaching & Consulting',
    description:
      'Perfect for independent coaches and consultants building their practice.',
  },
  {
    id: 'therapists-psychologists',
    name: 'Therapy & Counseling',
    description:
      'Designed for therapists and counselors looking to attract new clients.',
  },
  {
    id: 'photographers-videographers',
    name: 'Photography & Video',
    description:
      'Showcase your portfolio and book more clients with a stunning visual site.',
  },
  {
    id: 'designers-creative-studios',
    name: 'Design & Creative Services',
    description:
      'Stand out from the competition with a portfolio that reflects your creativity.',
  },
  {
    id: 'personal-trainers-wellness',
    name: 'Fitness & Training',
    description:
      'Attract new clients and grow your fitness or wellness business online.',
  },
  {
    id: 'salons-barbers-spas',
    name: 'Salons & Beauty',
    description:
      'Get more bookings with a professional site that showcases your services.',
  },
  {
    id: 'restaurants-cafes',
    name: 'Food & Beverage',
    description:
      'Share your menu, story, and location to bring in more customers.',
  },
  {
    id: 'content-creation',
    name: 'Content Creators',
    description:
      'Build your brand and connect with your audience through a professional site.',
  },
  {
    id: 'fashion-beauty',
    name: 'Fashion & Beauty',
    description:
      'Showcase your style and attract customers with a beautiful online presence.',
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Connect with clients and grow your wellness practice online.',
  },
  {
    id: 'other',
    name: 'Other Business',
    description:
      'Whatever your business, we can help you create a professional website.',
  },
] as const;

export type IndustryId = (typeof MVP_INDUSTRIES)[number]['id'];

export interface IndustryOption {
  id: IndustryId;
  name: string;
  description: string;
}

export const getIndustryOptions = (): IndustryOption[] =>
  MVP_INDUSTRIES.map((i) => ({ ...i }));

export const getIndustryAutocompleteOptions = () =>
  MVP_INDUSTRIES.map(({ id, name }) => ({ id, name }));

/**
 * Normalize an industry value to a valid industry ID.
 * Handles cases where AI might return industry names instead of IDs,
 * or when migrating from old data formats.
 */
export const normalizeIndustryId = (industry: string | undefined): string => {
  if (!industry) return 'other';

  const normalized = industry.toLowerCase().trim();

  // If it's already a valid ID, return it
  if (MVP_INDUSTRIES.some((i) => i.id === normalized)) {
    return normalized;
  }

  // Define keyword patterns for each industry (ordered by specificity)
  // More specific patterns should come first
  const industryPatterns: Array<{ patterns: string[]; id: string }> = [
    // Therapists & Psychologists
    {
      patterns: [
        'therapist',
        'therapy',
        'psychologist',
        'psychology',
        'counselor',
        'counselling',
        'counseling',
        'mental health',
        'psychotherapy',
        'psychiatrist',
        'social worker',
        'behavioral health',
      ],
      id: 'therapists-psychologists',
    },
    // Photographers & Videographers
    {
      patterns: [
        'photographer',
        'photography',
        'videographer',
        'videography',
        'cinematographer',
        'video production',
        'film',
        'photo studio',
        'wedding photographer',
        'portrait photographer',
      ],
      id: 'photographers-videographers',
    },
    // Designers & Creative Studios
    {
      patterns: [
        'designer',
        'design studio',
        'graphic design',
        'web design',
        'interior design',
        'fashion design',
        'ux design',
        'ui design',
        'creative agency',
        'creative studio',
        'branding agency',
        'art director',
      ],
      id: 'designers-creative-studios',
    },
    // Personal Trainers & Wellness
    {
      patterns: [
        'personal trainer',
        'fitness trainer',
        'fitness coach',
        'gym',
        'yoga instructor',
        'pilates',
        'nutritionist',
        'dietitian',
        'wellness coach',
        'fitness professional',
      ],
      id: 'personal-trainers-wellness',
    },
    // Salons, Barbers & Spas
    {
      patterns: [
        'salon',
        'barber',
        'barbershop',
        'spa',
        'beauty salon',
        'hair salon',
        'nail salon',
        'hairstylist',
        'hairdresser',
        'massage',
        'esthetician',
        'cosmetology',
      ],
      id: 'salons-barbers-spas',
    },
    // Restaurants & Cafés
    {
      patterns: [
        'restaurant',
        'cafe',
        'café',
        'bistro',
        'eatery',
        'diner',
        'food service',
        'catering',
        'bakery',
        'bar',
        'pub',
        'food truck',
        'culinary',
      ],
      id: 'restaurants-cafes',
    },
    // Content Creation
    {
      patterns: [
        'content creator',
        'blogger',
        'vlogger',
        'youtuber',
        'podcaster',
        'influencer',
        'social media',
        'content creation',
        'streamer',
        'digital creator',
      ],
      id: 'content-creation',
    },
    // Fashion & Beauty
    {
      patterns: [
        'fashion',
        'beauty',
        'makeup artist',
        'stylist',
        'fashion designer',
        'boutique',
        'clothing',
        'apparel',
        'cosmetics',
        'skincare',
        'fashion brand',
      ],
      id: 'fashion-beauty',
    },
    // Health & Wellness (broader than personal trainers)
    {
      patterns: [
        'health coach',
        'wellness',
        'holistic',
        'alternative medicine',
        'naturopath',
        'chiropractor',
        'acupuncture',
        'meditation',
        'mindfulness coach',
        'life coach',
      ],
      id: 'health-wellness',
    },
    // Consultants & Coaches (should be after more specific health/wellness)
    {
      patterns: [
        'consultant',
        'consulting',
        'coach',
        'coaching',
        'advisor',
        'business coach',
        'career coach',
        'executive coach',
        'leadership coach',
        'professional services',
        'strategy consultant',
        'management consulting',
        'financial advisor',
      ],
      id: 'consultants-coaches',
    },
  ];

  // Check each pattern set (in order of specificity)
  for (const { patterns, id } of industryPatterns) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        console.log(`[normalizeIndustryId] Matched "${pattern}" -> ${id}`);
        return id;
      }
    }
  }

  console.log(
    `[normalizeIndustryId] No match found for "${industry}", defaulting to "other"`
  );
  return 'other';
};

/**
 * Detect industry from business description text.
 * Useful when AI doesn't return an industry field or returns an invalid one.
 */
export const detectIndustryFromDescription = (
  description: string | undefined,
  existingIndustry?: string
): string => {
  // If we already have a valid industry, use it
  if (existingIndustry) {
    const normalized = normalizeIndustryId(existingIndustry);
    if (normalized !== 'other') {
      return normalized;
    }
  }

  // Try to detect from description
  if (!description) return 'other';

  return normalizeIndustryId(description);
};

/**
 * Detect platform type from business description text.
 * Maps common business patterns to platform types.
 */
export const detectPlatformType = (
  description: string | undefined,
  existingPlatformType?: string
): string => {
  // If we already have a platform type, use it
  if (existingPlatformType) {
    return existingPlatformType;
  }

  if (!description) return 'landing'; // default to business site

  const normalized = description.toLowerCase().trim();

  // Platform type patterns (ordered by specificity)
  const platformPatterns: Array<{ patterns: string[]; type: string }> = [
    // Portfolio - most specific first
    {
      patterns: [
        'portfolio',
        'showcase work',
        'display work',
        'my work',
        'past projects',
        'case studies',
        'previous work',
        'work samples',
      ],
      type: 'portfolio',
    },
    // E-commerce
    {
      patterns: [
        'sell product',
        'online store',
        'e-commerce',
        'ecommerce',
        'shopping',
        'buy online',
        'purchase',
        'checkout',
        'shop',
        'marketplace',
      ],
      type: 'ecommerce',
    },
    // Course / Education
    {
      patterns: [
        'course',
        'training',
        'teach',
        'learning',
        'education',
        'lessons',
        'tutorial',
        'workshop',
        'class',
        'certification',
      ],
      type: 'course',
    },
    // Blog
    {
      patterns: [
        'blog',
        'article',
        'news',
        'stories',
        'posts',
        'content',
        'writing',
        'publish',
      ],
      type: 'blog',
    },
    // SaaS
    {
      patterns: [
        'software',
        'saas',
        'app',
        'application',
        'tool',
        'platform',
        'dashboard',
        'web app',
      ],
      type: 'saas',
    },
  ];

  // Check each pattern set
  for (const { patterns, type } of platformPatterns) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        console.log(`[detectPlatformType] Matched "${pattern}" -> ${type}`);
        return type;
      }
    }
  }

  // Default to landing page (business site)
  console.log(
    `[detectPlatformType] No match found for "${description}", defaulting to "landing"`
  );
  return 'landing';
};
