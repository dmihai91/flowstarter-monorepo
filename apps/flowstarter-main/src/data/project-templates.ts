import type {
  ProjectCategory,
  ProjectFeature,
  ProjectTemplate,
} from '@/types/project-types';

export const projectFeatures: ProjectFeature[] = [
  // Frontend Features
  {
    id: 'hero-section',
    name: 'Hero Section',
    description: 'Eye-catching header with title, subtitle, and CTA',
    required: true,
    category: 'frontend',
  },
  {
    id: 'features-section',
    name: 'Features/Benefits',
    description: 'Showcase your key features or benefits',
    required: true,
    category: 'frontend',
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Lead capture form connected to database',
    required: true,
    category: 'frontend',
  },
  {
    id: 'product-gallery',
    name: 'Product Gallery',
    description: 'Display products with images and descriptions',
    required: false,
    category: 'frontend',
  },
  {
    id: 'product-details',
    name: 'Product Detail Pages',
    description: 'Individual pages for each product',
    required: false,
    category: 'frontend',
  },
  {
    id: 'responsive-design',
    name: 'Mobile-First Design',
    description: 'Fully responsive design that works on all devices',
    required: true,
    category: 'frontend',
  },

  // Backend Features
  {
    id: 'lead-capture',
    name: 'Lead Management',
    description: 'Store and manage customer inquiries',
    required: true,
    category: 'backend',
  },
  {
    id: 'product-management',
    name: 'Product Database',
    description: 'Store product information and inventory',
    required: false,
    category: 'backend',
  },
  {
    id: 'email-notifications',
    name: 'Email Notifications',
    description: 'Get notified when someone contacts you',
    required: false,
    category: 'backend',
  },

  // AI Features
  {
    id: 'ai-copy-generator',
    name: 'AI Copy Generator',
    description: 'Generate headlines, taglines, and product descriptions',
    required: false,
    category: 'ai',
  },
  {
    id: 'seo-optimization',
    name: 'SEO Meta Generation',
    description: 'AI-generated meta titles and descriptions',
    required: false,
    category: 'ai',
  },

  // Database Features
  {
    id: 'supabase-db',
    name: 'Supabase Database',
    description: 'PostgreSQL database for your content',
    required: true,
    category: 'database',
  },
  {
    id: 'real-time-updates',
    name: 'Real-time Updates',
    description: 'Live updates when new leads come in',
    required: false,
    category: 'database',
  },

  // Deployment Features
  {
    id: 'vercel-deployment',
    name: 'Vercel Deployment',
    description: 'One-click deployment to Vercel',
    required: true,
    category: 'deployment',
  },
  {
    id: 'custom-domain',
    name: 'Custom Domain Support',
    description: 'Connect your own domain name',
    required: false,
    category: 'deployment',
  },
];

// Helper function to safely get features
const getFeature = (id: string) => projectFeatures.find((f) => f.id === id);

export const projectTemplates: ProjectTemplate[] = [
  // Enhanced Templates with Argon Dashboard Styling
  {
    id: 'personal-brand-pro',
    slug: 'personal-brand-pro',
    name: 'Personal Brand - Pro',
    description:
      'Premium landing page with Flowstarter unique styling - perfect for executives, consultants, and high-end professionals',
    category: {} as ProjectCategory,
    styleTags: ['Premium', 'Gradient', 'Modern'],
    status: 'published',
    thumbnailUrl: '/images/projects-view.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('ai-copy-generator'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: [
        'React 18',
        'Vite 5',
        'Tailwind CSS',
        'Lucide Icons',
        'Argon-inspired Design',
      ],
      backend: ['API Routes (optional)', 'Email Integration'],
      database: ['Supabase PostgreSQL'],
      ai: ['GPT-4 for copy generation'],
      deployment: ['Vercel', 'Netlify', 'Any static host'],
    },
    complexity: 'simple',
    estimatedTime: '25 minutes',
    preview: '/templates/personal-brand-pro',
  },
  {
    id: 'local-business-pro',
    slug: 'local-business-pro',
    name: 'Local Business - Pro',
    description:
      'Stunning Argon-styled template for restaurants, cafes, salons, and local services',
    category: {} as ProjectCategory,
    styleTags: ['Premium', 'Vibrant', 'Local'],
    status: 'published',
    thumbnailUrl: '/images/admin-dashboard-users.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('email-notifications'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: [
        'React 18',
        'Vite 5',
        'Tailwind CSS',
        'Lucide Icons',
        'Dashboard-inspired Design',
      ],
      backend: ['API Routes (optional)', 'Email Integration'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel', 'Netlify', 'Any static host'],
    },
    complexity: 'simple',
    estimatedTime: '25 minutes',
    preview: '/templates/local-business-pro',
  },
  {
    id: 'saas-product-pro',
    slug: 'saas-product-pro',
    name: 'SaaS Product - Pro',
    description:
      'Premium SaaS landing page with Argon styling - includes pricing tables and feature showcase',
    category: {} as ProjectCategory,
    styleTags: ['Premium', 'Tech', 'SaaS'],
    status: 'published',
    thumbnailUrl: '/images/supabase-dashboard.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: [
        'React 18',
        'Vite 5',
        'Tailwind CSS',
        'Lucide Icons',
        'Notus-inspired Design',
      ],
      backend: ['API Routes (optional)'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel', 'Netlify', 'Any static host'],
    },
    complexity: 'simple',
    estimatedTime: '20 minutes',
    preview: '/templates/saas-product-pro',
  },
  {
    id: 'personal-brand-1',
    slug: 'personal-brand-professional',
    name: 'Personal Brand - Professional',
    description:
      'Clean, professional landing page for consultants, freelancers, and coaches',
    category: {} as ProjectCategory,
    styleTags: ['Minimal', 'Corporate'],
    status: 'published',
    thumbnailUrl: '/images/projects-view.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('ai-copy-generator'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'Resend Email'],
      database: ['Supabase PostgreSQL'],
      ai: ['GPT-4 for copy generation'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/personal-brand-1',
  },
  {
    id: 'personal-brand-2',
    slug: 'personal-brand-creative',
    name: 'Personal Brand - Creative',
    description:
      'Modern, creative layout for designers, artists, and creative professionals',
    category: {} as ProjectCategory,
    styleTags: ['Creative', 'Bold'],
    status: 'published',
    thumbnailUrl: '/images/projects-view-2.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('ai-copy-generator'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'Resend Email'],
      database: ['Supabase PostgreSQL'],
      ai: ['GPT-4 for copy generation'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '35 minutes',
    preview: '/templates/personal-brand-2',
  },
  // Local Business Templates
  {
    id: 'local-business-1',
    slug: 'local-business-restaurant',
    name: 'Local Business - Restaurant',
    description: 'Perfect for restaurants, cafes, and food service businesses',
    category: {} as ProjectCategory,
    styleTags: ['Bold'],
    status: 'published',
    thumbnailUrl: '/images/admin-dashboard-users.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('email-notifications'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'WhatsApp Integration'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/local-business-1',
  },
  {
    id: 'local-business-2',
    slug: 'local-business-fitness',
    name: 'Local Business - Services',
    description:
      'Ideal for salons, shops, repair services, and professional services',
    category: {} as ProjectCategory,
    styleTags: ['Minimal'],
    status: 'published',
    thumbnailUrl: '/images/admin-dashboard-users-2.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('email-notifications'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'WhatsApp Integration'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '35 minutes',
    preview: '/templates/local-business-2',
  },
  // Services & Agencies
  {
    id: 'services-agency-1',
    slug: 'services-marketing-agency',
    name: 'Services – Marketing Agency',
    description: 'Pitch services and capture leads for a marketing agency',
    category: {} as ProjectCategory,
    styleTags: ['Corporate', 'Bold'],
    status: 'published',
    thumbnailUrl: '/images/admin-dashboard-2.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'Resend Email'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/services-agency-1',
  },
  {
    id: 'services-portfolio-1',
    slug: 'services-portfolio',
    name: 'Services – Portfolio',
    description: 'Show your portfolio and collect inquiries',
    category: {} as ProjectCategory,
    styleTags: ['Minimal', 'Creative'],
    status: 'published',
    thumbnailUrl: '/images/projects-view.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'Resend Email'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/services-portfolio-1',
  },
  // SaaS & Product
  {
    id: 'saas-product-launch-1',
    slug: 'saas-product-launch-1',
    name: 'SaaS – Product Launch (v1)',
    description: 'Collect waitlist for upcoming SaaS',
    category: {} as ProjectCategory,
    styleTags: ['Minimal', 'Corporate'],
    status: 'published',
    thumbnailUrl: '/images/supabase-dashboard.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes', 'Resend Email'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '25 minutes',
    preview: '/templates/saas-product-launch-1',
  },
  {
    id: 'saas-product-launch-2',
    slug: 'saas-product-launch-2',
    name: 'SaaS – Product Launch (v2)',
    description: 'Highlight product features and pricing',
    category: {} as ProjectCategory,
    styleTags: ['Creative', 'Bold'],
    status: 'published',
    thumbnailUrl: '/images/supabase-graphs.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/saas-product-launch-2',
  },
  // Education & Events
  {
    id: 'education-course-1',
    slug: 'education-course-coach',
    name: 'Education – Course/Coach',
    description: 'Sell a course or coaching program',
    category: {} as ProjectCategory,
    styleTags: ['Corporate'],
    status: 'published',
    thumbnailUrl: '/images/supabase-tables.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/education-course-1',
  },
  {
    id: 'events-workshop-1',
    slug: 'events-workshop',
    name: 'Events – Workshop',
    description: 'Promote a workshop with registration',
    category: {} as ProjectCategory,
    styleTags: ['Bold'],
    status: 'published',
    thumbnailUrl: '/images/supabase-sql-editor.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('contact-form'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '30 minutes',
    preview: '/templates/events-workshop-1',
  },
  // E-Commerce Light
  {
    id: 'ecom-light-single-1',
    slug: 'ecommerce-light-single-product',
    name: 'E-Commerce Light – Single Product',
    description: 'Sell a single product with checkout links',
    category: {} as ProjectCategory,
    styleTags: ['Minimal', 'Creative'],
    status: 'published',
    thumbnailUrl: '/images/admin-dashboard-maintenance-mode.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '20 minutes',
    preview: '/templates/ecom-light-single-1',
  },
  {
    id: 'ecom-light-creator-1',
    slug: 'ecommerce-light-creator-merch',
    name: 'E-Commerce Light – Creator Merch',
    description: 'Merch store for creators using simple checkout',
    category: {} as ProjectCategory,
    styleTags: ['Bold'],
    status: 'published',
    thumbnailUrl: '/images/projects-view-2.png',
    features: [
      getFeature('hero-section'),
      getFeature('features-section'),
      getFeature('responsive-design'),
      getFeature('lead-capture'),
      getFeature('supabase-db'),
      getFeature('vercel-deployment'),
    ].filter(Boolean) as ProjectFeature[],
    techStack: {
      frontend: ['TanStack Start', 'React 19', 'TypeScript', 'Tailwind CSS'],
      backend: ['TanStack Start API Routes'],
      database: ['Supabase PostgreSQL'],
      deployment: ['Vercel'],
    },
    complexity: 'simple',
    estimatedTime: '25 minutes',
    preview: '/templates/ecom-light-creator-1',
  },
];

// Dynamically set thumbnail URLs based on template ID
// Templates with thumbnails should have them in /assets/template-thumbnails/
for (const t of projectTemplates) {
  // Check if thumbnail exists by attempting to use it
  // In production, you might want to verify file existence or use a config
  const potentialThumbnailPath = `/assets/template-thumbnails/${t.id}.png`;

  // For now, set thumbnail for known templates with the naming convention
  // In the future, this should check template config or file existence
  if (
    t.id.includes('-pro') ||
    t.id.includes('local-business-') ||
    t.id.includes('personal-brand-') ||
    t.id.includes('saas-product-')
  ) {
    t.thumbnailUrl = potentialThumbnailPath;
  }
}

export const projectCategories: ProjectCategory[] = [
  {
    id: 'personal-brand',
    name: 'Personal Brand',
    description: 'Websites for consultants, freelancers, coaches, and creators',
    icon: 'users',
    templates: [],
  },
  {
    id: 'local-business',
    name: 'Local Business',
    description: 'Websites for restaurants, salons, shops, and services',
    icon: 'store',
    templates: [],
  },
  {
    id: 'services-agencies',
    name: 'Services & Agencies',
    description: '',
    icon: 'briefcase',
    templates: [],
  },
  {
    id: 'saas-product',
    name: 'SaaS & Product',
    description: '',
    icon: 'app',
    templates: [],
  },
  {
    id: 'education-events',
    name: 'Education & Events',
    description: '',
    icon: 'book',
    templates: [],
  },
  {
    id: 'ecommerce-light',
    name: 'E-Commerce (Light)',
    description: '',
    icon: 'cart',
    templates: [],
  },
];

// Map template ID prefixes to category IDs
// This allows for more maintainable category assignment
const categoryMappings: Array<{
  prefix: string;
  categoryId: string;
  alternatePrefix?: string;
}> = [
  { prefix: 'personal-brand', categoryId: 'personal-brand' },
  { prefix: 'local-business', categoryId: 'local-business' },
  { prefix: 'services-', categoryId: 'services-agencies' },
  { prefix: 'saas-', categoryId: 'saas-product' },
  { prefix: 'education-', categoryId: 'education-events' },
  { prefix: 'events-', categoryId: 'education-events' },
  { prefix: 'ecom-light', categoryId: 'ecommerce-light' },
];

// Update template categories and category templates
for (const template of projectTemplates) {
  // Find matching category based on template ID prefix
  const mapping = categoryMappings.find((m) =>
    template.id.startsWith(m.prefix)
  );

  if (mapping) {
    const category = projectCategories.find(
      (cat) => cat.id === mapping.categoryId
    );
    if (category) {
      template.category = category;
      category.templates.push(template);
    }
  }
}
