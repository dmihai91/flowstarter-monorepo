/**
 * Claude Code CLI Interface
 *
 * Framework-agnostic wrapper for executing Claude Code in Daytona sandboxes.
 */

import type { Sandbox } from '@daytonaio/sdk';
import type {
  ClaudeCodeExecOptions,
  GenerationProgressEvent,
  StreamChunk,
} from './types';

const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  maxTurns: 10,
  timeout: 600,
  workDir: '/workspace',
};

/**
 * Build the Claude Code CLI command.
 */
export function buildCommand(options: ClaudeCodeExecOptions): string {
  const parts: string[] = ['claude', '--print'];

  if (options.model) {
    parts.push('--model', options.model);
  }

  if (options.maxTurns) {
    parts.push('--max-turns', String(options.maxTurns));
  }

  if (options.allowedTools?.length) {
    parts.push('--allowedTools', options.allowedTools.join(','));
  }

  if (options.disallowedTools?.length) {
    parts.push('--disallowedTools', options.disallowedTools.join(','));
  }

  const escapedPrompt = options.prompt.replace(/'/g, "'\\''");
  parts.push(`'${escapedPrompt}'`);

  return parts.join(' ');
}

/**
 * Run Claude Code in a sandbox directly.
 */
export async function runClaudeCodeInSandbox(
  sandbox: Sandbox,
  options: {
    prompt: string;
    contextFile?: string;
    model?: string;
    maxTurns?: number;
  },
  onProgress?: (event: GenerationProgressEvent) => void,
): Promise<{
  success: boolean;
  output: string;
  filesChanged: string[];
  duration: number;
  error?: string;
}> {
  const startTime = Date.now();

  onProgress?.({
    type: 'start',
    message: 'Starting Claude Code generation...',
    timestamp: new Date(),
  });

  let enhancedPrompt = options.prompt;
  if (options.contextFile) {
    enhancedPrompt = `Read the context file at ${options.contextFile} first, then: ${options.prompt}`;
  }

  const command = buildCommand({
    prompt: enhancedPrompt,
    contextFile: options.contextFile,
    workDir: DEFAULTS.workDir,
    model: options.model || DEFAULTS.model,
    maxTurns: options.maxTurns || DEFAULTS.maxTurns,
    timeout: DEFAULTS.timeout,
  });

  onProgress?.({
    type: 'thinking',
    message: 'Claude is analyzing the project...',
    timestamp: new Date(),
  });

  const workDir = (await sandbox.getUserRootDir()) || '/home/daytona';
  const fullCommand = `cd ${DEFAULTS.workDir} && ${command}`;

  const result = await sandbox.process.executeCommand(fullCommand, workDir);
  const duration = Date.now() - startTime;
  const output = result.result || '';

  if (onProgress) {
    parseAndEmitProgress(output, onProgress);
  }

  const filesChanged = parseChangedFiles(output);

  onProgress?.({
    type: 'complete',
    message: 'Generation complete',
    output,
    timestamp: new Date(),
  });

  return {
    success: result.exitCode === 0,
    output,
    filesChanged,
    duration,
    error: result.exitCode !== 0 ? output : undefined,
  };
}

/**
 * Cancel a running Claude Code process in the sandbox.
 */
export async function cancelClaudeCode(sandbox: Sandbox): Promise<boolean> {
  try {
    const workDir = (await sandbox.getUserRootDir()) || '/home/daytona';
    await sandbox.process.executeCommand('pkill -f "claude" || true', workDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Claude Code is available in the sandbox.
 */
export async function isClaudeCodeAvailable(sandbox: Sandbox): Promise<boolean> {
  try {
    const workDir = (await sandbox.getUserRootDir()) || '/home/daytona';
    const result = await sandbox.process.executeCommand('which claude', workDir);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get Claude Code version in sandbox.
 */
export async function getClaudeCodeVersion(sandbox: Sandbox): Promise<string | null> {
  try {
    const workDir = (await sandbox.getUserRootDir()) || '/home/daytona';
    const result = await sandbox.process.executeCommand('claude --version', workDir);
    if (result.exitCode === 0) {
      return result.result.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Claude Code output and emit progress events.
 */
function parseAndEmitProgress(
  output: string,
  onProgress: (event: GenerationProgressEvent) => void,
): void {
  const lines = output.split('\n');

  for (const line of lines) {
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
    } else if (
      line.includes('Writing file:') ||
      line.includes('Created:') ||
      line.includes('Modified:')
    ) {
      onProgress({
        type: 'output',
        message: line.trim(),
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Parse changed files from Claude Code output.
 */
export function parseChangedFiles(output: string): string[] {
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
 * Stream output helper (placeholder - Daytona SDK doesn't support real-time streaming yet).
 */
export function createStreamChunk(type: StreamChunk['type'], data?: string): StreamChunk {
  return { type, data };
}
