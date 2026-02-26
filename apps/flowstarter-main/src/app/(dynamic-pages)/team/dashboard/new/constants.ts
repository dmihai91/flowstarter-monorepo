export type BusinessGoal = 'leads' | 'sales' | 'bookings';
export type BrandTone = 'professional' | 'friendly' | 'bold' | 'elegant' | 'playful';
export type OfferType = 'services' | 'products' | 'both' | 'info';

export interface ProjectData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  businessName: string;
  description: string;
  industry: string;
  targetAudience: string;
  uvp: string;
  goal: BusinessGoal | '';
  offerType: OfferType | '';
  brandTone: BrandTone | '';
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  website: string;
}

export const emptyProjectData: ProjectData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  businessName: '',
  description: '',
  industry: '',
  targetAudience: '',
  uvp: '',
  goal: '',
  offerType: '',
  brandTone: '',
  businessEmail: '',
  businessPhone: '',
  businessAddress: '',
  website: '',
};

export const industries = [
  'Consulting',
  'Coaching & Training',
  'Health & Wellness',
  'Beauty & Spa',
  'Restaurant & Food',
  'Retail & E-commerce',
  'Real Estate',
  'Legal Services',
  'Financial Services',
  'Technology',
  'Creative & Design',
  'Photography & Videography',
  'Education',
  'Construction & Trades',
  'Automotive',
  'Events & Entertainment',
  'Travel & Hospitality',
  'Fitness & Sports',
  'Other',
];

export const goalOptions: { value: BusinessGoal; label: string; desc: string }[] = [
  { value: 'leads', label: 'Get Leads', desc: 'Collect contact information from potential clients' },
  { value: 'bookings', label: 'Get Bookings', desc: 'Allow clients to schedule appointments' },
  { value: 'sales', label: 'Sell Products', desc: 'Sell products or services online' },
];

export const offerOptions: { value: OfferType; label: string }[] = [
  { value: 'services', label: 'Services' },
  { value: 'products', label: 'Products' },
  { value: 'both', label: 'Both' },
  { value: 'info', label: 'Information only' },
];

export const toneOptions: { value: BrandTone; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '👔' },
  { value: 'friendly', label: 'Friendly', emoji: '😊' },
  { value: 'bold', label: 'Bold', emoji: '🔥' },
  { value: 'elegant', label: 'Elegant', emoji: '✨' },
  { value: 'playful', label: 'Playful', emoji: '🎨' },
];

export const generationSteps = [
  { id: 'classifying', label: 'Analyzing your description...' },
  { id: 'generating', label: 'Generating business details...' },
  { id: 'finalizing', label: 'Preparing your project...' },
];

// Auto-detect industry from description
export function detectIndustry(description: string): string {
  const desc = description.toLowerCase();
  
  const patterns: [string, string[]][] = [
    ['Photography & Videography', ['photo', 'photographer', 'videograph', 'wedding photo', 'portrait', 'headshot', 'film', 'cinema']],
    ['Restaurant & Food', ['restaurant', 'cafe', 'coffee', 'bakery', 'catering', 'food', 'chef', 'cuisine', 'dining', 'bistro']],
    ['Health & Wellness', ['health', 'wellness', 'therapy', 'therapist', 'clinic', 'medical', 'doctor', 'dentist', 'chiropractic', 'massage']],
    ['Beauty & Spa', ['beauty', 'salon', 'spa', 'hair', 'nail', 'skincare', 'makeup', 'cosmetic', 'barber']],
    ['Fitness & Sports', ['fitness', 'gym', 'personal trainer', 'yoga', 'pilates', 'crossfit', 'sports', 'athletic']],
    ['Real Estate', ['real estate', 'realtor', 'property', 'homes', 'housing', 'apartment', 'rental']],
    ['Legal Services', ['law', 'legal', 'attorney', 'lawyer', 'litigation', 'court']],
    ['Financial Services', ['financial', 'accounting', 'tax', 'insurance', 'investment', 'mortgage', 'bank']],
    ['Technology', ['tech', 'software', 'app', 'saas', 'startup', 'digital', 'web development', 'programming']],
    ['Creative & Design', ['design', 'graphic', 'creative', 'branding', 'logo', 'illustration', 'art', 'artist']],
    ['Education', ['education', 'school', 'tutor', 'learning', 'course', 'training', 'academy', 'teaching']],
    ['Consulting', ['consult', 'advisor', 'strategy', 'management consulting', 'business consulting']],
    ['Coaching & Training', ['coach', 'coaching', 'mentor', 'life coach', 'executive coach', 'career coach']],
    ['Construction & Trades', ['construction', 'contractor', 'plumber', 'electrician', 'hvac', 'roofing', 'renovation']],
    ['Automotive', ['auto', 'car', 'mechanic', 'dealership', 'vehicle', 'repair shop']],
    ['Events & Entertainment', ['event', 'wedding', 'party', 'entertainment', 'dj', 'music', 'band', 'planner']],
    ['Travel & Hospitality', ['travel', 'hotel', 'tourism', 'hospitality', 'vacation', 'resort', 'airbnb']],
    ['Retail & E-commerce', ['shop', 'store', 'retail', 'ecommerce', 'boutique', 'online store', 'marketplace']],
  ];
  
  for (const [industry, keywords] of patterns) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return industry;
    }
  }
  
  return '';
}

export const cardClass = [
  'rounded-2xl border border-black/[0.08] dark:border-white/[0.08]',
  'bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl',
  'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset]',
  'dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]',
].join(' ');
