import type {
  ProjectBrief,
  TemplateRegistryEntry,
  TemplateSelection,
  TemplateSelectionCandidate,
} from './contracts';

const INDUSTRY_CATEGORY_MAP: Record<string, string[]> = {
  coaching: ['coaching', 'business', 'personal-brand'],
  fitness: ['fitness', 'health-fitness', 'wellness'],
  'mental-health': ['mental-health', 'wellness'],
  wellness: ['wellness', 'health-wellness'],
  beauty: ['beauty', 'beauty-wellness'],
  education: ['education'],
  restaurant: ['food-service'],
  creative: ['creative', 'personal-brand'],
  photography: ['creative', 'personal-brand'],
  consulting: ['business', 'coaching'],
  other: ['business', 'personal-brand'],
};

function scoreTemplate(
  brief: ProjectBrief,
  template: TemplateRegistryEntry
): TemplateSelectionCandidate {
  let score = 0;
  const reasons: string[] = [];
  const normalizedIndustry = brief.business.industry.toLowerCase();
  const normalizedCategory = template.category.toLowerCase();
  const categoryMatches =
    INDUSTRY_CATEGORY_MAP[normalizedIndustry] ?? INDUSTRY_CATEGORY_MAP.other;

  if (categoryMatches.includes(normalizedCategory)) {
    score += 50;
    reasons.push(`Category matches ${brief.business.industry}`);
  }

  if (
    brief.constraints.pagePreference === 'multi-page' &&
    template.features.some((feature) => feature.toLowerCase().includes('multi-page'))
  ) {
    score += 15;
    reasons.push('Supports multi-page builds');
  }

  if (
    brief.business.goals.includes('bookings') &&
    template.features.some((feature) => feature.toLowerCase().includes('booking'))
  ) {
    score += 15;
    reasons.push('Booking flow aligns with business goal');
  }

  if (
    brief.business.goals.includes('newsletter') &&
    template.features.some((feature) => feature.toLowerCase().includes('newsletter'))
  ) {
    score += 10;
    reasons.push('Newsletter support is available');
  }

  if (
    brief.business.goals.includes('sales') &&
    template.features.some((feature) => feature.toLowerCase().includes('pricing'))
  ) {
    score += 10;
    reasons.push('Pricing-oriented sections are available');
  }

  if (brief.business.offerings.length > 0) {
    const matchedTags = brief.business.offerings.filter((offering) =>
      template.tags.some((tag) => offering.toLowerCase().includes(tag.toLowerCase()))
    );

    if (matchedTags.length > 0) {
      score += Math.min(10, matchedTags.length * 4);
      reasons.push('Template tags overlap with offerings');
    }
  }

  return {
    templateSlug: template.slug,
    score,
    reasons,
  };
}

export function selectTemplate(
  brief: ProjectBrief,
  registry: TemplateRegistryEntry[],
  manualTemplateSlug?: string
): TemplateSelection {
  if (registry.length === 0) {
    return {
      version: 'v1',
      templateSlug: manualTemplateSlug || 'coach-pro',
      templateName: manualTemplateSlug || 'coach-pro',
      strategy: 'fallback',
      score: 0,
      reasons: ['Template registry unavailable, using safe fallback'],
      alternatives: [],
    };
  }

  if (manualTemplateSlug) {
    const manualTemplate = registry.find((entry) => entry.slug === manualTemplateSlug);
    if (manualTemplate) {
      return {
        version: 'v1',
        templateSlug: manualTemplate.slug,
        templateName: manualTemplate.name,
        strategy: 'manual',
        score: 100,
        reasons: ['Template was selected explicitly'],
        alternatives: [],
      };
    }
  }

  const ranked = registry
    .map((template) => ({
      template,
      candidate: scoreTemplate(brief, template),
    }))
    .sort((left, right) => right.candidate.score - left.candidate.score);

  const selected = ranked[0];

  if (!selected) {
    return {
      version: 'v1',
      templateSlug: 'coach-pro',
      templateName: 'Coach Pro',
      strategy: 'fallback',
      score: 0,
      reasons: ['No template candidates found'],
      alternatives: [],
    };
  }

  return {
    version: 'v1',
    templateSlug: selected.template.slug,
    templateName: selected.template.name,
    strategy: selected.candidate.score > 0 ? 'deterministic' : 'fallback',
    score: selected.candidate.score,
    reasons:
      selected.candidate.reasons.length > 0
        ? selected.candidate.reasons
        : ['Using the safest available template fallback'],
    alternatives: ranked.slice(1, 4).map((item) => item.candidate),
  };
}
