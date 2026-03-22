import {
  createAssemblySpec,
  createContentMap,
  normalizeProjectBrief,
  selectTemplate,
  validateFlowstarterArtifacts,
  type TemplateRegistryEntry,
} from '@flowstarter/editor-engine';
import { describe, expect, it } from 'vitest';

const registry: TemplateRegistryEntry[] = [
  {
    slug: 'fitness-coach',
    name: 'Fitness Coach',
    description: 'Fitness landing template',
    category: 'fitness',
    framework: 'astro',
    features: ['Multi-page', 'Booking integration', 'Pricing'],
    tags: ['fitness', 'trainer', 'strength'],
    integrations: {
      booking: { optional: true, providers: ['calendly'] },
      newsletter: { optional: true, providers: ['mailchimp'] },
    },
  },
  {
    slug: 'coach-pro',
    name: 'Coach Pro',
    description: 'Coaching template',
    category: 'coaching',
    framework: 'astro',
    features: ['Multi-page', 'Booking integration'],
    tags: ['coach'],
    integrations: {
      booking: { optional: true, providers: ['calendly'] },
    },
  },
];

describe('flowstarter engine contracts', () => {
  it('normalizes concierge intake into a stable project brief', () => {
    const brief = normalizeProjectBrief({
      source: 'concierge',
      projectName: 'Peak Strength',
      summary: 'Personal training for busy professionals.',
      industry: 'fitness',
      targetAudience: 'Busy professionals',
      valueProposition: 'Evidence-based coaching with flexible scheduling.',
      brandTone: 'bold',
      goals: 'bookings',
      offerings: '1:1 coaching, small group training',
      contact: { email: 'coach@example.com' },
    });

    expect(brief.projectName).toBe('Peak Strength');
    expect(brief.business.goals).toContain('bookings');
    expect(brief.constraints.requiredIntegrations).toContain('booking');
    expect(brief.business.offerings).toEqual([
      '1:1 coaching',
      'small group training',
    ]);
  });

  it('selects a deterministic template and creates a planned assembly spec', () => {
    const brief = normalizeProjectBrief({
      source: 'concierge',
      projectName: 'Peak Strength',
      summary: 'Personal training for busy professionals.',
      industry: 'fitness',
      goals: 'bookings',
      offerings: '1:1 coaching, small group training',
    });
    const selection = selectTemplate(brief, registry);
    const assemblySpec = createAssemblySpec(brief, selection, registry);
    const contentMap = createContentMap(brief, assemblySpec);
    const validationReport = validateFlowstarterArtifacts({
      projectBrief: brief,
      templateSelection: selection,
      assemblySpec,
      contentMap,
      registry,
    });

    expect(selection.templateSlug).toBe('fitness-coach');
    expect(assemblySpec.pages[0]?.path).toBe('/');
    expect(
      assemblySpec.integrations.some((integration) => integration.kind === 'booking')
    ).toBe(true);
    expect(contentMap.entries.length).toBeGreaterThan(0);
    expect(validationReport.status).toBe('pass');
  });
});
