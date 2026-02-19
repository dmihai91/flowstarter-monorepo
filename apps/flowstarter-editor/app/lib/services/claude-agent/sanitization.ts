/**
 * Claude Agent Service - Sanitization
 *
 * CSS and Astro content sanitization to remove LLM hallucinations.
 */

/**
 * Sanitize CSS content to remove invalid Tailwind classes and common errors
 *
 * Common LLM hallucinations in CSS:
 * - font-display, font-heading (not valid Tailwind utilities)
 * - bg-dark, text-dark, bg-lime, bg-primary (custom colors not defined)
 * - hover:bg-primary-dark, hover:bg-lime-dark (custom color variants)
 */
export function sanitizeCSS(content: string): string {
  let sanitized = content;

  /*
   * Remove invalid font classes (these are NOT valid Tailwind utilities)
   * font-display and font-heading are common hallucinations
   */
  sanitized = sanitized.replace(/\bfont-display\b/g, 'font-sans');
  sanitized = sanitized.replace(/\bfont-heading\b/g, 'font-serif');

  /*
   * Map of hallucinated colors to standard Tailwind colors
   * These are colors LLMs commonly generate that don't exist in default Tailwind
   */
  const colorReplacements: Array<[RegExp, string]> = [
    // Direct color names without shades
    [/\bbg-dark\b/g, 'bg-gray-900'],
    [/\bbg-light\b/g, 'bg-gray-100'],
    [/\bbg-cream\b/g, 'bg-stone-100'],
    [/\bbg-lime\b/g, 'bg-lime-400'],
    [/\bbg-primary\b/g, 'bg-blue-600'],
    [/\bbg-secondary\b/g, 'bg-gray-600'],
    [/\bbg-accent\b/g, 'bg-amber-500'],
    [/\btext-dark\b/g, 'text-gray-900'],
    [/\btext-light\b/g, 'text-gray-100'],
    [/\btext-cream\b/g, 'text-stone-100'],
    [/\btext-lime\b/g, 'text-lime-400'],
    [/\btext-primary\b/g, 'text-blue-600'],
    [/\btext-secondary\b/g, 'text-gray-600'],
    [/\btext-accent\b/g, 'text-amber-500'],
    [/\bborder-dark\b/g, 'border-gray-900'],
    [/\bborder-light\b/g, 'border-gray-100'],
    [/\bborder-primary\b/g, 'border-blue-600'],

    // Color names with shades (dark-100, dark-200, etc.)
    [/\bbg-dark-50\b/g, 'bg-gray-800'],
    [/\bbg-dark-100\b/g, 'bg-gray-800'],
    [/\bbg-dark-200\b/g, 'bg-gray-700'],
    [/\bbg-dark-300\b/g, 'bg-gray-600'],
    [/\btext-dark-\d+\b/g, 'text-gray-700'],
    [/\bborder-dark-\d+\b/g, 'border-gray-700'],

    // Hover variants with custom colors
    [/\bhover:bg-primary-dark\b/g, 'hover:bg-blue-700'],
    [/\bhover:bg-primary-light\b/g, 'hover:bg-blue-500'],
    [/\bhover:bg-lime-dark\b/g, 'hover:bg-lime-500'],
    [/\bhover:bg-lime-light\b/g, 'hover:bg-lime-300'],
    [/\bhover:bg-dark\b/g, 'hover:bg-gray-800'],
    [/\bhover:bg-light\b/g, 'hover:bg-gray-200'],
    [/\bhover:text-dark\b/g, 'hover:text-gray-900'],
    [/\bhover:text-light\b/g, 'hover:text-gray-100'],
    [/\bhover:text-primary\b/g, 'hover:text-blue-600'],
    [/\bhover:border-primary\b/g, 'hover:border-blue-600'],

    // Focus variants
    [/\bfocus:ring-primary\b/g, 'focus:ring-blue-500'],
    [/\bfocus:border-primary\b/g, 'focus:border-blue-500'],

    // Gradient stops
    [/\bfrom-dark\b/g, 'from-gray-900'],
    [/\bto-dark\b/g, 'to-gray-900'],
    [/\bvia-dark\b/g, 'via-gray-900'],
    [/\bfrom-primary\b/g, 'from-blue-600'],
    [/\bto-primary\b/g, 'to-blue-600'],
    [/\bvia-primary\b/g, 'via-blue-600'],

    // Ring colors
    [/\bring-primary\b/g, 'ring-blue-500'],
    [/\bring-dark\b/g, 'ring-gray-700'],

    // Divide colors
    [/\bdivide-dark\b/g, 'divide-gray-700'],
    [/\bdivide-primary\b/g, 'divide-blue-500'],
  ];

  for (const [pattern, replacement] of colorReplacements) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  /*
   * Catch any remaining -dark or -light color modifiers we might have missed
   * These patterns handle generic cases like "bg-anycolor-dark"
   */
  sanitized = sanitized.replace(/\b(bg|text|border|ring|divide)-([a-z]+)-dark\b/g, '$1-$2-700');
  sanitized = sanitized.replace(/\b(bg|text|border|ring|divide)-([a-z]+)-light\b/g, '$1-$2-300');

  return sanitized;
}

/**
 * Sanitize Astro/HTML content to remove common hallucinations
 */
export function sanitizeAstro(content: string, filePath: string): string {
  let sanitized = content;

  // Remove astro-icon imports and usage
  if (sanitized.includes('astro-icon')) {
    console.log(`[FlowstarterAgent] Sanitizing astro-icon from ${filePath}`);
    sanitized = sanitized
      .replace(/import\s+.*?\s+from\s+['"]astro-icon\/components['"];?\n?/g, '')
      .replace(/<Icon\s+name=["'][^"']*["']\s*\/?\s*>/g, '<!-- Icon placeholder -->')
      .replace(/<Icon\s+[^>]*\/>/g, '<!-- Icon placeholder -->');
  }

  return sanitized;
}

/**
 * Validate generated files for common syntax errors
 */
export function detectSyntaxErrors(filePath: string, content: string): string | null {
  // Basic syntax validation
  if (filePath.endsWith('.astro') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    // Check for common issues

    // Unmatched braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      return `Unmatched braces: ${openBraces} open, ${closeBraces} close`;
    }

    // Unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      return `Unmatched parentheses: ${openParens} open, ${closeParens} close`;
    }

    // Check for common template literal issues
    const backticks = (content.match(/`/g) || []).length;

    if (backticks % 2 !== 0) {
      return `Unmatched template literals (backticks)`;
    }
  }

  return null; // No errors detected
}

/**
 * Sanitize content based on file type
 */
export function sanitizeContent(filePath: string, content: string): string {
  if (filePath.endsWith('.css')) {
    return sanitizeCSS(content);
  }

  return sanitizeAstro(content, filePath);
}

/**
 * Strip markdown code blocks from LLM output
 */
export function stripMarkdownCodeBlocks(content: string): string {
  let cleaned = content.trim();

  if (cleaned.startsWith('```')) {
    const firstLineEnd = cleaned.indexOf('\n');

    if (firstLineEnd !== -1) {
      cleaned = cleaned.slice(firstLineEnd + 1);
    }
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

