import { projectTemplates } from '@/data/project-templates';
import type { ProjectConfig } from '@/types/project-config';
import type { ProjectTemplate } from '@/types/project-types';

interface RecommendationInput {
  industry?: string;
  description?: string;
  targetUsers?: string;
  businessGoals?: string;
  USP?: string;
}

interface TemplateScore {
  template: ProjectTemplate;
  score: number;
  reasons: string[];
}

// Industry to template mapping
const INDUSTRY_TEMPLATE_MAP: Record<string, string[]> = {
  'consultants-coaches': [
    'personal-brand-1',
    'services-agency-1',
    'education-course-1',
  ],
  'therapists-psychologists': ['personal-brand-1', 'services-portfolio-1'],
  'photographers-videographers': ['personal-brand-2', 'services-portfolio-1'],
  'designers-creative-studios': [
    'personal-brand-2',
    'services-portfolio-1',
    'services-agency-1',
  ],
  'personal-trainers-wellness': ['local-business-2', 'education-course-1'],
  'salons-barbers-spas': ['local-business-2', 'local-business-1'],
  'restaurants-cafes': ['local-business-1', 'local-business-2'],
  'content-creation': ['personal-brand-2', 'ecom-light-creator-1'],
  'fashion-beauty': [
    'personal-brand-2',
    'ecom-light-single-1',
    'local-business-2',
  ],
  'health-wellness': [
    'local-business-2',
    'education-course-1',
    'personal-brand-1',
  ],
  other: ['personal-brand-1', 'services-agency-1', 'local-business-1'],
};

// Keywords that indicate certain template types
const TEMPLATE_KEYWORDS = {
  'personal-brand': [
    'personal',
    'freelancer',
    'consultant',
    'coach',
    'individual',
    'me',
    'my',
    'portfolio',
  ],
  'local-business': [
    'restaurant',
    'cafe',
    'salon',
    'shop',
    'local',
    'business',
    'service',
    'appointment',
  ],
  services: ['agency', 'marketing', 'services', 'consulting', 'professional'],
  saas: ['software', 'app', 'platform', 'tool', 'saas', 'startup', 'tech'],
  education: ['course', 'training', 'education', 'teach', 'learn', 'workshop'],
  ecommerce: [
    'sell',
    'product',
    'store',
    'shop',
    'buy',
    'merchandise',
    'merch',
  ],
  events: ['event', 'workshop', 'conference', 'meetup', 'seminar'],
};

// Style preference detection
const STYLE_KEYWORDS = {
  minimal: ['minimal', 'clean', 'simple', 'professional', 'sleek'],
  creative: ['creative', 'artistic', 'unique', 'bold', 'innovative', 'modern'],
  corporate: ['corporate', 'business', 'professional', 'formal', 'traditional'],
};

// Industries that should NOT see SaaS templates
const NON_SAAS_INDUSTRIES = [
  'consultants-coaches',
  'therapists-psychologists',
  'photographers-videographers',
  'designers-creative-studios',
  'personal-trainers-wellness',
  'salons-barbers-spas',
  'restaurants-cafes',
  'content-creation',
  'fashion-beauty',
  'health-wellness',
];

function scoreTemplate(
  template: ProjectTemplate,
  input: RecommendationInput
): TemplateScore {
  let score = 0;
  const reasons: string[] = [];
  const text = `${input.description || ''} ${input.targetUsers || ''} ${
    input.businessGoals || ''
  } ${input.USP || ''}`.toLowerCase();

  // Filter out SaaS templates for non-tech industries
  const isSaasTemplate =
    template.id.includes('saas') || template.category === 'saas';
  if (
    isSaasTemplate &&
    input.industry &&
    NON_SAAS_INDUSTRIES.includes(input.industry)
  ) {
    // Return very low score to effectively filter out
    return { template, score: -100, reasons: [] };
  }

  // Also filter if description clearly indicates non-tech focus
  if (isSaasTemplate) {
    const nonTechKeywords = [
      'coaching',
      'consulting',
      'therapy',
      'counseling',
      'photography',
      'salon',
      'restaurant',
      'cafe',
      'wellness',
      'fitness',
      'trainer',
      'artist',
      'designer portfolio',
      'freelance',
      'creative services',
    ];
    const hasNonTechKeywords = nonTechKeywords.some((keyword) =>
      text.includes(keyword)
    );
    if (
      hasNonTechKeywords &&
      !text.includes('software') &&
      !text.includes('app') &&
      !text.includes('platform')
    ) {
      return { template, score: -100, reasons: [] };
    }
  }

  // Industry match (highest weight)
  if (
    input.industry &&
    INDUSTRY_TEMPLATE_MAP[input.industry]?.includes(template.id)
  ) {
    score += 50;
    reasons.push('Perfect match for your industry');
  }

  // Template type keyword matching
  Object.entries(TEMPLATE_KEYWORDS).forEach(([type, keywords]) => {
    const keywordMatches = keywords.filter((keyword) =>
      text.includes(keyword)
    ).length;
    if (keywordMatches > 0) {
      const templateType = getTemplateType(template.id);
      if (templateType === type) {
        score += keywordMatches * 15;
        reasons.push(`Matches your ${type.replace('-', ' ')} needs`);
      }
    }
  });

  // Style preference matching
  Object.entries(STYLE_KEYWORDS).forEach(([style, keywords]) => {
    const keywordMatches = keywords.filter((keyword) =>
      text.includes(keyword)
    ).length;
    if (keywordMatches > 0 && template.styleTags) {
      const hasStyle = template.styleTags.some(
        (tag) =>
          tag.toLowerCase().includes(style) || style.includes(tag.toLowerCase())
      );
      if (hasStyle) {
        score += keywordMatches * 10;
        reasons.push(`Matches your ${style} style preference`);
      }
    }
  });

  // Target audience alignment
  if (input.targetUsers) {
    const audienceKeywords = ['customer', 'client', 'user', 'audience'];
    const hasAudienceFocus = audienceKeywords.some((keyword) =>
      text.includes(keyword)
    );
    if (
      hasAudienceFocus &&
      template.features.some((f) => f?.id === 'lead-capture')
    ) {
      score += 8;
      reasons.push('Great for customer engagement');
    }
  }

  // Business goals alignment
  if (input.businessGoals) {
    const goalText = input.businessGoals.toLowerCase();
    if (goalText.includes('lead') || goalText.includes('customer')) {
      if (template.features.some((f) => f?.id === 'lead-capture')) {
        score += 10;
        reasons.push('Perfect for lead generation');
      }
    }
    if (goalText.includes('sell') || goalText.includes('revenue')) {
      if (
        template.id.includes('ecom') ||
        template.features.some((f) => f?.id === 'product-gallery')
      ) {
        score += 15;
        reasons.push('Great for selling products');
      }
    }
  }

  // Complexity preference (favor simple templates)
  if (template.complexity === 'simple') {
    score += 5;
    reasons.push('Quick to set up and launch');
  }

  // Boost popular/versatile templates slightly
  const versatileTemplates = [
    'personal-brand-1',
    'local-business-1',
    'services-agency-1',
  ];
  if (versatileTemplates.includes(template.id)) {
    score += 3;
  }

  return { template, score, reasons: reasons.slice(0, 2) }; // Limit to top 2 reasons
}

function getTemplateType(templateId: string): string {
  if (templateId.includes('personal-brand')) return 'personal-brand';
  if (templateId.includes('local-business')) return 'local-business';
  if (templateId.includes('services')) return 'services';
  if (templateId.includes('saas')) return 'saas';
  if (templateId.includes('education') || templateId.includes('events'))
    return 'education';
  if (templateId.includes('ecom')) return 'ecommerce';
  return 'other';
}

export function getRecommendedTemplates(
  projectConfig: ProjectConfig,
  limit: number = 3
): TemplateScore[] {
  const input: RecommendationInput = {
    industry: projectConfig.designConfig?.businessInfo?.industry,
    description: projectConfig.description,
    targetUsers: projectConfig.targetUsers,
    businessGoals: projectConfig.businessGoals,
    USP: projectConfig.USP,
  };

  // Get all published templates
  const publishedTemplates = projectTemplates.filter(
    (t) => t.status === 'published'
  );

  // If we have input data, score and sort them
  const hasInputData =
    input.industry ||
    input.description ||
    input.targetUsers ||
    input.businessGoals ||
    input.USP;

  if (hasInputData) {
    const scoredTemplates = publishedTemplates
      .map((template) => scoreTemplate(template, input))
      // Filter out templates with negative scores (filtered out)
      .filter((scored) => scored.score >= 0);
    // Sort by score and return top templates
    return scoredTemplates.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // If no input data, just return first N templates with a default score
  return publishedTemplates.slice(0, limit).map((template) => ({
    template,
    score: 5,
    reasons: ['Popular choice'],
  }));
}

export function hasRecommendations(projectConfig: ProjectConfig): boolean {
  return getRecommendedTemplates(projectConfig, 1).length > 0;
}
