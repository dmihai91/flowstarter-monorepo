import type { BlockDefinitionSchema, ProjectBrief } from './contracts';
import { z } from 'zod';

type BlockDefinition = z.infer<typeof BlockDefinitionSchema>;

const BLOCKS: Record<string, BlockDefinition> = {
  hero: {
    blockId: 'hero.v1',
    kind: 'hero',
    editableFields: ['headline', 'subheadline', 'primaryCta', 'secondaryCta'],
    constraints: ['exactly-one-per-homepage', 'must-include-primary-cta'],
  },
  proof: {
    blockId: 'proof.v1',
    kind: 'proof',
    editableFields: ['title', 'items'],
    constraints: ['max-6-items'],
  },
  services: {
    blockId: 'services.v1',
    kind: 'services',
    editableFields: ['title', 'items'],
    constraints: ['min-2-items', 'max-6-items'],
  },
  process: {
    blockId: 'process.v1',
    kind: 'process',
    editableFields: ['title', 'steps'],
    constraints: ['min-3-steps', 'max-5-steps'],
  },
  faq: {
    blockId: 'faq.v1',
    kind: 'faq',
    editableFields: ['title', 'items'],
    constraints: ['max-8-items'],
  },
  cta: {
    blockId: 'cta.v1',
    kind: 'cta',
    editableFields: ['headline', 'body', 'ctaLabel'],
    constraints: ['must-include-primary-cta'],
  },
  contact: {
    blockId: 'contact.v1',
    kind: 'contact',
    editableFields: ['headline', 'email', 'phone', 'address'],
    constraints: ['must-expose-at-least-one-contact-method'],
  },
  booking: {
    blockId: 'booking.v1',
    kind: 'booking',
    editableFields: ['headline', 'provider', 'url'],
    constraints: ['requires-booking-integration'],
  },
  newsletter: {
    blockId: 'newsletter.v1',
    kind: 'newsletter',
    editableFields: ['headline', 'body', 'provider'],
    constraints: ['requires-newsletter-integration'],
  },
  portfolio: {
    blockId: 'portfolio.v1',
    kind: 'portfolio',
    editableFields: ['title', 'projects'],
    constraints: ['min-3-projects'],
  },
  pricing: {
    blockId: 'pricing.v1',
    kind: 'pricing',
    editableFields: ['title', 'plans'],
    constraints: ['min-1-plan', 'max-4-plans'],
  },
  about: {
    blockId: 'about.v1',
    kind: 'about',
    editableFields: ['headline', 'body'],
    constraints: ['single-rich-text-body'],
  },
};

const ARCHETYPE_BLOCKS: Record<string, string[]> = {
  'authority-builder': ['hero', 'proof', 'services', 'process', 'faq', 'cta', 'contact'],
  'service-provider': ['hero', 'about', 'services', 'proof', 'booking', 'faq', 'contact'],
  'portfolio-showcase': ['hero', 'portfolio', 'process', 'proof', 'cta', 'contact'],
  'course-creator': ['hero', 'pricing', 'proof', 'faq', 'cta', 'newsletter', 'contact'],
  'local-expert': ['hero', 'services', 'proof', 'booking', 'faq', 'contact'],
  'event-host': ['hero', 'proof', 'pricing', 'cta', 'newsletter', 'contact'],
};

export function getBlocksForBrief(projectBrief: ProjectBrief): BlockDefinition[] {
  const keys =
    ARCHETYPE_BLOCKS[projectBrief.archetype] ??
    ARCHETYPE_BLOCKS['authority-builder'];

  return keys.map((key) => BLOCKS[key]);
}
