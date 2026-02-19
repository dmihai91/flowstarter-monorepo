/**
 * FlowOps Code Generator Agent (Executor)
 *
 * Fast code generation agent using Kimi K2 via Groq for:
 * - Template-based generation: Apply modifications from planner
 * - Fast iterations: Quick code output for build-test cycles
 * - Bulk code output: Generate multiple files in one pass
 *
 * This is a low-cost, fast agent that handles the heavy lifting.
 * Communicates with Planner (for instructions) and Fixer (for error fixes) via FlowOps.
 *
 * Model: Kimi K2 via Groq (groq/kimi-k2)
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { z } from 'zod';
import { generateJSON, generateCompletion } from '~/lib/services/llm';

/*
 * ============================================================================
 * Constants
 * ============================================================================
 */

/** Executor model for fast code generation - Kimi K2-0905 via Groq (256k context) */
const EXECUTOR_MODEL = 'moonshotai/kimi-k2-instruct-0905';

/** Max tokens for generation (Kimi K2 supports large context) */
const MAX_TOKENS = 16000;

/*
 * ============================================================================
 * Schemas
 * ============================================================================
 */

export const GenerateRequestSchema = z.object({
  /** Type of generation request */
  type: z.enum(['generate', 'refine', 'fix-apply']),

  /** Project ID */
  projectId: z.string(),

  /** Business information for context */
  businessInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    services: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    brandTone: z.string().optional(),
  }),

  /** Template files to modify */
  templateFiles: z.record(z.string()),

  /** Modification plan from planner */
  modifications: z.array(
    z.object({
      path: z.string(),
      instructions: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    }),
  ),

  /** Content guidelines from planner */
  contentGuidelines: z
    .object({
      tone: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
    })
    .optional(),

  /** Design choices */
  design: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),

  /** For refine: Previous files that need improvement */
  previousFiles: z.record(z.string()).optional(),

  /** For refine: Feedback from reviewer */
  feedback: z
    .array(
      z.object({
        file: z.string(),
        instruction: z.string(),
        priority: z.enum(['must-fix', 'should-fix', 'nice-to-have']),
      }),
    )
    .optional(),

  /** For fix-apply: Single file fix from fixer agent */
  fixApplication: z
    .object({
      file: z.string(),
      fixedContent: z.string(),
    })
    .optional(),
});

export type GenerateRequestDTO = z.infer<typeof GenerateRequestSchema>;

export const GenerateResultSchema = z.object({
  success: z.boolean(),
  files: z.record(z.string()),
  summary: z.string().optional(),
  modifiedFiles: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type GenerateResultDTO = z.infer<typeof GenerateResultSchema>;

/*
 * ============================================================================
 * Code Generator Agent Implementation
 * ============================================================================
 */

export class CodeGeneratorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'code-generator',
      description: 'Fast code generation agent using Kimi K2 via Groq for template customization',
      version: '1.0.0',
      systemPrompt: `You are a fast, precise code generation agent for Astro websites.
You take modification plans from the planner and apply them to template files.

Your responsibilities:
1. Apply modifications exactly as instructed
2. Maintain code quality and consistency
3. Generate complete, working files
4. Preserve template structure where not modified
5. ALWAYS use TypeScript strict mode - type ALL callback parameters

CRITICAL TypeScript Rules:
- NEVER write {items.map((item) => ...)} - this causes build failures
- ALWAYS write {items.map((item: ItemType) => ...)} with explicit types
- Every .map(), .filter(), .forEach() callback must have typed parameters
- Common types: string, number, { key: type }, array element types

You are optimized for speed and bulk output. The planner makes the decisions,
you execute them precisely.`,
      allowedTools: [],
      allowedAgents: ['planner', 'fixer'],
    });
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing generation request...', 5);

    // Parse and validate request
    let request: GenerateRequestDTO;

    try {
      const parsed = JSON.parse(message);
      const validation = GenerateRequestSchema.safeParse(parsed);

      if (!validation.success) {
        return this.createErrorResponse(`Invalid request: ${validation.error.message}`);
      }

      request = validation.data;
    } catch {
      return this.createErrorResponse(
        'Invalid JSON. Expected: { type, projectId, businessInfo, templateFiles, modifications }',
      );
    }

    this.logger.info(`Processing ${request.type} request for project ${request.projectId}`);

    // Route to appropriate handler
    switch (request.type) {
      case 'generate':
        return this.handleGenerate(request, context);
      case 'refine':
        return this.handleRefine(request, context);
      case 'fix-apply':
        return this.handleFixApply(request, context);
      default:
        return this.createErrorResponse(`Unknown request type: ${request.type}`);
    }
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Generate Handler - Initial code generation
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private async handleGenerate(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Generating code with Kimi K2 (Groq)...', 10);

    const modifiedFiles: string[] = [];
    const outputFiles: Record<string, string> = { ...request.templateFiles };

    // Sort modifications by priority
    const sortedMods = [...request.modifications].sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority || 'medium'] - priority[b.priority || 'medium'];
    });

    // Process modifications in batches for efficiency
    const batchSize = 3;

    for (let i = 0; i < sortedMods.length; i += batchSize) {
      const batch = sortedMods.slice(i, i + batchSize);
      const progress = 10 + (i / sortedMods.length) * 80;
      context.onProgress?.(`Generating files (${i + 1}/${sortedMods.length})...`, progress);

      // Generate batch in parallel
      const results = await Promise.all(batch.map((mod) => this.generateFile(mod, request, outputFiles)));

      // Apply results
      for (const result of results) {
        if (result.success && result.content) {
          outputFiles[result.path] = result.content;
          modifiedFiles.push(result.path);
        } else {
          this.logger.warn(`Failed to generate ${result.path}: ${result.error}`);
        }
      }
    }

    context.onProgress?.('Generation complete', 100);

    const result: GenerateResultDTO = {
      success: modifiedFiles.length > 0,
      files: outputFiles,
      modifiedFiles,
      summary: `Generated ${modifiedFiles.length} files`,
    };

    return {
      message: this.createMessage('agent', JSON.stringify(result)),
      complete: true,
    };
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Refine Handler - Apply reviewer feedback
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private async handleRefine(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Refining code based on feedback...', 10);

    if (!request.previousFiles || !request.feedback || request.feedback.length === 0) {
      return this.createErrorResponse('No previous files or feedback provided for refinement');
    }

    const modifiedFiles: string[] = [];
    const outputFiles: Record<string, string> = { ...request.previousFiles };

    // Sort feedback by priority
    const sortedFeedback = [...request.feedback].sort((a, b) => {
      const priority = { 'must-fix': 0, 'should-fix': 1, 'nice-to-have': 2 };
      return priority[a.priority] - priority[b.priority];
    });

    // Apply refinements
    for (let i = 0; i < sortedFeedback.length; i++) {
      const fb = sortedFeedback[i];
      const progress = 10 + (i / sortedFeedback.length) * 80;
      context.onProgress?.(`Refining ${fb.file} (${i + 1}/${sortedFeedback.length})...`, progress);

      const originalContent = outputFiles[fb.file];

      if (!originalContent) {
        this.logger.warn(`File not found for refinement: ${fb.file}`);
        continue;
      }

      const refinedContent = await this.refineFile(fb.file, originalContent, fb.instruction, request);

      if (refinedContent) {
        outputFiles[fb.file] = refinedContent;
        modifiedFiles.push(fb.file);
      }
    }

    context.onProgress?.('Refinement complete', 100);

    const result: GenerateResultDTO = {
      success: modifiedFiles.length > 0,
      files: outputFiles,
      modifiedFiles,
      summary: `Refined ${modifiedFiles.length} files`,
    };

    return {
      message: this.createMessage('agent', JSON.stringify(result)),
      complete: true,
    };
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Fix Apply Handler - Apply a fix from fixer agent
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private async handleFixApply(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Applying fix...', 50);

    if (!request.fixApplication) {
      return this.createErrorResponse('No fix application provided');
    }

    const { file, fixedContent } = request.fixApplication;
    const outputFiles: Record<string, string> = { ...request.templateFiles };
    outputFiles[file] = fixedContent;

    context.onProgress?.('Fix applied', 100);

    const result: GenerateResultDTO = {
      success: true,
      files: outputFiles,
      modifiedFiles: [file],
      summary: `Applied fix to ${file}`,
    };

    return {
      message: this.createMessage('agent', JSON.stringify(result)),
      complete: true,
    };
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * File Generation
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private async generateFile(
    modification: { path: string; instructions: string },
    request: GenerateRequestDTO,
    existingFiles: Record<string, string>,
  ): Promise<{ path: string; success: boolean; content?: string; error?: string }> {
    const originalContent = existingFiles[modification.path] || '';

    // List available image files from template
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
    const availableImages = Object.keys(existingFiles)
      .filter(path => imageExtensions.some(ext => path.toLowerCase().endsWith(ext)))
      .map(path => {
        // Convert to public URL format
        if (path.startsWith('public/')) return '/' + path.slice(7);
        return '/' + path;
      });

    // List available components and layouts for imports
    const availableComponents = Object.keys(existingFiles)
      .filter(path => path.endsWith('.astro') || path.endsWith('.tsx') || path.endsWith('.jsx'))
      .map(path => path.replace(/^src\//, '~/'));

    const prompt = `Apply the following modification to the file.

## FILE: ${modification.path}
${originalContent ? `\n## ORIGINAL CONTENT:\n\`\`\`\n${originalContent}\n\`\`\`` : '(New file)'}

## MODIFICATION INSTRUCTIONS:
${modification.instructions}

## BUSINESS CONTEXT:
- Business: ${request.businessInfo.name}
- Description: ${request.businessInfo.description || 'N/A'}
- Services: ${request.businessInfo.services?.join(', ') || 'N/A'}
- Target Audience: ${request.businessInfo.targetAudience || 'N/A'}
- Brand Tone: ${request.contentGuidelines?.tone || request.businessInfo.brandTone || 'Professional'}

## DESIGN:
- Primary Color: ${request.design?.primaryColor || 'Use existing'}
- Font Family: ${request.design?.fontFamily || 'Use existing'}

## CONTENT GUIDELINES:
${request.contentGuidelines?.keyMessages ? `- Key Messages: ${request.contentGuidelines.keyMessages.join(', ')}` : ''}
${request.contentGuidelines?.ctaText ? `- CTA Text: ${request.contentGuidelines.ctaText}` : ''}

## AVAILABLE COMPONENTS/LAYOUTS (only import from these!):
${availableComponents.length > 0 ? availableComponents.map(p => '- ' + p).join('\n') : '(Use standard Astro components only)'}

## AVAILABLE IMAGES IN TEMPLATE:
${availableImages.length > 0 ? availableImages.map(p => '- ' + p).join('\n') : '(No images in template - use placeholder services like https://placehold.co/800x600)'}

## OUTPUT (JSON only):
{
  "success": true,
  "content": "The complete modified file content"
}

IMPORTANT:
1. Apply modifications exactly as instructed
2. Return the COMPLETE file content, not just changes
3. Maintain proper file structure (Astro frontmatter, imports, etc.)
4. Use business-specific content (not placeholder text)
5. ONLY use image paths from AVAILABLE IMAGES list - never invent paths like /images/hero.jpg
6. ONLY import components from AVAILABLE COMPONENTS list - never invent component paths
7. PRESERVE ORIGINAL IMPORT PATHS - if the original file uses '../layouts/Layout.astro', keep that exact path
8. DO NOT change relative imports (../) to aliased imports (~/) - Astro templates use relative paths
9. When modifying a page, keep all existing imports exactly as they are unless the modification explicitly changes them

## CSS Best Practices (CRITICAL - prevents layout issues)
10. NEVER use position: absolute/fixed for decorative text that overlaps main content
11. Set proper z-index: main content z-index: 10+, decorative backgrounds z-index: -1 or 0
12. Hero backgrounds: use object-fit: cover, NOT absolute positioning that covers content
13. Decorative text/watermarks: use opacity: 0.1-0.3 AND z-index: -1, pointer-events: none

## Link Integrity (CRITICAL - prevents broken links)
14. ONLY link to pages that exist: index.astro, about.astro, services.astro, contact.astro, booking.astro
15. NEVER create links to /schedule, /instructors, /classes unless in AVAILABLE COMPONENTS
16. For non-existent pages, use href="#" or remove the link
17. Navigation menus should only include pages that exist in the template

## Theme Handling (Light/Dark Mode)
18. ALWAYS use CSS variables or Tailwind dark: classes for colors that need theme support
19. Use bg-white dark:bg-gray-900, text-gray-900 dark:text-white patterns
20. Avoid hardcoded colors like #000000 or rgb(0,0,0) - use semantic Tailwind classes
21. Images/icons should work on both light and dark backgrounds (use proper contrast)
22. If template has a theme toggle, preserve it and ensure all new content respects it
23. Test mental model: would this text be readable on both white AND dark backgrounds?

## Design Quality Principles (Good Taste, Not Hardcoded)
24. Hero sections should have visually compelling backgrounds appropriate to the brand (gradients, images, or colors that fit the business type)
25. Use clear content hierarchy: supporting text/badge ��' main headline ��' explanatory subtitle
26. Include primary AND secondary CTAs where appropriate - give users options
27. Add social proof when relevant: testimonials, customer logos, ratings, or trust indicators that fit the business
28. Maintain strong visual hierarchy with proper text sizing - headlines should stand out, body text should be readable
29. Buttons should feel clickable with proper sizing, spacing, and hover feedback
30. Use subtle micro-interactions and transitions to make the UI feel polished
31. For SaaS/products, show the product in action; for services, show results or team
32. Always ensure proper contrast ratios for accessibility - test that text is readable on its background

## TypeScript Strict Mode (CRITICAL - prevents build failures)
33. ALL .map() callbacks MUST have typed parameters - NEVER write {items.map((item) => ...)}
34. ALWAYS type callback params: {items.map((item: ItemType) => ...)}, {times.map((time: string, i: number) => ...)}
35. For slots/bookings: {slots.map((slot: { day: string; times: string[] }) => ...)}
36. For features/benefits: {features.map((feature: { title: string; description: string }) => ...)}
37. For services: {services.map((service: { name: string; price?: string }) => ...)}
38. For testimonials: {testimonials.map((t: { name: string; text: string; rating?: number }) => ...)}
39. For navigation: {navLinks.map((link: { href: string; label: string }) => ...)}
40. When in doubt about types, use explicit inline types or 'as any' as last resort
41. NEVER use implicit any - every .map(), .filter(), .reduce() must have typed params`;

    try {
      const response = await generateJSON<{ success: boolean; content?: string; error?: string }>(
        [{ role: 'user', content: prompt }],
        {
          model: EXECUTOR_MODEL,
          temperature: 0.2,
          maxTokens: MAX_TOKENS,
          thinking: { budget: 10000 },
        },
      );

      if (response.success && response.content) {
        return {
          path: modification.path,
          success: true,
          content: response.content,
        };
      }

      return {
        path: modification.path,
        success: false,
        error: response.error || 'Generation returned empty content',
      };
    } catch (error) {
      return {
        path: modification.path,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async refineFile(
    path: string,
    originalContent: string,
    instruction: string,
    request: GenerateRequestDTO,
  ): Promise<string | null> {
    const prompt = `Refine this file based on the feedback.

## FILE: ${path}

## CURRENT CONTENT:
\`\`\`
${originalContent}
\`\`\`

## REFINEMENT INSTRUCTION:
${instruction}

## BUSINESS CONTEXT:
- Business: ${request.businessInfo.name}
- Brand Tone: ${request.contentGuidelines?.tone || request.businessInfo.brandTone || 'Professional'}

## OUTPUT (JSON only):
{
  "success": true,
  "content": "The complete refined file content"
}

IMPORTANT:
1. Apply ONLY the refinement instruction
2. Don't make unrelated changes
3. Return the COMPLETE file content
4. ALWAYS type .map() callback parameters - {items.map((item: ItemType) => ...)}
5. NEVER use implicit any types - every callback must have typed params`;

    try {
      const response = await generateJSON<{ success: boolean; content?: string }>([{ role: 'user', content: prompt }], {
        model: EXECUTOR_MODEL,
        temperature: 0.2,
        maxTokens: MAX_TOKENS,
          thinking: { budget: 10000 },
      });

      return response.success && response.content ? response.content : null;
    } catch (error) {
      this.logger.error(`Failed to refine ${path}:`, error);
      return null;
    }
  }

  private createErrorResponse(error: string): AgentResponse {
    const result: GenerateResultDTO = {
      success: false,
      files: {},
      error,
    };

    return {
      message: this.createMessage('agent', JSON.stringify(result)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton instance
 * ============================================================================
 */

let codeGeneratorAgentInstance: CodeGeneratorAgent | null = null;

/**
 * Get the singleton CodeGeneratorAgent instance.
 */
export function getCodeGeneratorAgent(): CodeGeneratorAgent {
  if (!codeGeneratorAgentInstance) {
    codeGeneratorAgentInstance = new CodeGeneratorAgent();
  }

  return codeGeneratorAgentInstance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetCodeGeneratorAgent(): void {
  codeGeneratorAgentInstance = null;
}





