/**
 * FlowOps Schema Validation
 *
 * Uses Zod for runtime validation of agent-to-agent and agent-to-tool communication.
 * All messages between agents and tools must conform to their declared schemas.
 */

import { z } from 'zod';

/*
 * ============================================================================
 * Base Schemas
 * ============================================================================
 */

/**
 * Base schema for all FlowOps messages.
 */
export const FlowOpsMessageSchema = z.object({
  /** Unique message ID */
  id: z.string(),

  /** Message type identifier */
  type: z.string(),

  /** ISO timestamp */
  timestamp: z.string().datetime(),

  /** Source agent/tool name */
  from: z.string(),

  /** Target agent/tool name (optional for broadcasts) */
  to: z.string().optional(),

  /** Correlation ID for request-response matching */
  correlationId: z.string().optional(),

  /** Message payload */
  payload: z.unknown(),
});

export type FlowOpsMessage = z.infer<typeof FlowOpsMessageSchema>;

/**
 * Tool input/output schema wrapper.
 */
export interface ToolSchema<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  input: z.ZodType<TInput>;
  output: z.ZodType<TOutput>;
}

/**
 * Agent message schema wrapper.
 */
export interface AgentMessageSchema<T> {
  type: string;
  description: string;
  payload: z.ZodSchema<T>;
}

/*
 * ============================================================================
 * Search Tool Schemas
 * ============================================================================
 */

export const SearchInputSchema = z.object({
  query: z.string().min(1).max(400),
  searchDepth: z.enum(['basic', 'advanced']).default('basic'),
  includeDomains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  maxResults: z.number().int().min(1).max(20).default(5),
  includeRawContent: z.boolean().default(false),
  includeAnswer: z.boolean().default(false),
});

export type SearchInputDTO = z.infer<typeof SearchInputSchema>;

export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  content: z.string(),
  score: z.number().min(0).max(1),
  rawContent: z.string().optional(),
});

export const SearchOutputSchema = z.object({
  query: z.string(),
  results: z.array(SearchResultSchema),
  answer: z.string().optional(),
  totalResults: z.number(),
  responseTimeMs: z.number(),
});

export type SearchOutputDTO = z.infer<typeof SearchOutputSchema>;

export const SearchToolSchema = {
  name: 'search',
  description: 'Web search using Tavily API for error solutions and documentation',
  input: SearchInputSchema,
  output: SearchOutputSchema,
} as const;

/*
 * ============================================================================
 * Self-Healing Tool Schemas
 * ============================================================================
 */

export const SelfHealingInputSchema = z.object({
  content: z.string().min(1),
  file: z.string().min(1),
  errorMessage: z.string().min(1),
  line: z.number().int().positive().optional(),
  errorType: z.enum(['syntax', 'type', 'runtime', 'dependency', 'css', 'unknown']).optional(),
  framework: z.enum(['astro', 'react', 'vue', 'svelte']).optional(),
  fullOutput: z.string().optional(),
  enableTiers: z
    .object({
      rule: z.boolean().default(true),
      search: z.boolean().default(true),
      llm: z.boolean().default(true),
    })
    .optional(),
  maxLLMAttempts: z.number().int().min(1).max(5).default(2),
});

export type SelfHealingInputDTO = z.infer<typeof SelfHealingInputSchema>;

export const SelfHealingOutputSchema = z.object({
  fixed: z.boolean(),
  fixedContent: z.string().optional(),
  summary: z.string().optional(),
  tier: z.enum(['rule', 'search', 'llm', 'none']),
  attempts: z.number().int(),
  searchContext: SearchOutputSchema.optional(),
});

export type SelfHealingOutputDTO = z.infer<typeof SelfHealingOutputSchema>;

export const SelfHealingToolSchema = {
  name: 'self-healing',
  description: 'Three-tier self-healing for build errors (rule → search → LLM)',
  input: SelfHealingInputSchema,
  output: SelfHealingOutputSchema,
} as const;

/*
 * ============================================================================
 * Fixer Agent Schemas
 * ============================================================================
 */

export const FixerRequestSchema = z.object({
  file: z.string().min(1),
  content: z.string().min(1),
  error: z.string().min(1),
  line: z.number().int().positive().optional(),
  fullOutput: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type FixerRequestDTO = z.infer<typeof FixerRequestSchema>;

export const FixerResponseSchema = z.object({
  success: z.boolean(),
  fixedContent: z.string().optional(),
  summary: z.string().optional(),
  tier: z.enum(['rule', 'search', 'llm', 'none']),
  attempts: z.number().int(),
  error: z.string().optional(),
});

export type FixerResponseDTO = z.infer<typeof FixerResponseSchema>;

export const FixerAgentSchema: AgentMessageSchema<FixerRequestDTO> = {
  type: 'fixer.request',
  description: 'Request to fix a build error in a file',
  payload: FixerRequestSchema,
};

/*
 * ============================================================================
 * Build Error Detection Schemas
 * ============================================================================
 */

export const BuildErrorSchema = z.object({
  file: z.string(),
  line: z.string(),
  message: z.string(),
  fullOutput: z.string(),
  type: z.enum(['syntax', 'type', 'runtime', 'dependency', 'css', 'unknown']).optional(),
});

export type BuildErrorDTO = z.infer<typeof BuildErrorSchema>;

export const TypeCheckResultSchema = z.object({
  success: z.boolean(),
  errors: z.array(
    z.object({
      file: z.string(),
      line: z.number(),
      column: z.number(),
      message: z.string(),
      code: z.string().optional(),
    }),
  ),
  duration: z.number(),
});

export type TypeCheckResultDTO = z.infer<typeof TypeCheckResultSchema>;

/*
 * ============================================================================
 * Schema Registry
 * ============================================================================
 */

/**
 * Registry of all FlowOps schemas for validation.
 */
export const SchemaRegistry = {
  tools: {
    search: SearchToolSchema,
    'self-healing': SelfHealingToolSchema,
  },
  agents: {
    fixer: FixerAgentSchema,
  },
} as const;

/**
 * Validate input against a tool's input schema.
 */
export function validateToolInput<T>(
  toolName: keyof typeof SchemaRegistry.tools,
  input: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const schema = SchemaRegistry.tools[toolName];

  if (!schema) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  const result = schema.input.safeParse(input);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data as T };
}

/**
 * Validate output against a tool's output schema.
 */
export function validateToolOutput<T>(
  toolName: keyof typeof SchemaRegistry.tools,
  output: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const schema = SchemaRegistry.tools[toolName];

  if (!schema) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  const result = schema.output.safeParse(output);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data as T };
}

/**
 * Validate an agent message payload.
 */
export function validateAgentMessage<T>(
  agentName: keyof typeof SchemaRegistry.agents,
  payload: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const schema = SchemaRegistry.agents[agentName];

  if (!schema) {
    return { success: false, error: `Unknown agent: ${agentName}` };
  }

  const result = schema.payload.safeParse(payload);

  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data as T };
}

