/**
 * Claude Site Generation Service (Server-side)
 *
 * Uses the Anthropic SDK with tool use to generate and customize websites.
 * Refactored into modules for maintainability.
 */

import { fetchTemplateScaffold } from '../templateService';

// Re-export types
export type { SiteGenerationInput, GeneratedFile, SiteGenerationResult, BuildError, AgentActivityEvent } from './types';

// Import from modules
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './types';
import { TEMPLATE_MAPPING, generateGlobalCSS } from './templates';
import { sanitizeContent, detectSyntaxErrors } from './sanitization';
import {
  generateFileContent,
  generateFileContentWithDesign,
  generateModificationPlan,
  deduplicateModifications,
} from './llmHelpers';
import { generateDesignSpec, type DesignSpec } from './designPhase';
import { fixSyntaxErrors } from './errorHealing';
import { normalizePath, initializeFilesMap, buildContext, fixLogoPlaceholders } from './file-initialization';

// Re-export healBuildErrors for external use
export { healBuildErrors } from './errorHealing';

// Re-export legacy/hybrid generation functions
export { generateSiteSync, generateSiteHybrid } from './generation-legacy';

/**
 * Generate a website by customizing an existing template
 */
export async function generateSiteFromTemplate(
  input: SiteGenerationInput,
  onProgress?: (message: string) => void,
): Promise<SiteGenerationResult> {
  // Agents SDK path — Node.js only (not Cloudflare Workers)
  // Pipe onAgentEvent from input through to the SDK callbacks
  const agentEventSink = input.onAgentEvent;
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

    // 4. Execute changes — Agents SDK (Node.js) or memory-based (Workers)
    const generatedFiles: GeneratedFile[] = [];

    if (isAgentsSDKAvailable()) {
      // ── Agents SDK path: Claude autonomously edits files in tmpdir ───────────
      const planText = deduplicatedMods.map(
        (m, i) => `${i + 1}. ${m.path}: ${m.instructions}`
      ).join('\n');

      onProgress?.('Launching Agents SDK for autonomous code generation...');
      agentEventSink?.({ type: 'thinking', text: 'Planning file modifications...' });

      const sdkFiles = await generateSiteWithAgentsSDK(
        { ...input, onAgentEvent: agentEventSink },
        templateFiles,
        planText,
        onProgress,
      );

      for (const f of sdkFiles) {
        generatedFiles.push({ path: f.path, content: f.content });
      }
    } else {
      // ── Memory-based path: parallel LLM batch calls (Cloudflare Workers) ────

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

    } // end memory-based path

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
      fixLogoPlaceholders(generatedFiles, businessName);
    }

    return { success: true, files: generatedFiles };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FlowstarterAgent] Error:', error);

    return { success: false, error: errorMessage };
  }
}




// ═══════════════════════════════════════════════════════════════════════════
// Agents SDK Integration
// Replaces the batch file-generation phase with a single autonomous SDK run.
// Requires Node.js runtime (file system access via os.tmpdir()).
// Falls back to the memory-based approach in Cloudflare Workers.
// ═══════════════════════════════════════════════════════════════════════════

import { generateCode } from '~/lib/services/claudeAgentSDK.server';

/** True when running in Node.js and AGENTS_SDK_ENABLED is set */
function isAgentsSDKAvailable(): boolean {
  try {
    // Workers runtime has no `process.versions.node`
    return !!(process?.versions?.node && process.env.AGENTS_SDK_ENABLED === 'true');
  } catch {
    return false;
  }
}

/**
 * Write template files to a tmpdir, run the Agents SDK, return modified files.
 * Only called when Node.js runtime is detected.
 */
async function generateSiteWithAgentsSDK(
  input: SiteGenerationInput,
  templateFiles: Array<{ path: string; content: string }>,
  plan: string,
  onProgress?: (message: string) => void,
): Promise<Array<{ path: string; content: string }>> {
  const { tmpdir } = await import('os');
  const { mkdir, writeFile, readdir, readFile } = await import('fs/promises');
  const { join } = await import('path');

  const workDir = join(tmpdir(), `flowstarter-${input.projectId}-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  // Write template files to tmpdir
  for (const file of templateFiles) {
    const fullPath = join(workDir, file.path);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }

  onProgress?.('Agents SDK: files scaffolded, running autonomous generation...');

  const businessName = input.businessInfo.name || input.siteName;
  const prompt = `You are generating a professional website for: ${businessName}

## Business Context
${JSON.stringify(input.businessInfo, null, 2)}

## Template
${input.template.name} (slug: ${input.template.slug})

## Your Task
${plan}

Read the existing template files, then apply ALL modifications described above.
Write every changed file back. Do not skip any files from the plan.
Ensure the result is production-ready Astro/HTML.`;

  const result = await generateCode(
    {
      projectId: input.projectId,
      prompt,
      workingDirectory: workDir,
      systemPrompt: `You are an expert Astro web developer. You are customizing a template website.
Apply all requested changes precisely. Write clean, semantic, accessible HTML/CSS/Astro code.
Business name: ${businessName}. Site name: ${input.siteName}.`,
    },
    {
      onProgress: (p) => onProgress?.(p.message),
      onAgentEvent: input.onAgentEvent,
    },
  );

  if (!result.success) {
    throw new Error(result.error || 'Agents SDK generation failed');
  }

  // Read all files from the workdir
  const outputFiles: Array<{ path: string; content: string }> = [];

  async function collectFiles(dir: string, base: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = join(dir, entry.name);
      const rel = join(base, entry.name);
      if (entry.isDirectory()) {
        await collectFiles(full, rel);
      } else {
        const content = await readFile(full, 'utf-8');
        outputFiles.push({ path: rel, content });
      }
    }
  }

  await collectFiles(workDir, '');
  onProgress?.(`Agents SDK: collected ${outputFiles.length} output files`);
  return outputFiles;
}
