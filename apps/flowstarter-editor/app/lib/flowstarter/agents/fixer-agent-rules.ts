import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FixerAgent.Rules');

/** CSS class replacements for Tier 1 rule-based fixes */
export const CSS_REPLACEMENTS: [RegExp, string][] = [
  [/\bfont-display\b/g, 'font-sans'],
  [/\bfont-heading\b/g, 'font-serif'],
  [/\bbg-dark\b/g, 'bg-gray-900'],
  [/\bbg-light\b/g, 'bg-gray-100'],
  [/\bbg-cream\b/g, 'bg-stone-100'],
  [/\bbg-lime\b/g, 'bg-lime-400'],
  [/\bbg-primary\b/g, 'bg-blue-600'],
  [/\bbg-secondary\b/g, 'bg-gray-600'],
  [/\bbg-accent\b/g, 'bg-amber-500'],
  [/\bbg-dark-\d+\b/g, 'bg-gray-800'],
  [/\btext-dark\b/g, 'text-gray-900'],
  [/\btext-light\b/g, 'text-gray-100'],
  [/\btext-cream\b/g, 'text-stone-100'],
  [/\btext-primary\b/g, 'text-blue-600'],
  [/\btext-secondary\b/g, 'text-gray-600'],
  [/\bborder-dark\b/g, 'border-gray-900'],
  [/\bborder-light\b/g, 'border-gray-100'],
  [/\bborder-primary\b/g, 'border-blue-600'],
  [/\bhover:bg-primary-dark\b/g, 'hover:bg-blue-700'],
  [/\bhover:bg-dark\b/g, 'hover:bg-gray-800'],
  [/\bhover:text-primary\b/g, 'hover:text-blue-600'],
  [/\bfocus:ring-primary\b/g, 'focus:ring-blue-500'],
  [/\bfocus:border-primary\b/g, 'focus:border-blue-500'],
  [/\b(bg|text|border|ring)-([a-z]+)-dark\b/g, '$1-$2-700'],
  [/\b(bg|text|border|ring)-([a-z]+)-light\b/g, '$1-$2-300'],
];

/** TypeScript implicit 'any' fix patterns for .map() callbacks */
const TS_MAP_FIXES: [RegExp, string][] = [
  [/\.map\(\(slot\)\s*=>/g, '.map((slot: { day: string; times: string[] }) =>'],
  [/\.map\(\(time,\s*i\)\s*=>/g, '.map((time: string, i: number) =>'],
  [/\.map\(\(time\)\s*=>/g, '.map((time: string) =>'],
  [/\.map\(\(item\)\s*=>/g, '.map((item: any) =>'],
  [/\.map\(\(feature\)\s*=>/g, '.map((feature: { title?: string; description?: string; icon?: string; name?: string }) =>'],
  [/\.map\(\(benefit\)\s*=>/g, '.map((benefit: string | { title?: string; text?: string }) =>'],
  [/\.map\(\(stat\)\s*=>/g, '.map((stat: { value: string; label: string }) =>'],
  [/\.map\(\(plan\)\s*=>/g, '.map((plan: any) =>'],
  [/\.map\(\(service\)\s*=>/g, '.map((service: any) =>'],
  [/\.map\(\(link\)\s*=>/g, '.map((link: { href: string; label: string; text?: string }) =>'],
  [/\.map\(\(hour\)\s*=>/g, '.map((hour: { day: string; hours: string }) =>'],
  [/\.map\(\(image\)\s*=>/g, '.map((image: string) =>'],
  [/\.map\(\(image,\s*index\)\s*=>/g, '.map((image: string, index: number) =>'],
  [/\.map\(\(testimonial\)\s*=>/g, '.map((testimonial: { name: string; text: string; rating?: number; role?: string }) =>'],
  [/\.map\(\(review\)\s*=>/g, '.map((review: { name: string; text: string; rating?: number }) =>'],
];

/** Apply rule-based fixes for CSS classes, Astro imports, and TypeScript implicit any. */
export function applyRuleBasedFixes(content: string, file: string, error: string): string | null {
  if (!file.match(/\.(css|scss|astro|tsx?|jsx?)$/)) return null;
  let fixed = content;
  let hasChanges = false;

  for (const [pattern, replacement] of CSS_REPLACEMENTS) {
    const before = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== before) hasChanges = true;
  }

  if (file.endsWith('.astro') && error.includes('Icon')) {
    const before = fixed;
    fixed = fixed.replace(/import\s*{\s*Icon\s*}\s*from\s*['"]astro-icon\/components['"];?\n?/g, '');
    fixed = fixed.replace(/<Icon[^>]*\/>/g, '<!-- Icon removed -->');
    fixed = fixed.replace(/<Icon[^>]*>.*?<\/Icon>/gs, '<!-- Icon removed -->');
    if (fixed !== before) hasChanges = true;
  }

  if ((file.endsWith('.astro') || file.endsWith('.tsx')) && error.includes("implicitly has an 'any' type")) {
    const before = fixed;
    for (const [pattern, replacement] of TS_MAP_FIXES) {
      fixed = fixed.replace(pattern, replacement);
    }
    if (fixed !== before) {
      hasChanges = true;
      logger.info('Applied TypeScript implicit any fixes');
    }
  }

  return hasChanges ? fixed : null;
}

/** Validate that a fix produces syntactically reasonable output. */
export function validateFix(content: string, filePath: string): boolean {
  const opens = (content.match(/[{[(]/g) || []).length;
  const closes = (content.match(/[}\])]/g) || []).length;
  if (Math.abs(opens - closes) > 2) {
    logger.warn(`Fix has unbalanced brackets: ${opens} opens, ${closes} closes`);
    return false;
  }
  if (filePath.endsWith('.astro')) {
    const markers = (content.match(/^---$/gm) || []).length;
    if (markers !== 0 && markers !== 2) {
      logger.warn(`Fix has invalid Astro frontmatter: ${markers} markers`);
      return false;
    }
  }
  if (content.trim().length < 10) {
    logger.warn('Fix resulted in near-empty file');
    return false;
  }
  return true;
}

/** Detect framework from file extension. */
export function detectFramework(file: string): string | undefined {
  if (file.endsWith('.astro')) return 'astro';
  if (file.endsWith('.tsx') || file.endsWith('.jsx')) return 'react';
  if (file.endsWith('.vue')) return 'vue';
  if (file.endsWith('.svelte')) return 'svelte';
  return undefined;
}
