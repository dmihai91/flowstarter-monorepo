/**
 * FlowOps Tool Registry
 *
 * Central registry for tool discovery, registration, and management.
 * Implements singleton pattern for global access.
 */

import { BaseTool, type ToolConfig } from './base-tool';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FlowOps:Registry');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

/**
 * Tool metadata for discovery.
 */
export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  category?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/**
 * Registry statistics.
 */
export interface RegistryStats {
  totalTools: number;
  toolsByCategory: Record<string, number>;
  registeredAt: Date;
}

/*
 * ============================================================================
 * Tool Registry
 * ============================================================================
 */

/**
 * Central registry for FlowOps tools.
 *
 * Features:
 * - Tool registration and discovery
 * - Category-based filtering
 * - Singleton pattern for global access
 */
export class ToolRegistry {
  private static instance: ToolRegistry | null = null;

  private tools: Map<string, BaseTool<unknown, unknown>> = new Map();
  private registeredAt: Date = new Date();

  /**
   * Get the singleton instance.
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
      logger.info('FlowOps ToolRegistry initialized');
    }

    return ToolRegistry.instance;
  }

  /**
   * Reset the singleton (for testing).
   */
  static reset(): void {
    ToolRegistry.instance = null;
  }

  /**
   * Private constructor (use getInstance).
   */
  private constructor() {}

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Registration
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Register a tool.
   */
  register<TInput, TOutput>(tool: BaseTool<TInput, TOutput>): void {
    const name = tool.name;

    if (this.tools.has(name)) {
      logger.warn(`Tool '${name}' is already registered, replacing...`);
    }

    this.tools.set(name, tool as BaseTool<unknown, unknown>);
    logger.info(`Registered tool: ${name}`);
  }

  /**
   * Unregister a tool.
   */
  unregister(name: string): boolean {
    const removed = this.tools.delete(name);

    if (removed) {
      logger.info(`Unregistered tool: ${name}`);
    }

    return removed;
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Discovery
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get a tool by name.
   */
  get<TInput = unknown, TOutput = unknown>(name: string): BaseTool<TInput, TOutput> | undefined {
    return this.tools.get(name) as BaseTool<TInput, TOutput> | undefined;
  }

  /**
   * Get all registered tools.
   */
  getAll(): BaseTool<unknown, unknown>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category.
   */
  getByCategory(category: string): BaseTool<unknown, unknown>[] {
    return this.getAll().filter((tool) => tool.getConfig().category === category);
  }

  /**
   * Get all tool names.
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get metadata for all tools.
   */
  getMetadata(): ToolMetadata[] {
    return this.getAll().map((tool) => {
      const config = tool.getConfig();
      return {
        name: config.name,
        description: config.description,
        version: config.version,
        category: config.category,
        inputSchema: tool.getInputSchema() ?? undefined,
        outputSchema: tool.getOutputSchema() ?? undefined,
      };
    });
  }

  /**
   * Get registry statistics.
   */
  getStats(): RegistryStats {
    const tools = this.getAll();
    const toolsByCategory: Record<string, number> = {};

    for (const tool of tools) {
      const category = tool.getConfig().category ?? 'uncategorized';
      toolsByCategory[category] = (toolsByCategory[category] ?? 0) + 1;
    }

    return {
      totalTools: tools.length,
      toolsByCategory,
      registeredAt: this.registeredAt,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Execution helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Run a tool by name.
   */
  async run<TInput, TOutput>(
    name: string,
    input: TInput,
    options?: Parameters<BaseTool<TInput, TOutput>['run']>[1],
  ): Promise<ReturnType<BaseTool<TInput, TOutput>['run']>> {
    const tool = this.get<TInput, TOutput>(name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry`);
    }

    return tool.run(input, options);
  }

  /**
   * Clear all tool caches.
   */
  clearAllCaches(): void {
    for (const tool of this.tools.values()) {
      tool.clearCache();
    }
    logger.info('Cleared all tool caches');
  }
}

/*
 * ============================================================================
 * Convenience export
 * ============================================================================
 */

/**
 * Get the global tool registry instance.
 */
export function getRegistry(): ToolRegistry {
  return ToolRegistry.getInstance();
}

/**
 * Reset the global tool registry (for testing).
 */
export function resetRegistry(): void {
  ToolRegistry.reset();
}

