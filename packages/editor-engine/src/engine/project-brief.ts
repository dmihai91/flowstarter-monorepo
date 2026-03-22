import type {
  BrandTone,
  IntegrationKind,
  NormalizeProjectBriefInput,
  OfferType,
  ProjectBrief,
  ProjectGoal,
} from './contracts';

const GOAL_ALIASES: Array<[ProjectGoal, string[]]> = [
  ['bookings', ['booking', 'appointments', 'consultation', 'schedule']],
  ['sales', ['sales', 'sell', 'shop', 'checkout', 'ecommerce']],
  ['newsletter', ['newsletter', 'email list', 'subscribers']],
  ['awareness', ['awareness', 'visibility', 'brand']],
  ['leads', ['lead', 'contact', 'inquiry', 'quote']],
];

function normalizeList(value?: string | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeGoals(value?: string | string[]): ProjectGoal[] {
  const items = normalizeList(value);

  if (items.length === 0) {
    return ['leads'];
  }

  const matched = new Set<ProjectGoal>();
  const lowerItems = items.map((item) => item.toLowerCase());

  for (const item of lowerItems) {
    for (const [goal, aliases] of GOAL_ALIASES) {
      if (aliases.some((alias) => item.includes(alias))) {
        matched.add(goal);
      }
    }
  }

  if (matched.size === 0) {
    matched.add('leads');
  }

  return Array.from(matched);
}

function normalizeBrandTone(value?: string): BrandTone {
  const tone = value?.toLowerCase() ?? '';
  if (tone.includes('friendly') || tone.includes('warm')) return 'friendly';
  if (tone.includes('calm') || tone.includes('gentle')) return 'calm';
  if (tone.includes('bold') || tone.includes('energetic')) return 'bold';
  if (tone.includes('modern')) return 'modern';
  return 'professional';
}

function normalizeOfferType(value?: string): OfferType {
  const offerType = value?.toLowerCase() ?? '';
  if (offerType.includes('premium') || offerType.includes('luxury')) return 'premium';
  if (offerType.includes('free')) return 'free';
  if (offerType.includes('accessible') || offerType.includes('affordable')) {
    return 'accessible';
  }

  return 'custom';
}

function inferPagePreference(goals: ProjectGoal[], offerings: string[]): 'single-page' | 'multi-page' {
  if (goals.includes('sales')) return 'multi-page';
  if (offerings.length >= 3) return 'multi-page';
  return 'single-page';
}

function inferRequiredIntegrations(goals: ProjectGoal[]): IntegrationKind[] {
  return goals.flatMap((goal) => {
    switch (goal) {
      case 'bookings':
        return ['booking'] as const;
      case 'newsletter':
        return ['newsletter'] as const;
      case 'sales':
      case 'leads':
        return ['leadCapture'] as const;
      default:
        return [] as const;
    }
  });
}

export function normalizeProjectBrief(
  input: NormalizeProjectBriefInput
): ProjectBrief {
  const goals = normalizeGoals(input.goals);
  const offerings = normalizeList(input.offerings);
  const projectName = input.projectName?.trim() || 'Untitled Project';
  const summary =
    input.summary?.trim() ||
    'Business website assembled from a structured project brief.';

  const requiredIntegrations = inferRequiredIntegrations(goals);

  return {
    version: 'v1',
    source: input.source ?? 'imported',
    projectId: input.projectId,
    projectName,
    summary,
    business: {
      industry: input.industry?.trim() || 'other',
      targetAudience: input.targetAudience?.trim() || 'General customers',
      valueProposition:
        input.valueProposition?.trim() || 'Clear, trustworthy value for the target customer.',
      brandTone: normalizeBrandTone(input.brandTone),
      offerType: normalizeOfferType(input.offerType),
      offerings,
      goals,
    },
    contact: input.contact ?? {},
    client: input.client,
    constraints: {
      preferredTemplateSlug: input.preferredTemplateSlug,
      platformType: input.platformType,
      pagePreference: inferPagePreference(goals, offerings),
      requiredIntegrations: Array.from(new Set(requiredIntegrations)),
    },
    sourceData: input.raw ?? {},
  };
}
