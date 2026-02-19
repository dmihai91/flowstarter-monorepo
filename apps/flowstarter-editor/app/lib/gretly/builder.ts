/**
 * Gretly Builder - Low-level Build Orchestrator
 *
 * Handles the build, typecheck, and self-healing workflow.
 * Used internally by the main Gretly orchestrator, or standalone
 * for simpler build-only scenarios.
 *
 * Features:
 * - Fast typecheck before build
 * - Build execution with self-healing loop
 * - Error detection and parsing
 * - Self-healing via FixerAgent (from FlowOps)
 */

import { getAgentRegistry } from '~/lib/flowops';
import { getFixerAgent } from '~/lib/flowstarter/agents/fixer-agent';
import { createScopedLogger } from '~/utils/logger';
import { TypeCheckResultSchema, type BuildErrorDTO, type TypeCheckResultDTO } from '~/lib/flowops/schema';

const logger = createScopedLogger('Gretly:Builder');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export type GretlyPhase =
  | 'idle'
  | 'typecheck'
  | 'build'
  | 'error-detected'
  | 'fixing'
  | 'retrying'
  | 'success'
  | 'failed';

export interface GretlyConfig {
  /** Maximum self-healing attempts */
  maxAttempts?: number;

  /** Enable fast typecheck before build */
  enableTypecheck?: boolean;

  /** Timeout for typecheck in ms */
  typecheckTimeoutMs?: number;

  /** Timeout for build in ms */
  buildTimeoutMs?: number;

  /** Progress callback */
  onProgress?: (phase: GretlyPhase, message: string, progress?: number) => void;

  /** Error callback */
  onError?: (error: BuildErrorDTO) => void;

  /** Fix callback */
  onFix?: (file: string, summary: string) => void;
}

export interface GretlyResult {
  success: boolean;
  files: Record<string, string>;
  fixAttempts: number;
  typecheckResult?: TypeCheckResultDTO;
  buildError?: BuildErrorDTO;
  error?: string;
  phases: GretlyPhase[];
}

export interface BuildResult {
  success: boolean;
  error?: string;
  buildError?: BuildErrorDTO;
  previewUrl?: string;
  sandboxId?: string;
}

/*
 * ============================================================================
 * Gretly Builder
 * ============================================================================
 */

/**
 * Gretly Builder - Low-level Build Orchestrator
 *
 * Coordinates typecheck, build, error detection, and self-healing.
 */
export class Gretly {
  private config: Required<Omit<GretlyConfig, 'onProgress' | 'onError' | 'onFix'>> & GretlyConfig;
  private currentPhase: GretlyPhase = 'idle';
  private phases: GretlyPhase[] = [];

  constructor(config: GretlyConfig = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      enableTypecheck: config.enableTypecheck ?? true,
      typecheckTimeoutMs: config.typecheckTimeoutMs ?? 30000,
      buildTimeoutMs: config.buildTimeoutMs ?? 120000,
      ...config,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Public API
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get current phase.
   */
  getPhase(): GretlyPhase {
    return this.currentPhase;
  }

  /**
   * Run typecheck only (fast, no build).
   */
  async typecheck(files: Record<string, string>): Promise<TypeCheckResultDTO> {
    this.setPhase('typecheck');
    this.config.onProgress?.('typecheck', 'Running TypeScript check...', 0);

    const startTime = Date.now();

    try {
      // Parse TypeScript files and check for obvious errors
      const errors: TypeCheckResultDTO['errors'] = [];

      for (const [path, content] of Object.entries(files)) {
        if (!path.match(/\.(ts|tsx)$/)) {
          continue;
        }

        // Quick syntax checks
        const syntaxErrors = this.quickSyntaxCheck(path, content);
        errors.push(...syntaxErrors);
      }

      const result: TypeCheckResultDTO = {
        success: errors.length === 0,
        errors,
        duration: Date.now() - startTime,
      };

      // Validate against schema
      const validation = TypeCheckResultSchema.safeParse(result);

      if (!validation.success) {
        logger.warn('TypeCheck result failed schema validation:', validation.error);
      }

      this.config.onProgress?.(
        'typecheck',
        errors.length === 0 ? 'TypeScript check passed' : `Found ${errors.length} type errors`,
        100,
      );

      return result;
    } catch (error) {
      logger.error('Typecheck failed:', error);
      return {
        success: false,
        errors: [
          {
            file: 'unknown',
            line: 0,
            column: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run build with self-healing.
   * This is the main entry point for the build orchestration flow.
   */
  async buildWithSelfHealing(
    projectId: string,
    initialFiles: Record<string, string>,
    buildFn: (projectId: string, files: Record<string, string>) => Promise<BuildResult>,
  ): Promise<GretlyResult> {
    this.phases = [];

    let files = { ...initialFiles };
    let attempt = 0;
    let lastBuildError: BuildErrorDTO | undefined;
    let typecheckResult: TypeCheckResultDTO | undefined;

    logger.info(`Starting build with self-healing for project ${projectId}`);

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * Phase 1: Fast typecheck (optional)
     * ─────────────────────────────────────────────────────────────────────────
     */
    if (this.config.enableTypecheck) {
      typecheckResult = await this.typecheck(files);

      if (!typecheckResult.success && typecheckResult.errors.length > 0) {
        // Try to fix type errors before build
        for (const error of typecheckResult.errors.slice(0, 3)) {
          const fixed = await this.fixError(
            {
              file: error.file,
              line: String(error.line),
              message: error.message,
              fullOutput: `TypeScript error at ${error.file}:${error.line}:${error.column}\n${error.message}`,
              type: 'type',
            },
            files,
          );

          if (fixed) {
            files = fixed;
            attempt++;
          }
        }
      }
    }

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * Phase 2: Build loop with self-healing
     * ─────────────────────────────────────────────────────────────────────────
     */
    while (attempt <= this.config.maxAttempts) {
      this.setPhase('build');
      this.config.onProgress?.(
        'build',
        attempt === 0 ? 'Starting build...' : `Retrying build (attempt ${attempt}/${this.config.maxAttempts})...`,
        10 + attempt * 20,
      );

      const buildResult = await buildFn(projectId, files);

      // Success!
      if (buildResult.success) {
        this.setPhase('success');
        this.config.onProgress?.(
          'success',
          attempt > 0 ? `Build succeeded after ${attempt} fix(es)` : 'Build succeeded',
          100,
        );

        return {
          success: true,
          files,
          fixAttempts: attempt,
          typecheckResult,
          phases: this.phases,
        };
      }

      // No build error info - can't self-heal
      if (!buildResult.buildError) {
        this.setPhase('failed');
        logger.warn('Build failed without structured error info');
        logger.warn('Build result:', JSON.stringify(buildResult, null, 2).slice(0, 500));

        return {
          success: false,
          files,
          fixAttempts: attempt,
          typecheckResult,
          error: buildResult.error || 'Build failed without error details',
          phases: this.phases,
        };
      }

      // Max attempts reached
      if (attempt >= this.config.maxAttempts) {
        this.setPhase('failed');
        this.config.onProgress?.('failed', `Build failed after ${this.config.maxAttempts} fix attempts`, 100);

        return {
          success: false,
          files,
          fixAttempts: attempt,
          typecheckResult,
          buildError: buildResult.buildError,
          error: buildResult.error,
          phases: this.phases,
        };
      }

      // Attempt to fix
      lastBuildError = buildResult.buildError;
      this.setPhase('error-detected');
      logger.warn('Build error details:', {
          file: lastBuildError.file,
          line: lastBuildError.line,
          message: lastBuildError.message?.slice(0, 200),
          fullOutput: lastBuildError.fullOutput?.slice(0, 500),
        });
      this.config.onError?.(lastBuildError);
      this.config.onProgress?.(
        'error-detected',
        `Error in ${lastBuildError.file}: ${lastBuildError.message.slice(0, 50)}...`,
        50,
      );

      const fixedFiles = await this.fixError(lastBuildError, files);

      if (!fixedFiles) {
        this.setPhase('failed');
        logger.warn('Fix attempt returned no changes');

        return {
          success: false,
          files,
          fixAttempts: attempt + 1,
          typecheckResult,
          buildError: lastBuildError,
          error: 'Self-healing could not fix the error',
          phases: this.phases,
        };
      }

      files = fixedFiles;
      attempt++;
      this.setPhase('retrying');
    }

    // Should not reach here, but just in case
    this.setPhase('failed');

    return {
      success: false,
      files,
      fixAttempts: attempt,
      typecheckResult,
      buildError: lastBuildError,
      error: 'Max attempts exceeded',
      phases: this.phases,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Private helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private setPhase(phase: GretlyPhase): void {
    this.currentPhase = phase;
    this.phases.push(phase);
    logger.debug(`Phase: ${phase}`);
  }

  /**
   * Quick syntax check for TypeScript files.
   * This is a fast heuristic check, not a full TypeScript compilation.
   */
  private quickSyntaxCheck(path: string, content: string): TypeCheckResultDTO['errors'] {
    const errors: TypeCheckResultDTO['errors'] = [];

    // Check bracket balance
    const opens = (content.match(/[{[(]/g) || []).length;
    const closes = (content.match(/[}\])]/g) || []).length;

    if (Math.abs(opens - closes) > 2) {
      errors.push({
        file: path,
        line: 1,
        column: 1,
        message: `Unbalanced brackets: ${opens} opens, ${closes} closes`,
        code: 'TS1005',
      });
    }

    // Check for common TypeScript errors
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Missing semicolon after import (common in Astro)
      if (line.match(/^import .+ from ['"][^'"]+['"]$/) && !line.endsWith(';')) {
        // This is actually valid in TypeScript, skip
      }

      // Obvious syntax errors
      if (line.match(/^\s*}\s*else\s*$/)) {
        errors.push({
          file: path,
          line: i + 1,
          column: 1,
          message: 'Expected { after else',
          code: 'TS1005',
        });
      }
    }

    return errors;
  }

  /**
   * Fix an error using the FixerAgent from FlowOps.
   */
  private async fixError(error: BuildErrorDTO, files: Record<string, string>): Promise<Record<string, string> | null> {
    this.setPhase('fixing');
    this.config.onProgress?.('fixing', `Fixing ${error.file}...`, 60);

    // Find the file content
    const pathVariations = [
      error.file,
      `/${error.file}`,
      error.file.replace(/^\//, ''),
      `src/${error.file}`,
      `/src/${error.file}`,
    ];

    let fileContent: string | undefined;
    let foundPath: string | undefined;

    for (const path of pathVariations) {
      if (files[path]) {
        fileContent = files[path];
        foundPath = path;
        break;
      }
    }

    // Try basename match
    if (!fileContent && error.file) {
      const basename = error.file.split('/').pop();

      if (basename) {
        for (const [path, content] of Object.entries(files)) {
          if (path.endsWith(basename)) {
            fileContent = content;
            foundPath = path;
            break;
          }
        }
      }
    }

    if (!fileContent || !foundPath) {
      logger.error(`Cannot find file ${error.file} in project`);
      return null;
    }

    // Call FixerAgent via FlowOps
    try {
      // Ensure agent is registered
      const agentRegistry = getAgentRegistry();

      if (!agentRegistry.has('fixer')) {
        agentRegistry.register(getFixerAgent());
      }

      const response = await agentRegistry.send(
        'fixer',
        JSON.stringify({
          file: foundPath,
          content: fileContent,
          error: error.message,
          line: parseInt(error.line, 10) || undefined,
          fullOutput: error.fullOutput,
        }),
      );

      // Parse response
      const result = JSON.parse(response.message.content);

      if (!result.success || !result.fixedContent) {
        logger.warn('FixerAgent failed:', result.error);
        return null;
      }

      logger.info(`Fixed ${foundPath}: ${result.summary}`);
      this.config.onFix?.(foundPath, result.summary);

      return {
        ...files,
        [foundPath]: result.fixedContent,
      };
    } catch (err) {
      logger.error('FixerAgent call failed:', err);
      return null;
    }
  }
}

/*
 * ============================================================================
 * Convenience export
 * ============================================================================
 */

/**
 * Create a new Gretly Builder instance with default config.
 */
export function createGretly(config?: GretlyConfig): Gretly {
  return new Gretly(config);
}

