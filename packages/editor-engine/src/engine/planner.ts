import { getBlockDefinition } from './block-registry';
import type {
  AssemblyIntegration,
  AssemblyPage,
  AssemblySection,
  AssemblySpec,
  ContentMap,
  ProjectBrief,
  TemplateRegistryEntry,
  TemplateSelection,
} from './contracts';

function createSection(
  pageId: string,
  blockType: string,
  index: number
): AssemblySection {
  const block = getBlockDefinition(blockType);
  return {
    id: `${pageId}-${blockType}-${index}`,
    blockType,
    label: block.label,
    editableFields: block.editableFields,
    contentSlots: block.editableFields.map((field) => `${blockType}.${field}`),
  };
}

function createPage(
  id: string,
  path: string,
  title: string,
  intent: AssemblyPage['intent'],
  blocks: string[]
): AssemblyPage {
  return {
    id,
    path,
    title,
    intent,
    sections: blocks.map((blockType, index) => createSection(id, blockType, index)),
  };
}

function buildIntegrations(
  brief: ProjectBrief,
  template?: TemplateRegistryEntry
): AssemblyIntegration[] {
  const integrations = new Map<AssemblyIntegration['kind'], AssemblyIntegration>();

  for (const kind of brief.constraints.requiredIntegrations) {
    integrations.set(kind, {
      kind,
      required: true,
      providerHint: template?.integrations[kind]?.providers[0],
      source: 'project-brief',
    });
  }

  if (template) {
    for (const [kind, config] of Object.entries(template.integrations)) {
      if (!config) continue;
      const integrationKind = kind as AssemblyIntegration['kind'];
      if (!integrations.has(integrationKind)) {
        integrations.set(integrationKind, {
          kind: integrationKind,
          required: false,
          providerHint: config.providers[0],
          source: 'template',
        });
      }
    }
  }

  return Array.from(integrations.values());
}

export function createAssemblySpec(
  brief: ProjectBrief,
  selection: TemplateSelection,
  registry?: TemplateRegistryEntry[]
): AssemblySpec {
  const template = registry?.find((entry) => entry.slug === selection.templateSlug);
  const landingBlocks = ['hero', 'proof', 'offerings', 'process'];

  if (
    brief.business.goals.includes('sales') ||
    template?.features.some((feature) => feature.toLowerCase().includes('pricing'))
  ) {
    landingBlocks.push('pricing');
  }

  landingBlocks.push('faq');

  if (brief.constraints.requiredIntegrations.includes('newsletter')) {
    landingBlocks.push('newsletter');
  }

  landingBlocks.push('contact');

  const pages: AssemblyPage[] = [
    createPage('home', '/', brief.projectName, 'landing', landingBlocks),
  ];

  if (brief.constraints.pagePreference === 'multi-page') {
    pages.push(createPage('about', '/about', `About ${brief.projectName}`, 'about', ['story', 'proof', 'contact']));
    pages.push(createPage('services', '/services', `${brief.projectName} Services`, 'services', ['offerings', 'process', 'faq', 'contact']));
  }

  if (brief.business.goals.includes('sales')) {
    pages.push(createPage('pricing', '/pricing', `${brief.projectName} Pricing`, 'pricing', ['pricing', 'faq', 'contact']));
  }

  return {
    version: 'v1',
    templateSlug: selection.templateSlug,
    pages,
    integrations: buildIntegrations(brief, template),
  };
}

function valueForSlot(brief: ProjectBrief, slot: string): string {
  switch (slot) {
    case 'hero.headline':
      return brief.projectName;
    case 'hero.subheadline':
      return brief.summary;
    case 'offerings.items':
      return brief.business.offerings.join('\n');
    case 'process.steps':
      return `Discover\nPlan\nBuild\nLaunch`;
    case 'pricing.plans':
      return brief.business.offerings.join('\n') || 'Custom quote';
    case 'contact.contactDetails':
      return [brief.contact.email, brief.contact.phone, brief.contact.address]
        .filter(Boolean)
        .join('\n');
    default:
      return brief.business.valueProposition;
  }
}

export function createContentMap(
  brief: ProjectBrief,
  assemblySpec: AssemblySpec
): ContentMap {
  return {
    version: 'v1',
    entries: assemblySpec.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.contentSlots.map((slot) => ({
          pageId: page.id,
          sectionId: section.id,
          slot,
          value: valueForSlot(brief, slot),
        }))
      )
    ),
  };
}
