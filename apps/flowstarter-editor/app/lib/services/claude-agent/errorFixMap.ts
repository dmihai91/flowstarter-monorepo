/**
 * Deterministic Error Fix Map
 *
 * Maps known error patterns to instant fixes without calling the LLM.
 * These are the top recurring errors observed in production.
 *
 * Each rule has:
 * - match: function that checks if the error matches this pattern
 * - fix: function that applies the fix to the file content
 * - summary: human-readable description of what was fixed
 * - global: if true, the fix should be applied across ALL files (not just the erroring one)
 */

interface ErrorFixRule {
  id: string;
  match: (error: string, fullOutput?: string) => boolean;
  fix: (content: string, filePath: string, error: string, allFiles?: Record<string, string>) => string;
  summary: (error: string) => string;
  global?: boolean; // Apply to all files, not just the one that errored
}

/**
 * The master list of deterministic fix rules.
 * Order matters — first match wins.
 */
export const ERROR_FIX_RULES: ErrorFixRule[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. MISSING PACKAGE IMPORTS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'astro-icon',
    match: (error) =>
      error.includes('astro-icon') ||
      (error.includes('Cannot find module') && error.includes('astro-icon')) ||
      (error.includes('Could not resolve') && error.includes('astro-icon')),
    fix: (content) =>
      content
        // Remove all astro-icon imports
        .replace(/import\s+.*?\s+from\s+['"]astro-icon[^'"]*['"];?\n?/g, '')
        // Replace <Icon name="..." /> with a placeholder span
        .replace(/<Icon\s+name=["']([^"']*)["']\s*(?:class=["'][^"']*["'])?\s*\/?\s*>/g,
          '<span aria-hidden="true">●</span>')
        // Replace <Icon ...>...</Icon> with placeholder
        .replace(/<Icon\s+[^>]*>[\s\S]*?<\/Icon>/g, '<span aria-hidden="true">●</span>')
        // Self-closing with any attributes
        .replace(/<Icon\s+[^>]*\/>/g, '<span aria-hidden="true">●</span>'),
    summary: () => 'Removed astro-icon (not installed) — replaced with placeholder',
    global: true,
  },

  {
    id: 'missing-npm-package',
    match: (error) =>
      (error.includes('Cannot find module') || error.includes('Could not resolve') || error.includes('Failed to resolve import')) &&
      !error.includes('astro-icon'), // handled above
    fix: (content, _filePath, error) => {
      const moduleMatch = error.match(/['"]([^'"]+)['"]/);
      if (!moduleMatch) return content;
      const badModule = moduleMatch[1];

      // Don't remove local imports
      if (badModule.startsWith('.') || badModule.startsWith('/')) return content;

      const escaped = badModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return content
        .replace(new RegExp(`import\\s+[^;]*\\s+from\\s+['"]${escaped}['"];?\\n?`, 'g'), '')
        .replace(new RegExp(`import\\s+['"]${escaped}['"];?\\n?`, 'g'), '');
    },
    summary: (error) => {
      const moduleMatch = error.match(/['"]([^'"]+)['"]/);
      return `Removed missing package import "${moduleMatch?.[1] || 'unknown'}"`;
    },
    global: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. LOCAL IMPORT PATH ISSUES
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'missing-astro-extension',
    match: (error) =>
      (error.includes('Cannot find module') || error.includes('Could not resolve')) &&
      error.match(/['"]\.\/[^'"]*['"]/) !== null &&
      !error.includes('.astro') && !error.includes('.ts') && !error.includes('.js'),
    fix: (content, _filePath, error) => {
      const moduleMatch = error.match(/['"](\.[^'"]+)['"]/);
      if (!moduleMatch) return content;
      const badImport = moduleMatch[1];
      const escaped = badImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return content.replace(
        new RegExp(`from\\s+['"]${escaped}['"]`, 'g'),
        `from '${badImport}.astro'`
      );
    },
    summary: (error) => {
      const moduleMatch = error.match(/['"](\.[^'"]+)['"]/);
      return `Added .astro extension to local import "${moduleMatch?.[1] || ''}"`;
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. SYNTAX ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'missing-semicolons',
    match: (error) =>
      error.includes('Unexpected token') ||
      error.includes('Expected ";"') ||
      (error.includes('SyntaxError') && error.includes('import')),
    fix: (content, filePath) => {
      if (!filePath.endsWith('.astro')) return content;

      const lines = content.split('\n');
      let inFrontmatter = false;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === '---') {
          inFrontmatter = !inFrontmatter;
          continue;
        }
        if (inFrontmatter && trimmed.startsWith('import ') &&
            trimmed.match(/from\s+['"][^'"]+['"]$/) && !trimmed.endsWith(';')) {
          lines[i] = lines[i] + ';';
        }
      }
      return lines.join('\n');
    },
    summary: () => 'Added missing semicolons to import statements',
  },

  {
    id: 'unmatched-braces',
    match: (error) =>
      (error.includes('Unexpected') && (error.includes('}') || error.includes('{'))) ||
      error.includes('Unterminated') ||
      error.includes('Expected closing'),
    fix: (content, filePath) => {
      if (!filePath.endsWith('.astro')) return content;

      // Try to fix frontmatter brace imbalance
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const frontmatter = fmMatch[1];
        const opens = (frontmatter.match(/\{/g) || []).length;
        const closes = (frontmatter.match(/\}/g) || []).length;

        if (opens > closes) {
          return content.replace(
            /^---\n([\s\S]*?)\n---/,
            `---\n${frontmatter}${'\n}'.repeat(opens - closes)}\n---`
          );
        } else if (closes > opens) {
          // Remove extra closing braces from end of frontmatter
          let fixed = frontmatter;
          let excess = closes - opens;
          while (excess > 0 && fixed.endsWith('}')) {
            fixed = fixed.slice(0, -1).trimEnd();
            excess--;
          }
          return content.replace(
            /^---\n([\s\S]*?)\n---/,
            `---\n${fixed}\n---`
          );
        }
      }
      return content;
    },
    summary: () => 'Fixed unmatched braces in frontmatter',
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. TAILWIND / CSS ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'invalid-tailwind-classes',
    match: (error) =>
      error.includes('class does not exist') ||
      error.includes('The `') && error.includes('` class does not exist'),
    fix: (content) => {
      const replacements: [RegExp, string][] = [
        // Font utilities
        [/\bfont-display\b/g, 'font-sans'],
        [/\bfont-heading\b/g, 'font-serif'],

        // Custom color names → standard Tailwind
        [/\b(bg|text|border|ring|divide)-primary(?:-dark)?\b/g, '$1-blue-700'],
        [/\b(bg|text|border|ring|divide)-primary(?:-light)?\b/g, '$1-blue-400'],
        [/\b(bg|text|border|ring|divide)-primary\b/g, '$1-blue-600'],
        [/\b(bg|text|border|ring|divide)-secondary\b/g, '$1-gray-600'],
        [/\b(bg|text|border|ring|divide)-accent\b/g, '$1-amber-500'],
        [/\b(bg|text|border|ring|divide)-dark\b/g, '$1-gray-900'],
        [/\b(bg|text|border|ring|divide)-light\b/g, '$1-gray-100'],
        [/\b(bg|text|border|ring|divide)-cream\b/g, '$1-stone-100'],

        // Hover/focus variants with custom colors
        [/\bhover:(bg|text|border)-primary\b/g, 'hover:$1-blue-700'],
        [/\bhover:(bg|text|border)-dark\b/g, 'hover:$1-gray-800'],
        [/\bhover:(bg|text|border)-light\b/g, 'hover:$1-gray-200'],
        [/\bfocus:ring-primary\b/g, 'focus:ring-blue-500'],

        // Gradient stops
        [/\b(from|to|via)-primary\b/g, '$1-blue-600'],
        [/\b(from|to|via)-dark\b/g, '$1-gray-900'],

        // Generic -dark/-light suffix catch-all
        [/\b(bg|text|border|ring|divide)-([a-z]+)-dark\b/g, '$1-$2-700'],
        [/\b(bg|text|border|ring|divide)-([a-z]+)-light\b/g, '$1-$2-300'],
      ];

      let fixed = content;
      for (const [pattern, replacement] of replacements) {
        fixed = fixed.replace(pattern, replacement);
      }
      return fixed;
    },
    summary: () => 'Replaced invalid Tailwind class names with standard equivalents',
    global: true,
  },

  {
    id: 'tailwind-config-error',
    match: (error) =>
      error.includes('tailwind') && error.includes('config') &&
      (error.includes('SyntaxError') || error.includes('Cannot read')),
    fix: (_content, filePath) => {
      if (!filePath.includes('tailwind.config')) return _content;
      // Return a known-good config
      return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
    },
    summary: () => 'Replaced broken tailwind.config with a known-good default',
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. ASTRO CONFIG ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'astro-config-error',
    match: (error) =>
      error.includes('astro.config') &&
      (error.includes('SyntaxError') || error.includes('Cannot read') || error.includes('is not a function')),
    fix: (_content, filePath) => {
      if (!filePath.includes('astro.config')) return _content;
      return `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  server: { host: '0.0.0.0', port: 4321 },
});
`;
    },
    summary: () => 'Replaced broken astro.config with a known-good default',
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. RUNTIME ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'undefined-variable',
    match: (error) =>
      error.includes('is not defined') ||
      (error.includes('TypeError') && error.includes('Cannot read properties of undefined')),
    fix: (content, filePath, error) => {
      if (!filePath.endsWith('.astro')) return content;

      // Extract the undefined variable name
      const varMatch = error.match(/(\w+)\s+is not defined/) ||
                       error.match(/Cannot read properties of undefined \(reading '(\w+)'\)/);
      if (!varMatch) return content;
      const varName = varMatch[1];

      // Check if it's used in the frontmatter — add a default
      const lines = content.split('\n');
      let inFrontmatter = false;
      let fmEndIdx = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          if (!inFrontmatter) {
            inFrontmatter = true;
          } else {
            fmEndIdx = i;
            break;
          }
        }
      }

      if (fmEndIdx > 0) {
        // Add a default declaration before the closing ---
        lines.splice(fmEndIdx, 0, `const ${varName} = undefined; // auto-fix: was undefined`);
        return lines.join('\n');
      }

      return content;
    },
    summary: (error) => {
      const varMatch = error.match(/(\w+)\s+is not defined/) ||
                       error.match(/Cannot read properties of undefined \(reading '(\w+)'\)/);
      return `Added default for undefined variable "${varMatch?.[1] || 'unknown'}"`;
    },
  },

  {
    id: 'frontmatter-runtime-error',
    match: (error) =>
      error.includes('TypeError') &&
      (error.includes('.map is not a function') ||
       error.includes('.filter is not a function') ||
       error.includes('.forEach is not a function') ||
       error.includes('.reduce is not a function')),
    fix: (content, filePath) => {
      if (!filePath.endsWith('.astro')) return content;

      // Wrap array method calls with optional chaining / fallback
      // e.g., items.map(...) → (items || []).map(...)
      return content
        .replace(/(\w+)(\.map\()/g, '($1 || [])$2')
        .replace(/(\w+)(\.filter\()/g, '($1 || [])$2')
        .replace(/(\w+)(\.forEach\()/g, '($1 || [])$2')
        .replace(/(\w+)(\.reduce\()/g, '($1 || [])$2');
    },
    summary: () => 'Added null-safe wrappers around array method calls',
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. CONTENT COLLECTION ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'content-collection-error',
    match: (error) =>
      error.includes('getCollection') ||
      error.includes('content collection') ||
      (error.includes('astro:content') && error.includes('does not exist')),
    fix: (content, filePath, error) => {
      if (!filePath.endsWith('.astro')) return content;

      // Remove content collection imports and replace with static data
      let fixed = content;
      fixed = fixed.replace(/import\s+\{[^}]*getCollection[^}]*\}\s+from\s+['"]astro:content['"];?\n?/g, '');

      // Replace getCollection calls with empty arrays
      fixed = fixed.replace(/await\s+getCollection\(['"][^'"]+['"]\)/g, '[]');
      fixed = fixed.replace(/getCollection\(['"][^'"]+['"]\)/g, '[]');

      return fixed;
    },
    summary: () => 'Replaced content collection calls with static data (no collections configured)',
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. IMAGE/ASSET ERRORS
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'image-import-error',
    match: (error) =>
      (error.includes('Could not resolve') || error.includes('Cannot find')) &&
      (error.includes('.png') || error.includes('.jpg') || error.includes('.svg') || error.includes('.webp')),
    fix: (content, _filePath, error) => {
      // Remove imports of missing images
      const imgMatch = error.match(/['"]([^'"]+\.(png|jpg|jpeg|svg|webp|gif))['"]/);
      if (!imgMatch) return content;
      const imgPath = imgMatch[1];
      const escaped = imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      let fixed = content;
      // Remove the import statement
      fixed = fixed.replace(new RegExp(`import\\s+\\w+\\s+from\\s+['"]${escaped}['"];?\\n?`, 'g'), '');

      // Replace usages with a placeholder
      const importNameMatch = content.match(new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${escaped}['"]`));
      if (importNameMatch) {
        const varName = importNameMatch[1];
        // Replace {varName} with placeholder string in src attributes
        fixed = fixed.replace(new RegExp(`\\{${varName}\\}`, 'g'), '"https://placehold.co/800x600/eee/999?text=Image"');
        fixed = fixed.replace(new RegExp(`src=\\{${varName}\\}`, 'g'), 'src="https://placehold.co/800x600/eee/999?text=Image"');
      }

      return fixed;
    },
    summary: () => 'Removed missing image imports — replaced with placeholders',
  },
];

/**
 * Try deterministic fixes for a build error.
 * Returns the fixed files if any rule matched, or null.
 *
 * This should be called BEFORE the LLM-based fixer.
 */
export function tryDeterministicFix(
  errorMessage: string,
  fullOutput: string,
  fileContent: string,
  filePath: string,
  allFiles: Record<string, string>,
): { fixedContent: string; summary: string; ruleId: string } | null {
  for (const rule of ERROR_FIX_RULES) {
    if (rule.match(errorMessage, fullOutput)) {
      const fixed = rule.fix(fileContent, filePath, errorMessage, allFiles);
      if (fixed !== fileContent) {
        return {
          fixedContent: fixed,
          summary: rule.summary(errorMessage),
          ruleId: rule.id,
        };
      }
    }
  }
    // ── Astro props typed as string literal instead of string type ──────────────
  if (
    error.includes("Property") && error.includes("does not exist on type") &&
    (error.includes('"\"') || error.includes("'"") || error.match(/on type '".+"'/))
  ) {
    return {
      type: 'deterministic',
      description: 'Fix prop typed as string literal — should be string type',
      // Healing prompt for AI fallback
      prompt: `The error "Property X does not exist on type 'Y'" means a prop is typed as a string literal instead of string.
Fix by ensuring the Props interface uses 'string' not a literal like '"Learn more"'.
Example fix:
WRONG: interface Props { cta: "Learn more" }
RIGHT: interface Props { cta: string }
Also ensure default values use: const { cta = "Learn more" } = Astro.props; (not typed as const)`,
    };
  }

  return null;
}

/**
 * Try deterministic fixes across ALL files for a given error.
 * Used when the error might affect multiple files (global rules).
 */
export function tryGlobalDeterministicFix(
  errorMessage: string,
  fullOutput: string,
  files: Record<string, string>,
): { fixedFiles: Record<string, string>; summary: string[]; ruleId: string } | null {
  for (const rule of ERROR_FIX_RULES) {
    if (!rule.global) continue;
    if (!rule.match(errorMessage, fullOutput)) continue;

    const fixedFiles = { ...files };
    const summaries: string[] = [];
    let anyFixed = false;

    for (const [path, content] of Object.entries(files)) {
      if (!/\.(astro|ts|tsx|js|jsx|css)$/.test(path)) continue;

      const fixed = rule.fix(content, path, errorMessage, files);
      if (fixed !== content) {
        fixedFiles[path] = fixed;
        anyFixed = true;
        summaries.push(`${path.split('/').pop()}: ${rule.summary(errorMessage)}`);
      }
    }

    if (anyFixed) {
      return { fixedFiles, summary: summaries, ruleId: rule.id };
    }
  }

    // ── Astro props typed as string literal instead of string type ──────────────
  if (
    error.includes("Property") && error.includes("does not exist on type") &&
    (error.includes('"\"') || error.includes("'"") || error.match(/on type '".+"'/))
  ) {
    return {
      type: 'deterministic',
      description: 'Fix prop typed as string literal — should be string type',
      // Healing prompt for AI fallback
      prompt: `The error "Property X does not exist on type 'Y'" means a prop is typed as a string literal instead of string.
Fix by ensuring the Props interface uses 'string' not a literal like '"Learn more"'.
Example fix:
WRONG: interface Props { cta: "Learn more" }
RIGHT: interface Props { cta: string }
Also ensure default values use: const { cta = "Learn more" } = Astro.props; (not typed as const)`,
    };
  }

  return null;
}

