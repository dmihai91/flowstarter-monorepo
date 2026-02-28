import type { Sandbox } from '@daytonaio/sdk';

const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  maxTurns: 10,
  workDir: '/workspace',
};

interface RunOptions {
  prompt: string;
  model?: string;
  maxTurns?: number;
}

export interface RunResult {
  success: boolean;
  output: string;
  filesChanged: string[];
  duration: number;
  error?: string;
}

function buildCommand(prompt: string, model?: string, maxTurns?: number): string {
  const parts = ['claude', '--print'];
  if (model) parts.push('--model', model);
  if (maxTurns) parts.push('--max-turns', String(maxTurns));
  parts.push(`'${prompt.replace(/'/g, "'\\''")}'`);
  return parts.join(' ');
}

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
      if (file && !files.includes(file)) files.push(file);
    }
  }
  return files;
}

export async function runClaudeCode(sandbox: Sandbox, options: RunOptions): Promise<RunResult> {
  const start = Date.now();
  const command = buildCommand(options.prompt, options.model || DEFAULTS.model, options.maxTurns || DEFAULTS.maxTurns);
  const workDir = (await sandbox.getWorkDir()) || '/home/daytona';
  const result = await sandbox.process.executeCommand(`cd ${DEFAULTS.workDir} && ${command}`, workDir);
  const output = result.result || '';
  return {
    success: result.exitCode === 0,
    output,
    filesChanged: parseChangedFiles(output),
    duration: Date.now() - start,
    error: result.exitCode !== 0 ? output : undefined,
  };
}
