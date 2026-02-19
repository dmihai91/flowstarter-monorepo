interface DomainValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export class DomainValidator {
  // Common TLDs for validation
  private static readonly VALID_TLDS = [
    'com',
    'org',
    'net',
    'edu',
    'gov',
    'mil',
    'int',
    'co',
    'io',
    'ai',
    'app',
    'dev',
    'tech',
    'info',
    'biz',
    'name',
    'pro',
    'aero',
    'asia',
    'cat',
    'coop',
    'jobs',
    'mobi',
    'museum',
    'tel',
    'travel',
    'xxx',
    'academy',
    'accountant',
    'actor',
    'adult',
    'agency',
    'apartments',
    'app',
    'art',
    'associates',
    'auction',
    'auto',
    'band',
    'bar',
    'bargains',
    'beer',
    'bike',
    'blog',
    'boutique',
    'business',
    'cab',
    'cafe',
    'camera',
    'camp',
    'capital',
    'cards',
    'care',
    'career',
    'careers',
    'cash',
    'casino',
    'catering',
    'center',
    'charity',
    'chat',
    'cheap',
    'church',
    'city',
    'claims',
    'cleaning',
    'clinic',
    'clothing',
    'cloud',
    'club',
    'coach',
    'codes',
    'coffee',
    'college',
    'community',
    'company',
    'computer',
    'construction',
    'consulting',
    'contractors',
    'cooking',
    'cool',
    'country',
    'coupons',
    'courses',
    'credit',
    'cricket',
    'cruises',
    'dance',
    'dating',
    'deals',
    'degree',
    'delivery',
    'democrat',
    'dental',
    'dentist',
    'design',
    'diamonds',
    'digital',
    'direct',
    'directory',
    'discount',
    'doctor',
    'domains',
    'download',
    'earth',
    'education',
    'email',
    'energy',
    'engineer',
    'engineering',
    'enterprises',
    'equipment',
    'estate',
    'events',
    'exchange',
    'expert',
    'exposed',
    'express',
    'fail',
    'family',
    'fan',
    'farm',
    'fashion',
    'film',
    'finance',
    'financial',
    'fish',
    'fitness',
    'flights',
    'florist',
    'football',
    'forex',
    'forsale',
    'foundation',
    'fund',
    'furniture',
    'futbol',
    'fyi',
    'gallery',
    'games',
    'garden',
    'gift',
    'gifts',
    'gives',
    'glass',
    'global',
    'gold',
    'golf',
    'graphics',
    'gratis',
    'green',
    'gripe',
    'group',
    'guide',
    'guitars',
    'guru',
    'healthcare',
    'help',
    'hiphop',
    'hockey',
    'holdings',
    'holiday',
    'home',
    'horse',
    'hospital',
    'host',
    'hosting',
    'house',
    'how',
    'immobilien',
    'industries',
    'institute',
    'insurance',
    'international',
    'investments',
    'jewelry',
    'kaufen',
    'kitchen',
    'land',
    'lawyer',
    'lease',
    'legal',
    'life',
    'lighting',
    'limited',
    'limo',
    'live',
    'loan',
    'loans',
    'love',
    'ltd',
    'luxury',
    'management',
    'market',
    'marketing',
    'markets',
    'mba',
    'media',
    'memorial',
    'men',
    'menu',
    'miami',
    'money',
    'mortgage',
    'movie',
    'network',
    'news',
    'ninja',
    'now',
    'online',
    'partners',
    'parts',
    'party',
    'photography',
    'photos',
    'pictures',
    'pink',
    'pizza',
    'place',
    'plumbing',
    'plus',
    'poker',
    'porn',
    'press',
    'productions',
    'properties',
    'property',
    'pub',
    'racing',
    'recipes',
    'red',
    'rehab',
    'rent',
    'rentals',
    'repair',
    'report',
    'republican',
    'rest',
    'restaurant',
    'review',
    'reviews',
    'rip',
    'rocks',
    'run',
    'sale',
    'salon',
    'school',
    'science',
    'securities',
    'security',
    'services',
    'sex',
    'sexy',
    'shoes',
    'show',
    'singles',
    'site',
    'ski',
    'soccer',
    'social',
    'software',
    'solar',
    'solutions',
    'space',
    'sport',
    'store',
    'studio',
    'study',
    'style',
    'supplies',
    'supply',
    'support',
    'surgery',
    'systems',
    'tax',
    'taxi',
    'team',
    'technology',
    'tennis',
    'theater',
    'theatre',
    'tips',
    'tires',
    'today',
    'tools',
    'top',
    'tours',
    'town',
    'toys',
    'trade',
    'training',
    'translations',
    'tube',
    'university',
    'uno',
    'vacations',
    'vet',
    'video',
    'villas',
    'vision',
    'vodka',
    'vote',
    'voyage',
    'watch',
    'website',
    'wedding',
    'wiki',
    'win',
    'wine',
    'work',
    'works',
    'world',
    'wow',
    'wtf',
    'xyz',
    'yoga',
    'zone',
  ];

  /**
   * Validates a domain name
   */
  static validate(domain: string): DomainValidationResult {
    if (!domain || typeof domain !== 'string') {
      return {
        isValid: false,
        error: 'Domain is required',
      };
    }

    const trimmedDomain = domain.trim().toLowerCase();

    // Check for empty domain
    if (!trimmedDomain) {
      return {
        isValid: false,
        error: 'Domain cannot be empty',
      };
    }

    // Check for spaces
    if (trimmedDomain.includes(' ')) {
      return {
        isValid: false,
        error: 'Domain cannot contain spaces',
        suggestions: [trimmedDomain.replace(/\s+/g, '-')],
      };
    }

    // Check for protocol prefixes
    if (
      trimmedDomain.startsWith('http://') ||
      trimmedDomain.startsWith('https://')
    ) {
      return {
        isValid: false,
        error: 'Remove http:// or https:// from the domain',
        suggestions: [trimmedDomain.replace(/^https?:\/\//, '')],
      };
    }

    // Check for www prefix
    if (trimmedDomain.startsWith('www.')) {
      return {
        isValid: false,
        error: 'Remove www. from the domain',
        suggestions: [trimmedDomain.replace(/^www\./, '')],
      };
    }

    // Check for path or query parameters
    if (
      trimmedDomain.includes('/') ||
      trimmedDomain.includes('?') ||
      trimmedDomain.includes('#')
    ) {
      return {
        isValid: false,
        error: 'Domain should not include paths or parameters',
        suggestions: [trimmedDomain.split(/[/?#]/)[0]],
      };
    }

    // Check domain length
    if (trimmedDomain.length > 253) {
      return {
        isValid: false,
        error: 'Domain is too long (maximum 253 characters)',
      };
    }

    if (trimmedDomain.length < 3) {
      return {
        isValid: false,
        error: 'Domain is too short (minimum 3 characters)',
      };
    }

    // Check for valid characters (only letters, numbers, dots, and hyphens)
    if (!/^[a-z0-9.-]+$/.test(trimmedDomain)) {
      return {
        isValid: false,
        error:
          'Domain contains invalid characters (only letters, numbers, dots, and hyphens allowed)',
      };
    }

    // Check for consecutive dots or hyphens
    if (trimmedDomain.includes('..') || trimmedDomain.includes('--')) {
      return {
        isValid: false,
        error: 'Domain cannot have consecutive dots or hyphens',
      };
    }

    // Check if starts or ends with dot or hyphen
    if (
      trimmedDomain.startsWith('.') ||
      trimmedDomain.endsWith('.') ||
      trimmedDomain.startsWith('-') ||
      trimmedDomain.endsWith('-')
    ) {
      return {
        isValid: false,
        error: 'Domain cannot start or end with a dot or hyphen',
      };
    }

    // Split into parts for validation
    const parts = trimmedDomain.split('.');

    // Must have at least 2 parts (domain.tld)
    if (parts.length < 2) {
      return {
        isValid: false,
        error: 'Domain must include a top-level domain (e.g., .com, .org)',
        suggestions: [
          `${trimmedDomain}.com`,
          `${trimmedDomain}.org`,
          `${trimmedDomain}.net`,
        ],
      };
    }

    // Validate each part
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!part) {
        return {
          isValid: false,
          error: 'Domain parts cannot be empty',
        };
      }

      if (part.length > 63) {
        return {
          isValid: false,
          error: `Domain part "${part}" is too long (maximum 63 characters)`,
        };
      }

      if (part.startsWith('-') || part.endsWith('-')) {
        return {
          isValid: false,
          error: `Domain part "${part}" cannot start or end with a hyphen`,
        };
      }

      // Check if all numeric (not allowed for domain names)
      if (/^\d+$/.test(part) && i !== parts.length - 1) {
        return {
          isValid: false,
          error: 'Domain parts cannot be purely numeric',
        };
      }
    }

    // Validate TLD
    const tld = parts[parts.length - 1];
    if (!this.VALID_TLDS.includes(tld)) {
      const suggestions = this.VALID_TLDS.filter((validTld) =>
        validTld.startsWith(tld.charAt(0))
      )
        .slice(0, 3)
        .map(
          (suggestedTld) => parts.slice(0, -1).join('.') + '.' + suggestedTld
        );

      return {
        isValid: false,
        error: `"${tld}" is not a recognized top-level domain`,
        suggestions:
          suggestions.length > 0
            ? suggestions
            : [`${parts.slice(0, -1).join('.')}.com`],
      };
    }

    // Check for reserved domains
    const reservedDomains = ['localhost', 'example.com', 'test.com', 'invalid'];
    if (reservedDomains.some((reserved) => trimmedDomain.includes(reserved))) {
      return {
        isValid: false,
        error: 'Cannot use reserved or example domains',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Quick validation for real-time feedback
   */
  static validateQuick(domain: string): boolean {
    return this.validate(domain).isValid;
  }

  /**
   * Get validation status with details
   */
  static getValidationStatus(domain: string): 'valid' | 'invalid' | 'empty' {
    if (!domain || !domain.trim()) return 'empty';
    return this.validate(domain).isValid ? 'valid' : 'invalid';
  }
}
