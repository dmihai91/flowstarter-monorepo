/**
 * Services.md Generator
 */

import type { ContentContext, GeneratedAsset } from '../types';

/** Domain-specific icons */
const DOMAIN_ICONS: Record<string, string[]> = {
  therapist: ['lucide:heart', 'lucide:brain', 'lucide:users', 'lucide:message-circle', 'lucide:shield', 'lucide:sun'],
  fitness: ['lucide:dumbbell', 'lucide:flame', 'lucide:target', 'lucide:trophy', 'lucide:zap', 'lucide:activity'],
  yoga: ['lucide:flower', 'lucide:moon', 'lucide:sun', 'lucide:wind', 'lucide:heart', 'lucide:sparkles'],
  coaching: ['lucide:compass', 'lucide:rocket', 'lucide:target', 'lucide:lightbulb', 'lucide:trending-up', 'lucide:star'],
  creative: ['lucide:camera', 'lucide:palette', 'lucide:film', 'lucide:pen-tool', 'lucide:image', 'lucide:monitor'],
  beauty: ['lucide:scissors', 'lucide:sparkles', 'lucide:droplet', 'lucide:heart', 'lucide:star', 'lucide:smile'],
  food: ['lucide:chef-hat', 'lucide:utensils', 'lucide:coffee', 'lucide:wine', 'lucide:cake', 'lucide:leaf'],
  professional: ['lucide:briefcase', 'lucide:scale', 'lucide:file-text', 'lucide:shield', 'lucide:award', 'lucide:users'],
  realestate: ['lucide:home', 'lucide:key', 'lucide:map-pin', 'lucide:trending-up', 'lucide:building', 'lucide:search'],
  tech: ['lucide:code', 'lucide:cloud', 'lucide:database', 'lucide:lock', 'lucide:zap', 'lucide:settings'],
};

const DEFAULT_ICONS = ['lucide:star', 'lucide:zap', 'lucide:shield', 'lucide:heart', 'lucide:rocket', 'lucide:users'];

/** Domain-specific section titles */
const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  therapist: { title: 'How I Can Help', subtitle: 'Areas of focus and support.' },
  fitness: { title: 'Training Programs', subtitle: 'Choose the program that fits your goals.' },
  yoga: { title: 'Classes & Offerings', subtitle: 'Find the practice that speaks to you.' },
  coaching: { title: 'Coaching Services', subtitle: 'Pathways to your breakthrough.' },
  creative: { title: 'Services', subtitle: 'What I create for my clients.' },
  beauty: { title: 'Our Services', subtitle: 'Treatments designed to make you shine.' },
  food: { title: 'Our Menu', subtitle: 'Fresh, delicious, made with love.' },
  professional: { title: 'Practice Areas', subtitle: 'Expert guidance when you need it.' },
  realestate: { title: 'Services', subtitle: 'Full-service real estate support.' },
  tech: { title: 'Features', subtitle: 'Everything you need to succeed.' },
};

const DEFAULT_TITLES = { title: 'Our Services', subtitle: 'What we offer to help you succeed.' };

export function generateServicesMd(
  businessInfo: any,
  assets?: GeneratedAsset[],
  ctx?: ContentContext
): string {
  const services = businessInfo.services || ['Service 1', 'Service 2', 'Service 3'];
  
  const icons = DOMAIN_ICONS[ctx?.domain.id || ''] || DEFAULT_ICONS;
  const titles = SECTION_TITLES[ctx?.domain.id || ''] || DEFAULT_TITLES;
  
  // Get feature images for services
  const featureAssets = assets?.filter(a => a.type === 'feature' || a.type === 'product') || [];
  
  const servicesYaml = services.slice(0, 6).map((service: string, i: number) => {
    const featureImage = featureAssets[i % Math.max(featureAssets.length, 1)];
    const imageField = featureImage ? `\n    image: "${featureImage.url}"` : '';
    return `  - icon: "${icons[i % icons.length]}"
    title: "${service}"
    description: "Professional ${service.toLowerCase()} tailored to your specific needs."
    price: null${imageField}`;
  }).join('\n');

  return `---
title: "${titles.title}"
subtitle: "${titles.subtitle}"
services:
${servicesYaml}
---
`;
}
