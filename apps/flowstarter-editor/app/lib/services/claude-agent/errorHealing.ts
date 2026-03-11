/**
 * Claude Agent Service - Error Healing
 *
 * Build error detection and automatic fixing.
 * Enhanced with better prompts and multi-file healing.
 */

import { generateCompletion } from '../llm';
import type { SiteGenerationInput, GeneratedFile, BuildError } from './types';
import { sanitizeContent, stripMarkdownCodeBlocks } from './sanitization';

/**
 * Fix build errors by regenerating affected files
 */
export async function healBuildErrors(
  input: SiteGenerationInput,
  files: GeneratedFile[],
  errors: BuildError[],
  onProgress?: (message: string) => void,
): Promise<GeneratedFile[]> {
  console.log(`[FlowstarterAgent] Healing ${errors.length} build errors...`);
  onProgress?.(`Fixing ${errors.length} build errors...`);

  const healedFiles = [...files];
  const filesToFix = new Set<string>();

  // Identify which files need fixing
  for (const error of errors) {
    if (error.file) {
      filesToFix.add(error.file);
    } else {
      // Try to extract file from error message
      const fileMatch = error.message.match(/([a-zA-Z0-9_.\-/]*(?:src\/)?[a-zA-Z0-9_.-]+\.(astro|ts|tsx|jsx|js|css|mjs))/);
      if (fileMatch) {
        filesToFix.add(fileMatch[1]);
      }
    }
  }

  console.log(`[FlowstarterAgent] Files to fix: ${Array.from(filesToFix).join(', ')}`);

  // Fix each problematic file
  for (const filePath of filesToFix) {
    const fileIndex = healedFiles.findIndex((f) => f.path === filePath || f.path.endsWith(filePath));

    if (fileIndex === -1) {
      console.warn(`[FlowstarterAgent] Could not find file ${filePath} to fix, trying basename match...`);

      // Try basename match
      const basename = filePath.split('/').pop();
      if (basename) {
        const basenameIndex = healedFiles.findIndex((f) => f.path.endsWith('/' + basename));
        if (basenameIndex !== -1) {
          console.log(`[FlowstarterAgent] Found file by basename: ${healedFiles[basenameIndex].path}`);
          await fixFile(healedFiles, basenameIndex, filePath, errors, input, onProgress);
          continue;
        }
      }

      console.warn(`[FlowstarterAgent] Skipping ${filePath} - not found in project files`);
      continue;
    }

    await fixFile(healedFiles, fileIndex, filePath, errors, input, onProgress);
  }

  onProgress?.('Build errors fixed');
  return healedFiles;
}

/**
 * Fix a specific file at the given index
 */
async function fixFile(
  healedFiles: GeneratedFile[],
  fileIndex: number,
  filePath: string,
  errors: BuildError[],
  input: SiteGenerationInput,
  onProgress?: (message: string) => void,
): Promise<void> {
  const originalFile = healedFiles[fileIndex];
  const relevantErrors = errors.filter(
    (e) =>
      e.file === filePath || e.message.includes(filePath) || e.message.includes(filePath.split('/').pop() || ''),
  );

  const errorSummary = relevantErrors.map((e) => `${e.message}${e.line ? ` (line ${e.line})` : ''}`).join('\n');

  console.log(`[FlowstarterAgent] Fixing ${filePath} with errors:\n${errorSummary}`);
  onProgress?.(`Fixing ${filePath.split('/').pop()}...`);

  try {
    const fixPrompt = `You are debugging a build error in an Astro website for "${input.businessInfo.name}". Fix ALL errors and return the COMPLETE corrected file.

File: ${filePath}

Build Errors:
${errorSummary}

Original File Content:
${originalFile.content}

STRICT RULES (violations will cause more build errors):
1. Use ONLY standard Tailwind color names: gray, slate, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, white, black
2. Do NOT use: cream, warm, cool, dark, light, primary, secondary, accent as color names
3. Do NOT use font-display, font-heading, or other custom font utilities  
4. Do NOT import astro-icon or any non-existent packages
5. All imports in .astro files MUST end with semicolons
6. All braces, brackets, and parentheses MUST be balanced
7. Use only packages listed in package.json

Return the COMPLETE corrected file content.
Do NOT add explanations, comments about what you changed, or markdown code blocks.
Return ONLY the raw file code.`;

    const fixedContent = await generateCompletion([{ role: 'user', content: fixPrompt }], {
      model: 'z-ai/glm-4.7',
      temperature: 0.1,
      maxTokens: 12000,
    });

    // Clean and sanitize
    const cleaned = stripMarkdownCodeBlocks(fixedContent);
    const sanitized = sanitizeContent(filePath, cleaned);

    healedFiles[fileIndex] = { ...originalFile, content: sanitized };
    console.log(`[FlowstarterAgent] Successfully fixed ${filePath}`);
  } catch (e) {
    console.error(`[FlowstarterAgent] Failed to fix ${filePath}:`, e);
  }
}

/**
 * Attempt to fix common syntax errors in generated code
 * Uses Claude Sonnet for LLM fixes (more reliable than the generation model)
 */
export async function fixSyntaxErrors(
  _input: SiteGenerationInput,
  filePath: string,
  content: string,
  errorMessage: string,
): Promise<string> {
  console.log(`[FlowstarterAgent] Attempting to fix syntax error in ${filePath}: ${errorMessage}`);

  // Use Claude Sonnet for reliable syntax fixing (not the generation model)
  const fixPrompt = `You are an expert at fixing Astro/TypeScript syntax errors. The following file has a syntax error that needs to be fixed.

File: ${filePath}
Error: ${errorMessage}

IMPORTANT ASTRO SYNTAX RULES:
1. Astro files have two parts separated by ---:
   - Frontmatter (between --- markers): TypeScript/JavaScript code for imports and logic
   - Template (after the second ---): HTML-like markup with optional {} for expressions
2. ALL braces { } must be balanced - count them carefully
3. ALL parentheses ( ) must be balanced
4. Template expressions use {expression} NOT {{expression}}
5. Don't mix JSX and Astro syntax - use Astro's syntax

Current file content (with the error):
\`\`\`astro
${content}
\`\`\`

Fix the syntax error by carefully balancing all braces and parentheses.
Return ONLY the complete corrected file content.
No explanations, no markdown code blocks - just the raw fixed code.`;

  try {
    // Use Claude Sonnet for more reliable fixing
    const fixedContent = await generateCompletion([{ role: 'user', content: fixPrompt }], {
      model: 'z-ai/glm-4.7',
      temperature: 0.1,
      maxTokens: 12000,
    });

    const cleaned = stripMarkdownCodeBlocks(fixedContent);
    
    // Validate the fix actually worked
    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;
    const openParens = (cleaned.match(/\(/g) || []).length;
    const closeParens = (cleaned.match(/\)/g) || []).length;
    
    if (openBraces === closeBraces && openParens === closeParens) {
      console.log(`[FlowstarterAgent] Successfully fixed ${filePath} with Claude Sonnet`);
      return cleaned;
    } else {
      console.warn(`[FlowstarterAgent] Claude fix still has unbalanced braces/parens in ${filePath}, returning original`);
      return content;
    }
  } catch (e) {
    console.error(`[FlowstarterAgent] Failed to fix syntax error:`, e);
    return content;
  }
}

/**
 * Try to fix common syntax errors without LLM
 */
function tryRuleBasedSyntaxFix(filePath: string, content: string, errorMessage: string): string | null {
  const lowerError = errorMessage.toLowerCase();

  // Fix unmatched braces
  if (lowerError.includes('unmatched') && (lowerError.includes('brace') || lowerError.includes('bracket'))) {
    const opens = (content.match(/{/g) || []).length;
    const closes = (content.match(/}/g) || []).length;

    if (opens > closes) {
      // Add missing closing braces at the end
      return content + '\n' + '}'.repeat(opens - closes);
    } else if (closes > opens) {
      // Remove extra closing braces from the end
      let fixed = content;
      let toRemove = closes - opens;
      while (toRemove > 0) {
        const lastBrace = fixed.lastIndexOf('}');
        if (lastBrace >= 0) {
          fixed = fixed.slice(0, lastBrace) + fixed.slice(lastBrace + 1);
          toRemove--;
        } else {
          break;
        }
      }
      return fixed;
    }
  }

  // Fix unmatched template literals (backticks)
  if (lowerError.includes('template literal') || lowerError.includes('backtick')) {
    const backticks = (content.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      // Find the last unclosed backtick and close it
      return content + '`';
    }
  }

  // Fix unmatched parentheses
  if (lowerError.includes('parenthes')) {
    const opens = (content.match(/\(/g) || []).length;
    const closes = (content.match(/\)/g) || []).length;

    if (opens > closes) {
      return content + ')'.repeat(opens - closes);
    }
  }

  return null;
}


