/**
 * Claude Code CLI Interface
 *
 * Wraps the Claude Code CLI to execute prompts in Daytona workspaces.
 * Handles command construction, execution, and output streaming.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { createLogger } from '~/lib/utils/logger';
import { getSandbox, ensureWorkspaceRunning } from './workspaceManager';
import type {
  ClaudeCodeEnv,
  ClaudeCodeExecOptions,
  GenerationProgressEvent,
  GenerationRequest,
  GenerationResult,
  StreamChunk,
} from './types';

const log = createLogger('ClaudeCodeCLI');

/**
 * Default Claude Code settings
 */
const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  maxTurns: 10,
  timeout: 600, // 10 minutes
  workDir: '/workspace',
};

/**
 * Build the Claude Code CLI command
 */
function buildCommand(options: ClaudeCodeExecOptions): string {
  const parts: string[] = ['claude'];

  // Add print mode for non-interactive execution
  parts.push('--print');

  // Add model if specified
  if (options.model) {
    parts.push('--model', options.model);
  }

  // Add max turns
  if (options.maxTurns) {
    parts.push('--max-turns', String(options.maxTurns));
  }

  // Add allowed tools
  if (options.allowedTools?.length) {
    parts.push('--allowedTools', options.allowedTools.join(','));
  }

  // Add disallowed tools
  if (options.disallowedTools?.length) {
    parts.push('--disallowedTools', options.disallowedTools.join(','));
  }

  // Add the prompt (escaped for shell)
  const escapedPrompt = options.prompt.replace(/'/g, "'\\''");
  parts.push(`'${escapedPrompt}'`);

  return parts.join(' ');
}

/**
 * Run Claude Code in a workspace
 */
export async function runClaudeCode(
  request: GenerationRequest,
  env?: ClaudeCodeEnv,
  onProgress?: (event: GenerationProgressEvent) => void
): Promise<GenerationResult> {
  const { workspaceId, prompt, contextFile, model, maxTurns } = request;

  log.info(`Running Claude Code in workspace ${workspaceId}`);

  const startTime = Date.now();

  // Emit start event
  onProgress?.({
    type: 'start',
    message: 'Starting Claude Code generation...',
    timestamp: new Date(),
  });

  try {
    // Ensure workspace is running
    const isRunning = await ensureWorkspaceRunning(workspaceId, env);
    if (!isRunning) {
      throw new Error(`Workspace ${workspaceId} is not running`);
    }

    // Get sandbox
    const sandbox = await getSandbox(workspaceId, env);
    if (!sandbox) {
      throw new Error(`Could not get sandbox for workspace ${workspaceId}`);
    }

    // Build enhanced prompt with context file reference
    let enhancedPrompt = prompt;
    if (contextFile) {
      enhancedPrompt = `Read the context file at ${contextFile} first, then: ${prompt}`;
    }

    // Build command
    const command = buildCommand({
      prompt: enhancedPrompt,
      contextFile,
      workDir: DEFAULTS.workDir,
      model: model || DEFAULTS.model,
      maxTurns: maxTurns || DEFAULTS.maxTurns,
      timeout: DEFAULTS.timeout,
    });

    log.debug(`Executing: ${command}`);

    // Execute Claude Code
    onProgress?.({
      type: 'thinking',
      message: 'Claude is analyzing the project...',
      timestamp: new Date(),
    });

    const result = await executeClaudeCode(sandbox, command, DEFAULTS.timeout, onProgress);

    const duration = Date.now() - startTime;

    // Parse changed files from output
    const filesChanged = parseChangedFiles(result.output || '');

    // Emit completion
    onProgress?.({
      type: 'complete',
      message: 'Generation complete',
      output: result.output,
      timestamp: new Date(),
    });

    log.info(`Claude Code completed in ${duration}ms, ${filesChanged.length} files changed`);

    return {
      success: result.exitCode === 0,
      output: result.output,
      filesChanged,
      duration,
      error: result.exitCode !== 0 ? result.output : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error(`Claude Code execution failed: ${errorMsg}`);

    onProgress?.({
      type: 'error',
      error: errorMsg,
      timestamp: new Date(),
    });

    return {
      success: false,
      error: errorMsg,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute Claude Code command in sandbox
 */
async function executeClaudeCode(
  sandbox: Sandbox,
  command: string,
  timeout: number,
  onProgress?: (event: GenerationProgressEvent) => void
): Promise<{ exitCode: number; output: string }> {
  // Change to workspace directory first
  const fullCommand = `cd ${DEFAULTS.workDir} && ${command}`;

  // Execute with timeout
  const result = await sandbox.process.executeCommand(fullCommand, { timeout });

  // Parse and emit progress from output
  if (result.result && onProgress) {
    parseAndEmitProgress(result.result, onProgress);
  }

  return {
    exitCode: result.exitCode,
    output: result.result,
  };
}

/**
 * Parse Claude Code output and emit progress events
 */
function parseAndEmitProgress(
  output: string,
  onProgress: (event: GenerationProgressEvent) => void
): void {
  const lines = output.split('\n');

  for (const line of lines) {
    // Detect tool usage
    if (line.includes('Using tool:') || line.includes('Tool:')) {
      const toolMatch = line.match(/(?:Using tool:|Tool:)\s*(\w+)/i);
      if (toolMatch) {
        onProgress({
          type: 'tool_use',
          toolName: toolMatch[1],
          message: line.trim(),
          timestamp: new Date(),
        });
      }
    }
    // Detect file operations
    else if (line.includes('Writing file:') || line.includes('Created:') || line.includes('Modified:')) {
      onProgress({
        type: 'output',
        message: line.trim(),
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Parse changed files from Claude Code output
 */
function parseChangedFiles(output: string): string[] {
  const files: string[] = [];
  const patterns = [
    /(?:Writing file:|Created:|Modified:|Wrote:)\s*[`']?([^\s`']+)[`']?/gi,
    /(?:File saved:|Updated:)\s*[`']?([^\s`']+)[`']?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const file = match[1].trim();
      if (file && !files.includes(file)) {
        files.push(file);
      }
    }
  }

  return files;
}

/**
 * Stream output from a running Claude Code session
 */
export async function streamOutput(
  workspaceId: string,
  onChunk: (chunk: StreamChunk) => void,
  env?: ClaudeCodeEnv
): Promise<void> {
  const sandbox = await getSandbox(workspaceId, env);
  if (!sandbox) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  // Note: Daytona SDK may not support real-time streaming yet
  // This is a placeholder for when that capability is available
  log.warn('Real-time streaming not yet implemented - using polling');

  // For now, we can only get output after execution completes
  onChunk({
    type: 'stderr',
    data: 'Note: Real-time streaming not available, output will be returned on completion',
  });
}

/**
 * Cancel a running Claude Code session
 */
export async function cancelGeneration(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<boolean> {
  log.info(`Cancelling generation in workspace ${workspaceId}`);

  try {
    const sandbox = await getSandbox(workspaceId, env);
    if (!sandbox) {
      return false;
    }

    // Kill any running claude process
    await sandbox.process.executeCommand('pkill -f "claude" || true', { timeout: 10 });

    return true;
  } catch (error) {
    log.error(`Failed to cancel generation: ${error}`);
    return false;
  }
}

/**
 * Check if Claude Code is available in the workspace
 */
export async function isClaudeCodeAvailable(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<boolean> {
  try {
    const sandbox = await getSandbox(workspaceId, env);
    if (!sandbox) {
      return false;
    }

    const result = await sandbox.process.executeCommand('which claude', { timeout: 10 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get Claude Code version in workspace
 */
export async function getClaudeCodeVersion(
  workspaceId: string,
  env?: ClaudeCodeEnv
): Promise<string | null> {
  try {
    const sandbox = await getSandbox(workspaceId, env);
    if (!sandbox) {
      return null;
    }

    const result = await sandbox.process.executeCommand('claude --version', { timeout: 10 });
    if (result.exitCode === 0) {
      return result.result.trim();
    }
    return null;
  } catch {
    return null;
  }
}
