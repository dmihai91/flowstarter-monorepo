import type {
  ProjectBrief,
  TemplateRegistryEntry,
  TemplateSelection,
} from './contracts';

const ARCHETYPE_CATEGORY_HINTS: Record<string, string[]> = {
  'authority-builder': ['coaching', 'consulting', 'education'],
  'service-provider': ['mental-health', 'wellness', 'health-wellness'],
  'portfolio-showcase': ['creative'],
  'course-creator': ['education', 'course'],
  'local-expert': ['beauty', 'fitness', 'local'],
  'event-host': ['workshop', 'events'],
};

function scoreTemplate(
  projectBrief: ProjectBrief,
  template: TemplateRegistryEntry
) {
  let score = 0;
  const reasons: string[] = [];
  const categoryHints = ARCHETYPE_CATEGORY_HINTS[projectBrief.archetype] ?? [];

  if (
    categoryHints.some((hint) =>
      template.category.toLowerCase().includes(hint)
    )
  ) {
    score += 40;
    reasons.push('Template category matches the project archetype');
  }

  if (
    template.tags.some((tag) =>
      `${projectBrief.industry} ${projectBrief.targetAudience}`.toLowerCase().includes(tag.toLowerCase())
    )
  ) {
    score += 20;
    reasons.push('Template tags overlap with the business profile');
  }

  if (projectBrief.goal === 'bookings' && template.capability.supportsBooking) {
    score += 20;
    reasons.push('Template supports a booking-led conversion path');
  }

  if (projectBrief.goal === 'sales') {
    score += template.features.some((feature) =>
      feature.toLowerCase().includes('package')
    )
      ? 15
      : 0;
    if (score >= 15) reasons.push('Template can present packaged offers clearly');
  }

  if (projectBrief.brandTone === 'bold' && template.capability.darkMode) {
    score += 5;
    reasons.push('Template supports a stronger visual treatment');
  }

  if (template.capability.supportsContactForm) {
    score += 10;
    reasons.push('Template includes a lead capture surface');
  }

  return { score, reasons };
}

export function selectTemplate(
  projectBrief: ProjectBrief,
  templates: TemplateRegistryEntry[]
): TemplateSelection {
  const ranked = templates
    .map((template) => {
      const { score, reasons } = scoreTemplate(projectBrief, template);
      return {
        template,
        score,
        reasons,
      };
    })
    .sort((left, right) => right.score - left.score);

  const selected = ranked[0] ?? {
    template: templates[0],
    score: 0,
    reasons: ['No strong match found, using the first available template'],
  };

  const fallbackUsed = selected.score < 30;

  return {
    version: '1.0',
    source: 'template-selection',
    selectedTemplateId: selected.template.id,
    selectedTemplateName: selected.template.name,
    score: selected.score,
    fallbackUsed,
    reasons: fallbackUsed
      ? [...selected.reasons, 'Fallback applied because confidence was low']
      : selected.reasons,
    alternatives: ranked.slice(0, 3).map((entry) => ({
      templateId: entry.template.id,
      score: entry.score,
      reasons: entry.reasons,
    })),
  };
}
