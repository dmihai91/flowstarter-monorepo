/**
 * FlowOps Base Tool
 *
 * Abstract base class for all FlowOps tools.
 * Provides a standardized interface for tool execution, validation, and error handling.
 */

import { createScopedLogger } from '~/utils/logger';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

/**
 * Tool configuration metadata.
 */
export interface ToolConfig {
  /** Unique tool identifier */
  name: string;

  /** Human-readable description */
  description: string;

  /** Tool version (semver) */
  version: string;

  /** Tool category for grouping */
  category?: 'search' | 'browser' | 'code' | 'file' | 'llm' | 'utility';

  /** Whether the tool requires network access */
  requiresNetwork?: boolean;

  /** Maximum execution time in milliseconds */
  timeoutMs?: number;

  /** Whether to cache results */
  cacheable?: boolean;

  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
}

/**
 * Execution context passed to tools.
 */
export interface ToolContext {
  /** Unique execution ID for tracing */
  executionId: string;

  /** Parent execution ID if part of a chain */
  parentExecutionId?: string;

  /** Start timestamp */
  startTime: number;

  /** Environment variables available to the tool */
  env: Record<string, string | undefined>;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Progress callback */
  onProgress?: (message: string, percent?: number) => void;
}

/**
 * Standardized tool execution result.
 */
export interface ToolResult<T = unknown> {
  /** Whether execution succeeded */
  success: boolean;

  /** Result data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: string;

  /** Execution metadata */
  meta: {
    /** Tool name */
    tool: string;

    /** Execution ID */
    executionId: string;

    /** Execution time in milliseconds */
    durationMs: number;

    /** Whether result was from cache */
    fromCache: boolean;

    /** Number of retries (if any) */
    retries?: number;
  };
}

/**
 * Tool execution options.
 */
export interface ExecuteOptions {
  /** Override default timeout */
  timeoutMs?: number;

  /** Number of retries on failure */
  retries?: number;

  /** Delay between retries in milliseconds */
  retryDelayMs?: number;

  /** Skip cache lookup */
  skipCache?: boolean;

  /** Abort signal */
  signal?: AbortSignal;

  /** Progress callback */
  onProgress?: (message: string, percent?: number) => void;
}

/*
 * ============================================================================
 * Base Tool Class
 * ============================================================================
 */

/**
 * Abstract base class for all FlowOps tools.
 *
 * Subclasses must implement:
 * - `execute()`: The main tool logic
 * - `validateInput()`: Input validation
 *
 * Optional overrides:
 * - `getInputSchema()`: JSON schema for input
 * - `getOutputSchema()`: JSON schema for output
 */
export abstract class BaseTool<TInput = unknown, TOutput = unknown> {
  protected readonly logger;
  protected readonly config: ToolConfig;

  // Simple in-memory cache
  private cache: Map<string, { data: TOutput; timestamp: number }> = new Map();

  constructor(config: ToolConfig) {
    this.config = {
      timeoutMs: 30000,
      cacheable: false,
      cacheTtlMs: 3600000, // 1 hour
      ...config,
    };
    this.logger = createScopedLogger(`FlowOps:${config.name}`);
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Abstract methods (must be implemented by subclasses)
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Execute the tool's main logic.
   * This is where subclasses implement their functionality.
   */
  protected abstract execute(input: TInput, context: ToolContext): Promise<TOutput>;

  /**
   * Validate input before execution.
   * Return null if valid, or an error message if invalid.
   */
  protected abstract validateInput(input: TInput): string | null;

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Public API
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get tool configuration.
   */
  getConfig(): Readonly<ToolConfig> {
    return this.config;
  }

  /**
   * Get tool name.
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get tool description.
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * Run the tool with full error handling, caching, and retries.
   */
  async run(input: TInput, options: ExecuteOptions = {}): Promise<ToolResult<TOutput>> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    const context: ToolContext = {
      executionId,
      startTime,
      env: process.env as Record<string, string | undefined>,
      signal: options.signal,
      onProgress: options.onProgress,
    };

    this.logger.info(`Starting execution ${executionId}`);
    options.onProgress?.(`Starting ${this.config.name}...`, 0);

    try {
      // Validate input
      const validationError = this.validateInput(input);

      if (validationError) {
        return this.createErrorResult(executionId, startTime, validationError, 'VALIDATION_ERROR');
      }

      // Check cache
      if (this.config.cacheable && !options.skipCache) {
        const cached = this.getCached(input);

        if (cached) {
          this.logger.info(`Cache hit for execution ${executionId}`);
          return this.createSuccessResult(executionId, startTime, cached, true);
        }
      }

      // Execute with timeout and retries
      const result = await this.executeWithRetries(input, context, options);

      // Cache result
      if (this.config.cacheable && result) {
        this.setCache(input, result);
      }

      options.onProgress?.(`Completed ${this.config.name}`, 100);

      return this.createSuccessResult(executionId, startTime, result, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Execution ${executionId} failed:`, error);

      return this.createErrorResult(executionId, startTime, message, 'EXECUTION_ERROR');
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Optional overrides
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get JSON schema for input validation.
   * Override in subclasses for schema-based validation.
   */
  getInputSchema(): Record<string, unknown> | null {
    return null;
  }

  /**
   * Get JSON schema for output.
   * Override in subclasses for documentation.
   */
  getOutputSchema(): Record<string, unknown> | null {
    return null;
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Private helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async executeWithRetries(input: TInput, context: ToolContext, options: ExecuteOptions): Promise<TOutput> {
    const maxRetries = options.retries ?? 0;
    const retryDelay = options.retryDelayMs ?? 1000;
    const timeout = options.timeoutMs ?? this.config.timeoutMs ?? 30000;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check for cancellation
        if (context.signal?.aborted) {
          throw new Error('Execution cancelled');
        }

        // Execute with timeout
        const result = await Promise.race([this.execute(input, context), this.createTimeout(timeout)]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
        }
      }
    }

    throw lastError ?? new Error('Execution failed');
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateExecutionId(): string {
    return `${this.config.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getCacheKey(input: TInput): string {
    return JSON.stringify(input);
  }

  private getCached(input: TInput): TOutput | null {
    const key = this.getCacheKey(input);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const ttl = this.config.cacheTtlMs ?? 3600000;

    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(input: TInput, data: TOutput): void {
    const key = this.getCacheKey(input);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private createSuccessResult(
    executionId: string,
    startTime: number,
    data: TOutput,
    fromCache: boolean,
  ): ToolResult<TOutput> {
    return {
      success: true,
      data,
      meta: {
        tool: this.config.name,
        executionId,
        durationMs: Date.now() - startTime,
        fromCache,
      },
    };
  }

  private createErrorResult(
    executionId: string,
    startTime: number,
    error: string,
    errorCode: string,
  ): ToolResult<TOutput> {
    return {
      success: false,
      error,
      errorCode,
      meta: {
        tool: this.config.name,
        executionId,
        durationMs: Date.now() - startTime,
        fromCache: false,
      },
    };
  }
}

