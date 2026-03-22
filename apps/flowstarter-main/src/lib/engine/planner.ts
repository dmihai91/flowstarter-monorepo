import {
  type AssemblySpec,
  type ContentMap,
  type ProjectBrief,
  type TemplateRegistryEntry,
  type TemplateSelection,
} from './contracts';
import { getBlocksForBrief } from './block-registry';

function buildIntegrations(template: TemplateRegistryEntry, brief: ProjectBrief) {
  const bookingEnabled = brief.goal === 'bookings' && template.capability.supportsBooking;
  const newsletterEnabled = template.capability.supportsNewsletter;

  return [
    {
      key: 'booking',
      mode: bookingEnabled ? ('optional' as const) : ('disabled' as const),
      providerOptions: bookingEnabled
        ? template.integrations.filter((integration) =>
            ['calendly', 'calcom'].includes(integration)
          )
        : [],
      configFields: bookingEnabled ? ['booking_url'] : [],
    },
    {
      key: 'newsletter',
      mode: newsletterEnabled ? ('optional' as const) : ('disabled' as const),
      providerOptions: newsletterEnabled
        ? template.integrations.filter((integration) =>
            ['mailchimp', 'convertkit', 'buttondown'].includes(integration)
          )
        : [],
      configFields: newsletterEnabled ? ['newsletter_provider', 'newsletter_url'] : [],
    },
  ];
}

export function buildAssemblySpec(
  projectBrief: ProjectBrief,
  templateSelection: TemplateSelection,
  template: TemplateRegistryEntry
): AssemblySpec {
  const homeBlocks = getBlocksForBrief(projectBrief);
  const pages = [
    {
      route: '/',
      purpose: 'Primary conversion page',
      blocks: homeBlocks,
    },
  ];

  if (template.capability.multiPage) {
    pages.push({
      route: '/about',
      purpose: 'Trust and story page',
      blocks: homeBlocks.filter((block) =>
        ['about', 'proof', 'cta'].includes(block.kind)
      ),
    });
    pages.push({
      route: '/contact',
      purpose: 'Direct inquiry page',
      blocks: homeBlocks.filter((block) =>
        ['contact', 'booking', 'cta'].includes(block.kind)
      ),
    });
  }

  return {
    version: '1.0',
    source: 'assembly-spec',
    templateId: templateSelection.selectedTemplateId,
    projectArchetype: projectBrief.archetype,
    pages,
    integrations: buildIntegrations(template, projectBrief),
    builderInstructions: [
      'Builder must preserve the selected template structure and only fill approved content slots.',
      'Planning decides pages, routes, blocks, and integration surfaces. Builder executes that plan.',
      'Client-facing customization must remain limited to editable block fields and approved integrations.',
    ],
  };
}

export function buildContentMap(
  projectBrief: ProjectBrief,
  assemblySpec: AssemblySpec
): ContentMap {
  const entries = assemblySpec.pages.flatMap((page) =>
    page.blocks.flatMap((block) =>
      block.editableFields.map((field) => ({
        slotId: `${page.route}:${block.blockId}:${field}`,
        value: deriveFieldValue(field, projectBrief),
        editable: true,
      }))
    )
  );

  return {
    version: '1.0',
    source: 'content-map',
    entries,
  };
}

function deriveFieldValue(field: string, projectBrief: ProjectBrief): string {
  switch (field) {
    case 'headline':
      return `${projectBrief.siteName} for ${projectBrief.targetAudience}`;
    case 'subheadline':
    case 'body':
      return projectBrief.summary;
    case 'primaryCta':
    case 'ctaLabel':
      return projectBrief.goal === 'bookings' ? 'Book a consultation' : 'Start a conversation';
    case 'secondaryCta':
      return 'See how it works';
    case 'email':
      return projectBrief.contact.email ?? '';
    case 'phone':
      return projectBrief.contact.phone ?? '';
    case 'address':
      return projectBrief.contact.address ?? '';
    case 'title':
      return projectBrief.siteName;
    case 'items':
    case 'plans':
    case 'projects':
    case 'steps':
      return projectBrief.offerings.join(' | ');
    case 'provider':
      return projectBrief.goal === 'bookings' ? 'booking' : 'newsletter';
    case 'url':
      return '';
    default:
      return projectBrief.usp;
  }
}
