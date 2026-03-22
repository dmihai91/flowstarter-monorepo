import type { BlockDefinition } from './contracts';

export const DEFAULT_BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    editableFields: ['headline', 'subheadline', 'primaryCta', 'secondaryCta'],
    allowedPageIntents: ['landing'],
  },
  proof: {
    type: 'proof',
    label: 'Proof',
    editableFields: ['eyebrow', 'items'],
    allowedPageIntents: ['landing', 'about', 'services'],
  },
  offerings: {
    type: 'offerings',
    label: 'Offerings',
    editableFields: ['headline', 'items'],
    allowedPageIntents: ['landing', 'services'],
  },
  process: {
    type: 'process',
    label: 'Process',
    editableFields: ['headline', 'steps'],
    allowedPageIntents: ['landing', 'services', 'about'],
  },
  pricing: {
    type: 'pricing',
    label: 'Pricing',
    editableFields: ['headline', 'plans'],
    allowedPageIntents: ['landing', 'pricing'],
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    editableFields: ['headline', 'items'],
    allowedPageIntents: ['landing', 'services', 'pricing'],
  },
  newsletter: {
    type: 'newsletter',
    label: 'Newsletter',
    editableFields: ['headline', 'supportingCopy', 'ctaLabel'],
    allowedPageIntents: ['landing'],
  },
  contact: {
    type: 'contact',
    label: 'Contact',
    editableFields: ['headline', 'supportingCopy', 'contactDetails'],
    allowedPageIntents: ['landing', 'contact'],
  },
  story: {
    type: 'story',
    label: 'Story',
    editableFields: ['headline', 'body'],
    allowedPageIntents: ['about'],
  },
};

export function getBlockDefinition(blockType: string): BlockDefinition {
  return (
    DEFAULT_BLOCK_REGISTRY[blockType] ?? {
      type: blockType,
      label: blockType,
      editableFields: ['headline', 'body'],
      allowedPageIntents: ['landing'],
    }
  );
}
