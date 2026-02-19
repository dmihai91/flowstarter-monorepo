export interface ExampleSite {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  image: string;
  techStack: string[];
  features: string[];
  industry: string;
  isFeatured?: boolean;
  createdWith?: string; // Template used to create this
  stats?: {
    views?: number;
    leads?: number;
    conversionRate?: string;
  };
}

export const exampleSites: ExampleSite[] = [
  {
    id: 'example-saas-1',
    name: 'TaskFlow Pro',
    description:
      'AI-powered project management for modern teams. Used by 10,000+ companies. 14-day free trial, no credit card required.',
    category: 'SaaS',
    url: 'https://linear.app',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Stripe'],
    features: [
      'Interactive demo',
      'Pricing calculator',
      'Customer stories',
      'API documentation',
    ],
    industry: 'SaaS',
    isFeatured: true,
    createdWith: 'saas-product-launch-1',
    stats: {
      views: 45900,
      conversionRate: '7.5%',
    },
  },
  {
    id: 'example-saas-2',
    name: 'CodeShield',
    description:
      'Automated security code review tool for GitHub and GitLab. Catch vulnerabilities before deployment.',
    category: 'SaaS',
    url: 'https://snyk.io',
    image:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Vercel'],
    features: [
      'Live scanner',
      'Team collaboration',
      'CI/CD integration',
      'Compliance reports',
    ],
    industry: 'Developer Tools',
    isFeatured: true,
    createdWith: 'saas-product-launch-2',
    stats: {
      views: 32300,
      conversionRate: '6.7%',
    },
  },
  {
    id: 'example-business-1',
    name: 'Bella Vita Italian Kitchen',
    description:
      'Family-owned Italian restaurant in Brooklyn. Online reservations, seasonal menu, and catering services available.',
    category: 'Local Business',
    url: 'https://www.pizzeriadelfina.com',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS'],
    features: [
      'Menu & allergen info',
      'Online reservations',
      'Photo gallery',
      'Catering inquiries',
    ],
    industry: 'Restaurant',
    isFeatured: true,
    createdWith: 'local-business-1',
    stats: {
      views: 22400,
      conversionRate: '5.5%',
    },
  },
  {
    id: 'example-personal-1',
    name: 'Alex Chen - UX Designer',
    description:
      'Award-winning UX designer portfolio featuring Fortune 500 projects and interactive case studies.',
    category: 'Personal Brand',
    url: 'https://brittanychiang.com',
    image:
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Framer Motion'],
    features: [
      'Interactive portfolio',
      'Case studies',
      'Client testimonials',
      'Contact form',
    ],
    industry: 'Design',
    createdWith: 'personal-brand-1',
    stats: {
      views: 12500,
      conversionRate: '1.2%',
    },
  },
  {
    id: 'example-business-2',
    name: 'Peak Performance Gym',
    description:
      'Premium 24/7 fitness center with Olympic equipment, personal training, and group classes.',
    category: 'Local Business',
    url: 'https://www.equinox.com',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Supabase'],
    features: [
      'Class schedule',
      'Trainer bios',
      'Membership tiers',
      'Virtual tour',
    ],
    industry: 'Fitness',
    createdWith: 'local-business-2',
    stats: {
      views: 18900,
      conversionRate: '4.0%',
    },
  },
  {
    id: 'example-personal-2',
    name: 'Sarah Mitchell Coaching',
    description:
      'Certified life coach helping professionals find work-life balance. 1-on-1 coaching packages and group workshops.',
    category: 'Personal Brand',
    url: 'https://www.marieforleo.com',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=675&fit=crop',
    techStack: ['TanStack Start', 'React 19', 'Tailwind CSS', 'Supabase'],
    features: [
      'Service packages',
      'Video testimonials',
      'Booking calendar',
      'Newsletter signup',
    ],
    industry: 'Coaching',
    createdWith: 'personal-brand-2',
    stats: {
      views: 8200,
      conversionRate: '2.9%',
    },
  },
];

export const exampleCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Personal Brand', label: 'Personal Brand' },
  { value: 'Local Business', label: 'Local Business' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Services', label: 'Services' },
  { value: 'Portfolio', label: 'Portfolio' },
  { value: 'Education', label: 'Education' },
  { value: 'Events', label: 'Events' },
  { value: 'E-commerce', label: 'E-commerce' },
];

export const exampleIndustries = [
  'All Industries',
  'Design',
  'Coaching',
  'Photography',
  'Restaurant',
  'Fitness',
  'SaaS',
  'Developer Tools',
  'Marketing',
  'Education',
  'Events',
  'E-commerce',
  'Creator Economy',
];
