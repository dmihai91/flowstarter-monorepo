/**
 * Legacy & Hybrid Site Generation
 *
 * Contains the legacy sync generation (tool-use loop) and
 * hybrid generation (Claude Plan + Groq Execution) approaches.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { SiteGenerationInput, GeneratedFile, SiteGenerationResult } from './types';
import { getSystemPrompt, generateSitePlan, generateFileContent } from './llmHelpers';

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
