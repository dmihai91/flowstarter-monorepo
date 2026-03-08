/**
 * File Initialization Helpers
 *
 * Handles template file map initialization with defaults,
 * path normalization, and context building for the Claude agent.
 */

import type { SiteGenerationInput } from './types';
import {
  generatePackageJson,
  generateTailwindConfig,
  generateAstroConfig,
  generateGlobalCSS,
  generateLayoutAstro,
  generateIndexAstro,
  generatePlaceholderComponent,
  patchTailwindContentPaths,
} from './templates';
import { generateContentFiles } from './contentGeneration';

/**
 * Normalize file path to include src/ prefix when appropriate
 */
export function normalizePath(path: string): string {
  let normalized = path.replace(/^\.?\//, '');

  if (
    !normalized.startsWith('src/') &&
    (normalized.startsWith('pages/') ||
      normalized.startsWith('layouts/') ||
      normalized.startsWith('components/') ||
      normalized.startsWith('styles/') ||
      normalized.startsWith('lib/') ||
      normalized.startsWith('utils/'))
  ) {
    normalized = `src/${normalized}`;
  }

  return normalized;
}

/**
 * Initialize template files map with defaults
 */
export function initializeFilesMap(
  templateFiles: Array<{ path: string; content: string }>,
  input: SiteGenerationInput,
): Map<string, string> {
  const filesMap = new Map<string, string>();

  // Add template files with normalized paths
  for (const file of templateFiles) {
    const path = normalizePath(file.path);
    filesMap.set(path, file.content);
  }

  // Add required config files if not present
  if (!filesMap.has('package.json')) {
    filesMap.set('package.json', generatePackageJson(input.siteName));
  }

  // Handle tailwind config
  const existingConfigPath = ['tailwind.config.mjs', 'tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.ts'].find(
    (p) => filesMap.has(p),
  );

  if (existingConfigPath) {
    console.log(`[FlowstarterAgent] Found existing tailwind config: ${existingConfigPath}`);
    const configContent = filesMap.get(existingConfigPath) || '';
    filesMap.set(existingConfigPath, patchTailwindContentPaths(configContent));
  } else {
    filesMap.set('tailwind.config.mjs', generateTailwindConfig());
  }

  // Ensure astro.config.mjs exists
  if (!filesMap.has('astro.config.mjs') || !filesMap.get('astro.config.mjs')?.includes('tailwind')) {
    filesMap.set('astro.config.mjs', generateAstroConfig());
  }

  // Generate new data-driven content files
  const contentFiles = generateContentFiles(input);
  for (const [filePath, fileContent] of Object.entries(contentFiles)) {
    if (!filesMap.has(filePath)) {
      console.log('[FlowstarterAgent] Generating', filePath);
      filesMap.set(filePath, fileContent);
    }
  }

  // Legacy content.md for backwards compatibility
  if (!filesMap.has('content.md')) {
    console.log('[FlowstarterAgent] content.md missing, generating default...');
    filesMap.set('content.md', `# ${input.siteName}\n\n${input.businessInfo?.description || 'Welcome to our website.'}\n`);
  }

  addDefaultStyles(filesMap, input);
  addDefaultLayout(filesMap, input);
  addDefaultIndex(filesMap, input);
  addMissingComponents(filesMap);

  return filesMap;
}

/**
 * Ensure global styles exist in the files map
 */
function addDefaultStyles(filesMap: Map<string, string>, input: SiteGenerationInput): void {
  if (!filesMap.has('src/styles/global.css') && !filesMap.has('src/styles/base.css')) {
    console.log('[FlowstarterAgent] global.css missing, generating default...');
    filesMap.set('src/styles/global.css', generateGlobalCSS(input));
  } else {
    let content = filesMap.get('src/styles/global.css') || '';

    if (!content.includes('@tailwind base')) {
      content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${content}`;
      filesMap.set('src/styles/global.css', content);
    }
  }
}

/**
 * Ensure Layout.astro exists with global.css import
 */
function addDefaultLayout(filesMap: Map<string, string>, input: SiteGenerationInput): void {
  if (!filesMap.has('src/layouts/Layout.astro')) {
    filesMap.set('src/layouts/Layout.astro', generateLayoutAstro(input));
  } else {
    let layoutContent = filesMap.get('src/layouts/Layout.astro') || '';

    if (!layoutContent.includes('../styles/global.css') && !layoutContent.includes('/styles/global.css')) {
      if (layoutContent.startsWith('---')) {
        layoutContent = layoutContent.replace('---', "---\nimport '../styles/global.css';");
      } else {
        layoutContent = `---\nimport '../styles/global.css';\n---\n${layoutContent}`;
      }

      filesMap.set('src/layouts/Layout.astro', layoutContent);
    }
  }
}

/**
 * Ensure index.astro exists
 */
function addDefaultIndex(filesMap: Map<string, string>, input: SiteGenerationInput): void {
  if (!filesMap.has('src/pages/index.astro')) {
    console.log('[FlowstarterAgent] index.astro missing, generating default...');
    filesMap.set('src/pages/index.astro', generateIndexAstro(input));
  }
}

/**
 * Auto-generate missing components referenced in index.astro
 */
function addMissingComponents(filesMap: Map<string, string>): void {
  const indexContent = filesMap.get('src/pages/index.astro');

  if (indexContent) {
    const importRegex = /import\s+(\w+)\s+from\s+['"]\.\.\/components\/(\w+)\.astro['"]/g;
    let match;

    while ((match = importRegex.exec(indexContent)) !== null) {
      const componentName = match[2];
      const componentPath = `src/components/${componentName}.astro`;

      if (!filesMap.has(componentPath)) {
        console.log(`[FlowstarterAgent] Referenced component ${componentName} missing, generating default...`);
        filesMap.set(componentPath, generatePlaceholderComponent(componentName));
      }
    }
  }
}

/**
 * Fix logo placeholder images when no logo was uploaded
 */
export function fixLogoPlaceholders(files: Array<{ path: string; content: string }>, businessName: string): void {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.path.endsWith('.astro')) continue;

    let content = file.content;
    let modified = false;

    const logoImgPattern = /<img\s+[^>]*(?:class\s*=\s*["'][^"']*logo[^"']*["']|alt\s*=\s*["'][^"']*(?:logo|brand)[^"']*["']|src\s*=\s*["'][^"']*(?:logo|brand)[^"']*["'])[^>]*\/?>/gi;
    if (logoImgPattern.test(content)) {
      content = content.replace(logoImgPattern, `<span class="text-xl font-bold">${businessName}</span>`);
      modified = true;
    }

    const placeholderDivPattern = /<div\s+class="[^"]*(?:w-[68]|w-1[02])\s[^"]*(?:h-[68]|h-1[02])[^"]*(?:bg-|rounded)[^"]*"[^>]*>\s*<\/div>/gi;
    if (placeholderDivPattern.test(content)) {
      content = content.replace(placeholderDivPattern, `<span class="text-xl font-bold">${businessName}</span>`);
      modified = true;
    }

    if (modified) {
      files[i] = { ...file, content };
      console.log(`[FlowstarterAgent] Fixed logo placeholder in ${file.path}`);
    }
  }
}

/**
 * Build context string from files map for LLM prompts
 */
export function buildContext(filesMap: Map<string, string>): string {
  let context = 'Here are the content files from the template:\n\n';

  for (const [path, content] of filesMap.entries()) {
    if (
      (path.includes('pages/') || path.includes('layouts/') || path.includes('components/')) &&
      !path.includes('node_modules')
    ) {
      const truncatedContent = content.length > 5000 ? content.slice(0, 5000) + '\n... (truncated)' : content;
      context += `--- ${path} ---\n${truncatedContent}\n\n`;
    }
  }

  return context;
}
