/**
 * Trusted post-agent validation. These commands are operator-defined and run
 * outside Pi — the agent has no shell and cannot influence what runs here.
 */

import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { SiteValidator } from '@flowstarter/agentic-codegen';
import type { ValidatorCommand } from './config';

const execFileAsync = promisify(execFile);

export class SiteValidationError extends Error {}

/**
 * Skips trusted validation when the stub agent runs.
 *
 * The dry path materializes plain HTML with no package manifest; the real
 * validator would reject it before LocalSitePublisher can pack the site root.
 */
export class NoopSiteValidator implements SiteValidator {
  async validate(
    _workspaceRoot: string,
    _phase: 'preview' | 'full',
  ): Promise<void> {}
}

/**
 * Output lines kept per command. The tail is the useful half of a build log:
 * the summary of what was emitted, or the error that stopped it.
 */
export const VALIDATOR_OUTPUT_LINES = 200;

export interface CommandSiteValidatorOptions {
  commands: ValidatorCommand[];
  timeoutMs: number;
  /** Build output that must exist once the commands have run. */
  outputDir?: string;
  onProgress?: (message: string) => void;
  /**
   * The last {@link VALIDATOR_OUTPUT_LINES} lines a command printed, once it
   * has finished either way. Trusted machine text: this runs outside Pi, so
   * nothing an agent wrote can reach it except as build output.
   */
  onOutput?: (command: string, lines: string[]) => void;
}

/** The tail of a command's combined output, blank lines dropped. */
function tailLines(stdout: string, stderr: string): string[] {
  return `${stdout ?? ''}\n${stderr ?? ''}`
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => line.trim().length > 0)
    .slice(-VALIDATOR_OUTPUT_LINES);
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export class CommandSiteValidator implements SiteValidator {
  private readonly outputDir: string;

  constructor(private readonly options: CommandSiteValidatorOptions) {
    this.outputDir = options.outputDir ?? 'dist';
  }

  async validate(
    workspaceRoot: string,
    phase: 'preview' | 'full',
  ): Promise<void> {
    if (phase !== 'full') {
      throw new SiteValidationError(
        `CommandSiteValidator only runs the full-build phase, received ${phase}`,
      );
    }

    if (!(await isFile(join(workspaceRoot, 'package.json')))) {
      throw new SiteValidationError('Built site has no package manifest');
    }
    if (!(await isDirectory(join(workspaceRoot, 'src')))) {
      throw new SiteValidationError('Built site has no source directory');
    }

    for (const command of this.options.commands) {
      const label = [command.bin, ...command.args].join(' ');
      this.options.onProgress?.(`Running ${label}`);
      try {
        const { stdout, stderr } = await execFileAsync(
          command.bin,
          command.args,
          {
            cwd: workspaceRoot,
            encoding: 'utf8',
            timeout: this.options.timeoutMs,
            maxBuffer: 8 * 1024 * 1024,
            windowsHide: true,
            env: {
              ...process.env,
              CI: '1',
              // Keep a template's postinstall/telemetry from opening network
              // prompts or writing outside the worktree.
              npm_config_ignore_scripts: 'true',
              ASTRO_TELEMETRY_DISABLED: '1',
              NEXT_TELEMETRY_DISABLED: '1',
            },
          },
        );
        this.options.onOutput?.(label, tailLines(stdout, stderr));
      } catch (error) {
        const failure = error as NodeJS.ErrnoException & {
          stdout?: string;
          stderr?: string;
          killed?: boolean;
        };
        // The output of the command that failed is the whole point of a build
        // log, so it is reported before the error that hides it in a message.
        this.options.onOutput?.(
          label,
          tailLines(failure.stdout ?? '', failure.stderr ?? failure.message),
        );
        if (failure.killed) {
          throw new SiteValidationError(
            `Validation command "${label}" timed out after ${this.options.timeoutMs}ms`,
          );
        }
        const detail = (failure.stderr || failure.stdout || failure.message)
          .toString()
          .trim()
          .slice(-2_000);
        throw new SiteValidationError(
          `Validation command "${label}" failed: ${detail}`,
        );
      }
    }

    if (!(await isDirectory(join(workspaceRoot, this.outputDir)))) {
      throw new SiteValidationError(
        `Build produced no ${this.outputDir}/ output directory`,
      );
    }
  }
}
