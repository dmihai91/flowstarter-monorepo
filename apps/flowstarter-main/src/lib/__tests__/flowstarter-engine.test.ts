import { describe, expect, it } from 'vitest';
import { buildProjectBrief } from '../engine/intake';
import { buildAssemblySpec, buildContentMap } from '../engine/planner';
import { selectTemplate } from '../engine/template-selector';
import { buildValidationReport } from '../engine/validator';
import type { IntakeInput, TemplateRegistryEntry } from '../engine/contracts';

const intake: IntakeInput = {
  description:
    'Therapy practice in Bucharest focused on anxiety and burnout recovery for busy professionals.',
  client: {
    name: 'Ana Ionescu',
    email: 'ana@example.com',
    phone: '+40 712 000 000',
  },
};

const enriched = {
  status: 'complete' as const,
  siteName: 'Calm Space Therapy',
  description:
    'A therapy practice helping busy professionals work through anxiety, stress, and burnout with a calm, practical approach.',
  industry: 'mental-health',
  targetAudience: 'Busy professionals dealing with anxiety and burnout',
  uvp: 'Warm, structured therapy sessions focused on practical progress and emotional safety.',
  goal: 'bookings' as const,
  offerType: 'premium' as const,
  brandTone: 'professional' as const,
  offerings: 'Intro consultation - EUR 60, Therapy session - EUR 110',
  contactEmail: 'hello@calmspace.ro',
  contactPhone: '+40 712 000 000',
  contactAddress: 'Bucharest, Romania',
};

const templates: TemplateRegistryEntry[] = [
  {
    id: 'therapist-care',
    name: 'Therapist Care',
    description: 'Template for therapists',
    category: 'mental-health',
    tags: ['therapist', 'mental-health', 'counselor'],
    features: ['Multi-page', 'Booking integration', 'Contact form', 'Dark mode'],
    integrations: ['calendly', 'mailchimp'],
    capability: {
      supportsBooking: true,
      supportsNewsletter: false,
      supportsContactForm: true,
      multiPage: true,
      darkMode: true,
    },
    registrySource: 'flowstarter-library',
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Template for portfolios',
    category: 'creative',
    tags: ['photographer', 'designer'],
    features: ['Single-page', 'Project inquiry form'],
    integrations: [],
    capability: {
      supportsBooking: false,
      supportsNewsletter: false,
      supportsContactForm: true,
      multiPage: false,
      darkMode: false,
    },
    registrySource: 'flowstarter-library',
  },
];

describe('Flowstarter engine core', () => {
  it('builds a project brief from normalized intake', () => {
    const brief = buildProjectBrief(intake, enriched);

    expect(brief.siteName).toBe('Calm Space Therapy');
    expect(brief.archetype).toBe('service-provider');
    expect(brief.offerings).toHaveLength(2);
    expect(brief.contact.clientName).toBe('Ana Ionescu');
  });

  it('selects a matching template and builds assembly outputs', () => {
    const brief = buildProjectBrief(intake, enriched);
    const selection = selectTemplate(brief, templates);
    const selectedTemplate = templates.find(
      (template) => template.id === selection.selectedTemplateId
    )!;
    const assemblySpec = buildAssemblySpec(brief, selection, selectedTemplate);
    const contentMap = buildContentMap(brief, assemblySpec);
    const validationReport = buildValidationReport({
      projectBrief: brief,
      assemblySpec,
      contentMap,
      template: selectedTemplate,
    });

    expect(selection.selectedTemplateId).toBe('therapist-care');
    expect(assemblySpec.pages.some((page) => page.route === '/contact')).toBe(true);
    expect(contentMap.entries.some((entry) => entry.slotId.includes('headline'))).toBe(true);
    expect(validationReport.valid).toBe(true);
  });
});
