/**
 * Claude Site Generation Service (Server-side)
 *
 * Uses the Anthropic SDK with tool use to generate and customize websites.
 * This replaces the complex custom orchestrator with a simpler approach.
 *
 * Refactored into modules:
 * - types.ts: Type definitions
 * - templates.ts: Template mapping and config generation
 * - sanitization.ts: CSS/Astro sanitization
 * - contentGeneration.ts: Content markdown generation
 * - errorHealing.ts: Build error healing
 * - llmHelpers.ts: LLM prompts and file generation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { fetchTemplateScaffold } from '../templateService';

// Re-export types
export type { SiteGenerationInput, GeneratedFile, SiteGenerationResult, BuildError } from './types';

// Import from modules
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './types';
import {
  TEMPLATE_MAPPING,
  generatePackageJson,
  generateTailwindConfig,
  generateAstroConfig,
  generateGlobalCSS,
  generateLayoutAstro,
  generateIndexAstro,
  generatePlaceholderComponent,
  patchTailwindContentPaths,
} from './templates';
import { sanitizeContent, detectSyntaxErrors } from './sanitization';
import { validateAndFixFiles } from './astValidation';
import { generateDefaultContentMd, generateContentFiles } from './contentGeneration';
import {
  getSystemPrompt,
  generateSitePlan,
  generateFileContent,
  generateFileContentWithDesign,
  generateModificationPlan,
  deduplicateModifications,
} from './llmHelpers';
import { generateDesignSpec, type DesignSpec } from './designPhase';
import { healBuildErrors, fixSyntaxErrors } from './errorHealing';

// Re-export healBuildErrors for external use
export { healBuildErrors } from './errorHealing';

// File tool definition for the agent to write files
const FILE_WRITE_TOOL: Anthropic.Tool = {
  name: 'write_file',
  description: 'Write content to a file. Use this to create or update project files.',
  input_schema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'The file path relative to the project root (e.g., "src/pages/index.astro")',
      },
      content: {
        type: 'string',
        description: 'The complete file content to write',
      },
    },
    required: ['path', 'content'],
  },
};

/**
 * Normalize file path to include src/ prefix when appropriate
 */
function normalizePath(path: string): string {
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
function initializeFilesMap(
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
    filesMap.set('content.md', generateDefaultContentMd(input));
  }

  // Ensure global styles exist
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

  // Ensure Layout.astro exists
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

  // Ensure index.astro exists
  if (!filesMap.has('src/pages/index.astro')) {
    console.log('[FlowstarterAgent] index.astro missing, generating default...');
    filesMap.set('src/pages/index.astro', generateIndexAstro(input));
  }

  // Auto-generate missing components
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

  return filesMap;
}

/**
 * Build context string from files map
 */
function buildContext(filesMap: Map<string, string>): string {
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

/**
 * Generate a website by customizing an existing template
 */
export async function generateSiteFromTemplate(
  input: SiteGenerationInput,
  onProgress?: (message: string) => void,
): Promise<SiteGenerationResult> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
  }

  try {
    // 1. Fetch template
    let templateSlug = input.template.slug;

    if (TEMPLATE_MAPPING[templateSlug]) {
      console.log(
        `[FlowstarterAgent] Mapping virtual template ${templateSlug} to base template ${TEMPLATE_MAPPING[templateSlug]}`,
      );
      templateSlug = TEMPLATE_MAPPING[templateSlug];
    }

    console.log('[FlowstarterAgent] Fetching template:', templateSlug);
    onProgress?.(`Fetching template ${input.template.name}...`);

    let templateFiles: Array<{ path: string; content: string }> = [];

    try {
      templateFiles = await fetchTemplateScaffold(templateSlug);
    } catch (e) {
      console.warn(
        `[FlowstarterAgent] Failed to fetch template ${templateSlug}, falling back to generation from scratch:`,
        e,
      );

      try {
        if (input.template.slug !== 'modern-business') {
          templateFiles = await fetchTemplateScaffold('modern-business');
        }
      } catch {
        console.warn('[FlowstarterAgent] Fallback template fetch failed, generating from scratch');
      }
    }

    console.log(`[FlowstarterAgent] Fetched ${templateFiles.length} files`);

    // 2. Initialize files map with defaults
    const filesMap = initializeFilesMap(templateFiles, input);

    // 3. Build context and create modification plan
    const context = buildContext(filesMap);
    
    // ─── PHASE 1: DESIGN (Opus) ─────────────────────────────────────────────
    onProgress?.(`Creative director is designing your site...`);
    console.log('[FlowstarterAgent] Phase 1: Generating design spec with Opus...');

    let designSpec: DesignSpec | null = null;
    try {
      designSpec = await generateDesignSpec(input);
      console.log('[FlowstarterAgent] Design spec created:', {
        mood: designSpec.designDirection.mood,
        uniqueElement: designSpec.designDirection.uniqueElement,
        heroHeadline: designSpec.hero.headline,
        sections: designSpec.sections.length,
      });
      onProgress?.(`Design vision: "${designSpec.designDirection.uniqueElement}"`);
    } catch (error) {
      console.error('[FlowstarterAgent] Design phase failed, continuing with default:', error);
      onProgress?.(`Design phase skipped, using template defaults...`);
    }

    // ─── PHASE 2: PLANNING ──────────────────────────────────────────────────
    onProgress?.(`Planning strategic customizations...`);
    console.log('[FlowstarterAgent] Generating strategic modification plan...');

    const modifications = await generateModificationPlan(input, context);
    console.log(`[FlowstarterAgent] Plan created: ${modifications.length} modifications`);

    const deduplicatedMods = deduplicateModifications(modifications);
    console.log(`[FlowstarterAgent] Deduplicated to ${deduplicatedMods.length} unique files`);
    onProgress?.(`Plan created: Updating ${deduplicatedMods.length} files...`);

    // 4. Execute changes in parallel
    const generatedFiles: GeneratedFile[] = [];

    // Add all original files first (except those being modified)
    for (const [path, content] of filesMap.entries()) {
      if (!deduplicatedMods.find((m) => m.path === path || m.path === `src/${path}` || `src/${m.path}` === path)) {
        const normalizedPath = normalizePath(path);
        generatedFiles.push({ path: normalizedPath, content });
      }
    }

    // Process modifications in batches
    const batchSize = 5;

    for (let i = 0; i < deduplicatedMods.length; i += batchSize) {
      const batch = deduplicatedMods.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(deduplicatedMods.length / batchSize);
      console.log(`[FlowstarterAgent] Processing batch ${batchNum}...`);
      // Show which files are being generated
      const fileNames = batch.map((m) => m.path.split('/').pop()).join(', ');
      onProgress?.(`Generating files (${i + 1}-${Math.min(i + batch.length, deduplicatedMods.length)} of ${deduplicatedMods.length}): ${fileNames}`);

      const results = await Promise.all(
        batch.map(async (mod) => {
          let originalPath = mod.path;
          let content = filesMap.get(originalPath);

          if (!content && originalPath.startsWith('src/')) {
            originalPath = originalPath.replace('src/', '');
            content = filesMap.get(originalPath);
          }

          const isNewFile = !content || mod.instructions.includes('NEW:');

          if (isNewFile) {
            console.log(`[FlowstarterAgent] Creating new file ${mod.path}...`);
            onProgress?.(`Creating ${mod.path.split('/').pop()}...`);
          } else {
            console.log(`[FlowstarterAgent] Modifying ${mod.path}...`);
            onProgress?.(`Customizing ${mod.path.split('/').pop()}...`);
          }

          const contextStr = isNewFile
            ? `Instructions: ${mod.instructions}\n\nThis is a NEW file - create it from scratch based on the instructions.`
            : `Instructions: ${mod.instructions}\n\nOriginal File Content:\n${content}`;

          const newContent = designSpec
            ? await generateFileContentWithDesign(input, mod.path, contextStr, designSpec)
            : await generateFileContent(input, mod.path, contextStr);
          let sanitizedContent = sanitizeContent(mod.path, newContent);

          const syntaxError = detectSyntaxErrors(mod.path, sanitizedContent);

          if (syntaxError) {
            console.warn(`[FlowstarterAgent] Syntax error detected in ${mod.path}: ${syntaxError}`);
            sanitizedContent = await fixSyntaxErrors(input, mod.path, sanitizedContent, syntaxError);
          }

          return { path: mod.path, content: sanitizedContent };
        }),
      );

      for (const res of results) {
        if (res) {
          generatedFiles.push(res);
        }
      }
      onProgress?.(`Completed ${Math.min(i + batch.length, deduplicatedMods.length)} of ${deduplicatedMods.length} files`);
    }

    console.log(`[FlowstarterAgent] Generation complete. Total files: ${generatedFiles.length}`);
    onProgress?.('Validating generated files...');

    // Final validation pass
    let fixCount = 0;

    for (let i = 0; i < generatedFiles.length; i++) {
      const file = generatedFiles[i];
      const syntaxError = detectSyntaxErrors(file.path, file.content);

      if (syntaxError) {
        console.warn(`[FlowstarterAgent] Final validation found syntax error in ${file.path}: ${syntaxError}`);
        const fixed = await fixSyntaxErrors(input, file.path, file.content, syntaxError);
        generatedFiles[i] = { ...file, content: fixed };
        fixCount++;
      }
    }

    if (fixCount > 0) {
      console.log(`[FlowstarterAgent] Fixed ${fixCount} syntax errors in final validation`);
      onProgress?.(`Fixed ${fixCount} syntax errors`);
    }

    // Ensure global.css is in output
    if (!generatedFiles.find((f) => f.path === 'src/styles/global.css')) {
      console.log('[FlowstarterAgent] Force injecting src/styles/global.css');
      generatedFiles.push({
        path: 'src/styles/global.css',
        content: generateGlobalCSS(input),
      });
    }

    // Post-process: fix logo placeholders when no logo was uploaded
    if (!input.businessInfo?.logo) {
      const businessName = input.businessInfo?.name || input.projectName || 'My Business';
      console.log(`[FlowstarterAgent] No logo uploaded �?" fixing placeholder images to use "${businessName}" text`);
      
      for (let i = 0; i < generatedFiles.length; i++) {
        const file = generatedFiles[i];
        // Only process Astro/HTML files that might contain nav/header logos
        if (!file.path.endsWith('.astro')) continue;
        
        let content = file.content;
        let modified = false;
        
        // Pattern 1: Replace <img> tags that look like logos (in nav/header areas, or with logo-related attributes)
        // Match: <img ... class="...logo..." ... /> or <img ... alt="...logo..." ... />
        const logoImgPattern = /<img\s+[^>]*(?:class\s*=\s*["'][^"']*logo[^"']*["']|alt\s*=\s*["'][^"']*(?:logo|brand)[^"']*["']|src\s*=\s*["'][^"']*(?:logo|brand)[^"']*["'])[^>]*\/?>/gi;
        if (logoImgPattern.test(content)) {
          content = content.replace(logoImgPattern, `<span class="text-xl font-bold">${businessName}</span>`);
          modified = true;
        }
        
        // Pattern 2: Replace empty/placeholder logo divs with colored backgrounds
        // Match: <div class="...w-8 h-8...bg-...rounded..."></div> (common logo placeholder pattern)
        const placeholderDivPattern = /<div\s+class="[^"]*(?:w-[68]|w-1[02])\s[^"]*(?:h-[68]|h-1[02])[^"]*(?:bg-|rounded)[^"]*"[^>]*>\s*<\/div>/gi;
        if (placeholderDivPattern.test(content)) {
          content = content.replace(placeholderDivPattern, `<span class="text-xl font-bold">${businessName}</span>`);
          modified = true;
        }
        
        if (modified) {
          generatedFiles[i] = { ...file, content };
          console.log(`[FlowstarterAgent] Fixed logo placeholder in ${file.path}`);
        }
      }
    }

    return { success: true, files: generatedFiles };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FlowstarterAgent] Error:', error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Generate a website using Hybrid approach (Claude Plan + Groq Execution)
 */
export async function generateSiteHybrid(
  input: SiteGenerationInput,
  onProgress?: (message: string) => void,
): Promise<SiteGenerationResult> {
  try {
    console.log('[HybridAgent] Phase 1: Planning with Claude...');
    onProgress?.('Planning site architecture with Claude...');

    const { files: filePaths, architecture } = await generateSitePlan(input);
    console.log(`[HybridAgent] Plan created with ${filePaths.length} files.`);
    console.log('[HybridAgent] Architecture:', architecture.slice(0, 100) + '...');
    onProgress?.(`Plan created: ${filePaths.length} files to generate.`);

    const generatedFiles: GeneratedFile[] = [];
    const batchSize = 5;

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      console.log(`[HybridAgent] Phase 2: Generating batch ${i / batchSize + 1}... (${batch.join(', ')})`);
      onProgress?.(
        `Generating batch ${Math.floor(i / batchSize) + 1}: ${batch.map((p) => p.split('/').pop()).join(', ')}...`,
      );

      const results = await Promise.all(
        batch.map(async (path) => {
          try {
            const content = await generateFileContent(input, path, architecture);
            return { path, content };
          } catch (e) {
            console.error(`[HybridAgent] Failed to generate ${path}:`, e);
            return null;
          }
        }),
      );

      for (const res of results) {
        if (res) {
          generatedFiles.push(res);
        }
      }
    }

    console.log(`[HybridAgent] Generation complete. Created ${generatedFiles.length} files.`);

    return { success: true, files: generatedFiles };
  } catch (error) {
    console.error('[HybridAgent] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate a website using Claude with tool use (Legacy)
 */
export async function generateSiteSync(input: SiteGenerationInput): Promise<SiteGenerationResult> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const generatedFiles: GeneratedFile[] = [];
  const systemPrompt = getSystemPrompt(input);

  try {
    const messages: MessageParam[] = [
      {
        role: 'user',
        content: `Please generate a complete website for "${input.businessInfo.name}" using the specifications above. Use the write_file tool to create each file. Start now.`,
      },
    ];

    let continueLoop = true;
    let maxIterations = 30;

    while (continueLoop && maxIterations > 0) {
      maxIterations--;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        tools: [FILE_WRITE_TOOL],
        messages,
      });

      messages.push({
        role: 'assistant',
        content: response.content,
      });

      const toolUses = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');

      if (toolUses.length === 0 || response.stop_reason === 'end_turn') {
        continueLoop = false;
        break;
      }

      const toolResults: ToolResultBlockParam[] = [];

      for (const toolUse of toolUses) {
        if (toolUse.name === 'write_file') {
          const { path, content } = toolUse.input as { path: string; content: string };
          generatedFiles.push({ path, content });
          console.log(`[FlowstarterAgent] Created file: ${path}`);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Successfully wrote ${path} (${content.length} bytes)`,
          });
        } else {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: 'Unknown tool',
            is_error: true,
          });
        }
      }

      if (toolResults.length === 0) {
        continueLoop = false;
        break;
      }

      messages.push({
        role: 'user',
        content: toolResults,
      });
    }

    console.log(`[FlowstarterAgent] Generation complete. Created ${generatedFiles.length} files.`);

    return { success: true, files: generatedFiles };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FlowstarterAgent] Error:', error);

    return { success: false, error: errorMessage };
  }
}


