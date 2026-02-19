// Platform Configuration Constants
export const PLATFORM_CONFIG = {
  // Main platform domain - change this to update across the entire application
  DOMAIN: 'flowstarter.io',

  // Platform name and branding
  NAME: 'Flowstarter',
  DESCRIPTION: 'Build your business with flow',

  // Support and contact
  SUPPORT_EMAIL: 'support@flowstarter.io',

  // Social links
  SOCIAL: {
    TWITTER: 'https://twitter.com/flowstarter',
    GITHUB: 'https://github.com/flowstarter',
    LINKEDIN: 'https://linkedin.com/company/flowstarter',
  },

  // Default hosting providers
  DEFAULT_HOSTING_PROVIDER: 'vercel' as const,

  // Domain generation settings
  SUBDOMAIN_SUFFIX: '.flowstarter.ai',

  // Project defaults
  DEFAULTS: {
    FONTS: {
      HEADING: 'inter',
      BODY: 'inter',
    },
    COLOR: '#3b82f6',
  },

  // Layout constants
  PAGE_MAX_WIDTH: '1600px',
} as const;

// Dropdown Options for Customization Details
export const DROPDOWN_OPTIONS = {
  BUSINESS_MODELS: [
    { value: 'b2b', label: 'B2B (Business to Business)' },
    { value: 'b2c', label: 'B2C (Business to Consumer)' },
    { value: 'saas', label: 'SaaS (Software as a Service)' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'service', label: 'Service Provider' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'portfolio', label: 'Portfolio/Personal' },
    { value: 'other', label: 'Other' },
  ],

  BRAND_TONES: [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly & Casual' },
    { value: 'luxury', label: 'Luxury & Premium' },
    { value: 'creative', label: 'Creative & Artistic' },
    { value: 'technical', label: 'Technical & Expert' },
    { value: 'modern', label: 'Modern & Innovative' },
    { value: 'traditional', label: 'Traditional & Classic' },
    { value: 'playful', label: 'Playful & Fun' },
  ],

  CONTACT_METHODS: [
    { value: 'form', label: 'Contact Form' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'chat', label: 'Live Chat' },
    { value: 'booking', label: 'Online Booking' },
    { value: 'multiple', label: 'Multiple Methods' },
  ],
} as const;

// Domain utilities
export const DOMAIN_UTILS = {
  /**
   * Generates a full domain for a project
   * @param projectName - The project name to convert to a domain
   * @returns The full domain with .flowstarter.io suffix
   */
  generateProjectDomain: (projectName: string): string => {
    if (!projectName) return '';
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}${PLATFORM_CONFIG.SUBDOMAIN_SUFFIX}`;
  },

  /**
   * Checks if a domain is a custom domain (has a dot) or should use platform subdomain
   * @param domain - The domain string to check
   * @returns The properly formatted domain
   */
  formatDomain: (domain: string): string => {
    if (!domain) return '';

    // If domain contains a dot, it's likely a custom domain
    if (
      domain.includes('.') &&
      !domain.toLowerCase().endsWith(PLATFORM_CONFIG.SUBDOMAIN_SUFFIX)
    ) {
      return domain.toLowerCase();
    }

    // If it's just a subdomain name, add our suffix
    const subdomain = domain
      .toLowerCase()
      .replace(PLATFORM_CONFIG.SUBDOMAIN_SUFFIX, '');
    return `${subdomain}${PLATFORM_CONFIG.SUBDOMAIN_SUFFIX}`;
  },

  /**
   * Checks if a domain is a custom domain or platform subdomain
   * @param domain - The domain to check
   * @returns true if it's a custom domain, false if it's a platform subdomain
   */
  isCustomDomain: (domain: string): boolean => {
    const d = (domain || '').toLowerCase();
    return d.includes('.') && !d.endsWith(PLATFORM_CONFIG.SUBDOMAIN_SUFFIX);
  },
} as const;
