/**
 * FlowOps Code Generator Agent (Executor)
 *
 * Fast code generation agent using Kimi K2 via Groq for template customization.
 * Communicates with Planner (for instructions) and Fixer (for error fixes) via FlowOps.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { generateJSON } from '~/lib/services/llm';
import { GenerateRequestSchema } from './code-generator-schemas';
import type { GenerateRequestDTO, GenerateResultDTO } from './code-generator-schemas';
import { buildGenerateFilePrompt, buildRefineFilePrompt } from './code-generator-prompts';

// Re-export schemas and types for backward compatibility
export * from './code-generator-schemas';

const EXECUTOR_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 16000;

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

You are optimized for speed and bulk output. The planner makes the decisions,
you execute them precisely.`,
      allowedTools: [],
      allowedAgents: ['planner', 'fixer'],
    });
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing generation request...', 5);
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
    switch (request.type) {
      case 'generate': return this.handleGenerate(request, context);
      case 'refine': return this.handleRefine(request, context);
      case 'fix-apply': return this.handleFixApply(request, context);
      default: return this.createErrorResponse(`Unknown request type: ${request.type}`);
    }
  }

  private async handleGenerate(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Generating code with Kimi K2 (Groq)...', 10);
    const modifiedFiles: string[] = [];
    const outputFiles: Record<string, string> = { ...request.templateFiles };
    const sortedMods = [...request.modifications].sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority || 'medium'] - priority[b.priority || 'medium'];
    });
    const batchSize = 3;
    for (let i = 0; i < sortedMods.length; i += batchSize) {
      const batch = sortedMods.slice(i, i + batchSize);
      const progress = 10 + (i / sortedMods.length) * 80;
      context.onProgress?.(`Generating files (${i + 1}/${sortedMods.length})...`, progress);
      const results = await Promise.all(batch.map((mod) => this.generateFile(mod, request, outputFiles)));
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
      success: modifiedFiles.length > 0, files: outputFiles, modifiedFiles,
      summary: `Generated ${modifiedFiles.length} files`,
    };
    return { message: this.createMessage('agent', JSON.stringify(result)), complete: true };
  }

  private async handleRefine(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Refining code based on feedback...', 10);
    if (!request.previousFiles || !request.feedback || request.feedback.length === 0) {
      return this.createErrorResponse('No previous files or feedback provided for refinement');
    }
    const modifiedFiles: string[] = [];
    const outputFiles: Record<string, string> = { ...request.previousFiles };
    const sortedFeedback = [...request.feedback].sort((a, b) => {
      const priority = { 'must-fix': 0, 'should-fix': 1, 'nice-to-have': 2 };
      return priority[a.priority] - priority[b.priority];
    });
    for (let i = 0; i < sortedFeedback.length; i++) {
      const fb = sortedFeedback[i];
      const progress = 10 + (i / sortedFeedback.length) * 80;
      context.onProgress?.(`Refining ${fb.file} (${i + 1}/${sortedFeedback.length})...`, progress);
      const originalContent = outputFiles[fb.file];
      if (!originalContent) { this.logger.warn(`File not found for refinement: ${fb.file}`); continue; }
      const refinedContent = await this.refineFile(fb.file, originalContent, fb.instruction, request);
      if (refinedContent) { outputFiles[fb.file] = refinedContent; modifiedFiles.push(fb.file); }
    }
    context.onProgress?.('Refinement complete', 100);
    const result: GenerateResultDTO = {
      success: modifiedFiles.length > 0, files: outputFiles, modifiedFiles,
      summary: `Refined ${modifiedFiles.length} files`,
    };
    return { message: this.createMessage('agent', JSON.stringify(result)), complete: true };
  }

  private async handleFixApply(request: GenerateRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Applying fix...', 50);
    if (!request.fixApplication) return this.createErrorResponse('No fix application provided');
    const { file, fixedContent } = request.fixApplication;
    const outputFiles: Record<string, string> = { ...request.templateFiles };
    outputFiles[file] = fixedContent;
    context.onProgress?.('Fix applied', 100);
    const result: GenerateResultDTO = {
      success: true, files: outputFiles, modifiedFiles: [file], summary: `Applied fix to ${file}`,
    };
    return { message: this.createMessage('agent', JSON.stringify(result)), complete: true };
  }

  private async generateFile(
    modification: { path: string; instructions: string },
    request: GenerateRequestDTO,
    existingFiles: Record<string, string>,
  ): Promise<{ path: string; success: boolean; content?: string; error?: string }> {
    const prompt = buildGenerateFilePrompt(modification, request, existingFiles);
    try {
      const response = await generateJSON<{ success: boolean; content?: string; error?: string }>(
        [{ role: 'user', content: prompt }],
        { model: EXECUTOR_MODEL, temperature: 0.2, maxTokens: MAX_TOKENS, thinking: { budget: 10000 } },
      );
      if (response.success && response.content) {
        return { path: modification.path, success: true, content: response.content };
      }
      return { path: modification.path, success: false, error: response.error || 'Generation returned empty content' };
    } catch (error) {
      return { path: modification.path, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async refineFile(
    path: string, originalContent: string, instruction: string, request: GenerateRequestDTO,
  ): Promise<string | null> {
    const prompt = buildRefineFilePrompt(path, originalContent, instruction, request);
    try {
      const response = await generateJSON<{ success: boolean; content?: string }>(
        [{ role: 'user', content: prompt }],
        { model: EXECUTOR_MODEL, temperature: 0.2, maxTokens: MAX_TOKENS, thinking: { budget: 10000 } },
      );
      return response.success && response.content ? response.content : null;
    } catch (error) {
      this.logger.error(`Failed to refine ${path}:`, error);
      return null;
    }
  }

  private createErrorResponse(error: string): AgentResponse {
    const result: GenerateResultDTO = { success: false, files: {}, error };
    return {
      message: this.createMessage('agent', JSON.stringify(result)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

let codeGeneratorAgentInstance: CodeGeneratorAgent | null = null;

export function getCodeGeneratorAgent(): CodeGeneratorAgent {
  if (!codeGeneratorAgentInstance) {
    codeGeneratorAgentInstance = new CodeGeneratorAgent();
  }
  return codeGeneratorAgentInstance;
}

export function resetCodeGeneratorAgent(): void {
  codeGeneratorAgentInstance = null;
}
