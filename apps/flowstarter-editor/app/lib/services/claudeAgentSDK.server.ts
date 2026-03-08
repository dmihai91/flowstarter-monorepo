/**
 * Claude Agent SDK Service (Server-side)
 *
 * Uses the official Claude Agent SDK for code generation and file editing.
 * This provides Claude Code's full capabilities for autonomous coding tasks.
 * Now supports image inputs for visual context!
 */

import { query, type Options, type SDKMessage, type SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

export interface ImageInput {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  filename?: string;
}

export interface CodeGenerationInput {
  projectId: string;
  prompt: string;
  workingDirectory: string;
  existingFiles?: Record<string, string>;
  systemPrompt?: string;
  images?: ImageInput[];
}

export interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'update' | 'delete';
}

export interface CodeGenerationResult {
  success: boolean;
  files?: FileChange[];
  response?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalCostUSD: number;
  };
}

export interface StreamCallbacks {
  onMessage?: (message: string) => void;
  onFileChange?: (file: FileChange) => void;
  onProgress?: (progress: { phase: string; message: string }) => void;
  onError?: (error: string) => void;
  /** Rich structured events for the AgentActivityPanel */
  onAgentEvent?: (event: AgentActivityEvent) => void;
}

// Re-export AgentActivityEvent from the canonical definition in claude-agent/types.ts
export type { AgentActivityEvent } from '~/lib/services/claude-agent/types';
import type { AgentActivityEvent } from '~/lib/services/claude-agent/types';

/**
 * Build prompt content with optional images
 * Returns either a string or an array of content blocks for multimodal input
 */
function buildPromptWithImages(textPrompt: string, images?: ImageInput[]): string | Array<{ type: string; [key: string]: any }> {
  if (!images || images.length === 0) {
    return textPrompt;
  }

  // Build content blocks array with images first, then text
  const contentBlocks: Array<{ type: string; [key: string]: any }> = [];

  // Add images
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.base64,
      },
    });
  }

  // Add text instruction
  contentBlocks.push({
    type: 'text',
    text: textPrompt,
  });

  return contentBlocks;
}

/**
 * Generate or modify code using Claude Agent SDK
 *
 * This uses the full Claude Code capabilities including:
 * - File reading and writing
 * - Code understanding and modification
 * - Multi-file refactoring
 * - Error detection and fixing
 * - Image understanding for visual context
 */
export async function generateCode(
  input: CodeGenerationInput,
  callbacks?: StreamCallbacks,
): Promise<CodeGenerationResult> {
  const fileChanges: FileChange[] = [];
  let responseText = '';

  try {
    callbacks?.onProgress?.({ phase: 'starting', message: 'Starting code generation...' });

    // Build system prompt for website generation
    const systemPrompt = input.systemPrompt || buildDefaultSystemPrompt(input);

    // Configure the agent
    const options: Options = {
      cwd: input.workingDirectory,
      model: 'claude-sonnet-4-20250514', // Sonnet: fast coder; Opus used in fixer-agent for quality passes
      permissionMode: 'bypassPermissions', // Allow all file operations
      maxTurns: 50,
      systemPrompt,

      // Track file changes through hooks
      hooks: {
        PostToolUse: [
          {
            hooks: [
              async (hookInput) => {
                if (hookInput.hook_event_name === 'PostToolUse') {
                  const { tool_name, tool_input, tool_response } = hookInput;

                  // Track file writes
                  if (tool_name === 'Write' || tool_name === 'Edit') {
                    const filePath = (tool_input as any)?.file_path || (tool_input as any)?.path;
                    const content = (tool_input as any)?.content || (tool_input as any)?.new_content;

                    if (filePath && content) {
                      const change: FileChange = {
                        path: filePath,
                        content,
                        operation: tool_name === 'Write' ? 'create' : 'update',
                      };
                      fileChanges.push(change);
                      callbacks?.onFileChange?.(change);
                    }
                  }
                }

                return { continue: true };
              },
            ],
          },
        ],
      },
    };

    // Build prompt (with images if provided)
    const prompt = buildPromptWithImages(input.prompt, input.images);

    // Run the agent
    const result = query({
      prompt: prompt as any, // SDK accepts string or content blocks
      options,
    });

    // Process messages from the agent
    for await (const message of result) {
      processMessage(message, callbacks);

      // Collect assistant text responses
      if (message.type === 'assistant' && message.message.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      // Handle result message
      if (message.type === 'result') {
        const resultMsg = message as SDKResultMessage;

        if (resultMsg.subtype === 'success') {
          callbacks?.onProgress?.({ phase: 'complete', message: 'Code generation complete!' });

          return {
            success: true,
            files: fileChanges,
            response: resultMsg.result || responseText,
            usage: {
              inputTokens: resultMsg.usage.input_tokens,
              outputTokens: resultMsg.usage.output_tokens,
              totalCostUSD: resultMsg.total_cost_usd,
            },
          };
        } else {
          // Error result
          const errors = 'errors' in resultMsg ? (resultMsg as any).errors : [];
          return {
            success: false,
            files: fileChanges,
            error: errors?.join?.('\n') || 'Unknown error during execution',
          };
        }
      }
    }

    // If we get here without a result, something went wrong
    return {
      success: false,
      error: 'Agent did not produce a result',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ClaudeAgentSDK] Error:', error);
    callbacks?.onError?.(errorMessage);

    return {
      success: false,
      files: fileChanges,
      error: errorMessage,
    };
  }
}

/**
 * Process incoming SDK messages and trigger callbacks
 */
function countLines(content: unknown): number {
  if (typeof content === 'string') return content.split('\n').length;
  return 0;
}

function processMessage(message: SDKMessage, callbacks?: StreamCallbacks): void {
  const emit = (event: AgentActivityEvent) => callbacks?.onAgentEvent?.(event);

  switch (message.type) {
    case 'assistant': {
      if (!message.message.content) break;

      for (const block of message.message.content) {
        if (block.type === 'text' && block.text) {
          callbacks?.onMessage?.(block.text);
          emit({ type: 'text', content: block.text });
        } else if (block.type === 'thinking' && (block as any).thinking) {
          emit({ type: 'thinking', text: (block as any).thinking });
        } else if (block.type === 'tool_use') {
          const toolName = block.name as string;
          const input = block.input as Record<string, unknown>;

          // Map tool names to file events
          if (toolName === 'Write' || toolName === 'create_file') {
            const path = (input.file_path || input.path) as string;
            const content = input.content as string;
            if (path) emit({ type: 'file_write', path, lines: countLines(content) });
          } else if (toolName === 'Edit' || toolName === 'str_replace_editor') {
            const path = (input.file_path || input.path || input.old_file_path) as string;
            if (path) emit({ type: 'file_write', path });
          } else if (toolName === 'Read' || toolName === 'read_file') {
            const path = (input.file_path || input.path) as string;
            if (path) emit({ type: 'file_read', path });
          } else if (toolName === 'Bash' || toolName === 'bash' || toolName === 'execute_command') {
            const cmd = (input.command || input.cmd) as string;
            if (cmd) emit({ type: 'command', cmd });
          } else {
            emit({ type: 'tool_call', name: toolName, input });
          }
        }
      }
      break;
    }

    case 'stream_event': {
      // Raw streaming events — capture thinking deltas
      const event = message.event as any;
      if (event?.type === 'content_block_delta' && event.delta?.type === 'thinking_delta') {
        // Thinking is accumulated in assistant blocks; no-op here to avoid duplication
      }
      break;
    }

    case 'system': {
      if (message.subtype === 'init') {
        callbacks?.onProgress?.({
          phase: 'initialized',
          message: `Agent initialized with ${(message as any).tools?.length ?? 0} tools`,
        });
      }
      break;
    }

    case 'tool_progress': {
      callbacks?.onProgress?.({ phase: 'working', message: `Using ${message.tool_name}...` });
      emit({ type: 'tool_result', name: message.tool_name, duration_s: message.elapsed_time_seconds });
      break;
    }

    case 'result': {
      const r = message as any;
      if (r.subtype === 'success') {
        const usage = r.usage ?? {};
        emit({
          type: 'done',
          duration_ms: r.duration_ms ?? 0,
          turns: r.num_turns ?? 0,
          cost_usd: r.total_cost_usd ?? 0,
          input_tokens: usage.input_tokens ?? 0,
          output_tokens: usage.output_tokens ?? 0,
        });
      } else if (r.errors?.length) {
        emit({ type: 'error', message: r.errors.join('; ') });
      }
      break;
    }
  }
}

/**
 * Build default system prompt for website generation
 */
function buildDefaultSystemPrompt(input: CodeGenerationInput): string {
  return `You are an expert web developer creating a professional website.

## Project Context
- Project ID: ${input.projectId}
- Working Directory: ${input.workingDirectory}

## Your Capabilities
You have full access to read and write files, run commands, and modify the codebase.
Use your tools to:
1. Read existing files to understand the project structure
2. Write or edit files to implement changes
3. Create new files as needed

## Image Handling
When the user provides images:
- Analyze the images to understand what they contain
- If the user wants to add an image to the site, save it to the appropriate location (e.g., \`public/images/\` or \`src/assets/\`)
- Update the relevant component or page to reference the new image
- Ask clarifying questions if the user hasn't specified where to use the image

For saving user-uploaded images:
1. The image data is provided as base64
2. Save it to an appropriate location like \`public/images/user-upload-[timestamp].[ext]\`
3. Update the relevant component to use the new image path

## Guidelines
- Write clean, modern, production-ready code
- Follow best practices for the framework being used
- Ensure responsive design and accessibility
- Use semantic HTML and modern CSS
- Keep code well-organized and maintainable

## Important
- Always read existing files before modifying them
- Preserve existing functionality unless explicitly asked to change it
- Test your changes mentally before writing them
- Use proper error handling and edge case coverage`;
}

/**
 * Quick one-shot code generation for simple tasks
 */
export async function quickGenerate(
  prompt: string,
  workingDirectory: string,
  model: string = 'claude-sonnet-4-20250514', // override with opus for quality-critical tasks
): Promise<CodeGenerationResult> {
  return generateCode({
    projectId: 'quick-generate',
    prompt,
    workingDirectory,
  });
}

/**
 * Fix a build error using Claude Agent SDK
 */
export async function fixBuildError(
  errorLog: string,
  filePath: string,
  fileContent: string,
  workingDirectory: string,
): Promise<CodeGenerationResult> {
  const prompt = `A build error occurred. Please fix it.

**Error Log:**
\`\`\`
${errorLog}
\`\`\`

**File with error:** ${filePath}

**Current content:**
\`\`\`
${fileContent}
\`\`\`

Please:
1. Analyze the error
2. Read the file if needed for more context
3. Fix the error by editing the file
4. Explain what you fixed`;

  return generateCode({
    projectId: 'fix-build-error',
    prompt,
    workingDirectory,
  });
}

/**
 * Apply code changes from a diff or instruction
 * Now supports image attachments!
 */
export async function applyChanges(
  instruction: string,
  targetFiles: string[],
  workingDirectory: string,
  images?: ImageInput[],
): Promise<CodeGenerationResult> {
  const fileList = targetFiles.length > 0 ? targetFiles.map((f) => `- ${f}`).join('\n') : '(Let the agent determine which files to modify)';

  let prompt: string;

  if (images && images.length > 0) {
    // With images - include guidance about what to do with them
    prompt = `Please apply the following changes to the codebase:

${instruction}

**Attached images:** ${images.length} image(s) have been provided.

If the user wants to use these images on the site:
1. First, save each image to the \`public/images/\` directory with descriptive filenames
2. Then update the relevant component(s) to use the new image(s)
3. If the user hasn't specified where to use the images, describe them and ask where they'd like them placed

**Target files (if specified):**
${fileList}

Please:
1. Analyze any attached images
2. Read relevant files to understand the current structure
3. Apply the requested changes
4. If adding images, save them and update components appropriately
5. Summarize what you changed`;
  } else {
    // Without images - original behavior
    prompt = `Please apply the following changes to the codebase:

${instruction}

**Target files:**
${fileList}

Please:
1. Read each target file first
2. Apply the requested changes
3. Write the updated files
4. Summarize what you changed`;
  }

  return generateCode({
    projectId: 'apply-changes',
    prompt,
    workingDirectory,
    images,
  });
}

