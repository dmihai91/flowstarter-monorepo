/**
 * FlowOps - Agent & Tool Communication Protocol
 *
 * A generic, open-sourceable framework for agent-to-agent and agent-to-tool communication.
 * Designed to be extracted as a standalone package in the future.
 *
 * Key concepts:
 * - BaseTool: Abstract base class for all tools
 * - BaseAgent: Abstract base class for autonomous agents
 * - ToolRegistry: Central registry for tool discovery
 * - AgentRegistry: Central registry for agent communication
 * - ToolContext: Execution context passed to tools
 * - AgentContext: Execution context passed to agents
 * - Schemas: Zod-based validation for message passing
 *
 * Architecture:
 * FlowOps is the PROTOCOL layer - it defines how agents and tools communicate.
 * Application-specific agents and tools should be in ~/lib/flowstarter.
 *
 * Usage:
 * ```typescript
 * import { BaseAgent, BaseTool, getRegistry, getAgentRegistry } from '~/lib/flowops';
 *
 * // Extend base classes for your agents/tools
 * class MyAgent extends BaseAgent { ... }
 * class MyTool extends BaseTool { ... }
 *
 * // Register and communicate
 * const agentRegistry = getAgentRegistry();
 * agentRegistry.register(myAgent);
 * const response = await agentRegistry.send('my-agent', 'message');
 * ```
 */

/*
 * ============================================================================
 * Core Framework - Base Classes
 * ============================================================================
 */

export { BaseTool, type ToolConfig, type ToolResult, type ToolContext, type ExecuteOptions } from './base-tool';

export { ToolRegistry, getRegistry, resetRegistry, type ToolMetadata, type RegistryStats } from './registry';

export {
  BaseAgent,
  AgentRegistry,
  getAgentRegistry,
  resetAgentRegistry,
  type AgentConfig,
  type AgentContext,
  type AgentMessage,
  type AgentResponse,
  type MessageRole,
  type ToolCallRequest,
  type AgentMessageRequest,
} from './agent';

/*
 * ============================================================================
 * Schemas - Zod validation for agent-tool communication
 * ============================================================================
 */

export {
  // Base schemas
  FlowOpsMessageSchema,
  type FlowOpsMessage,
  type ToolSchema,
  type AgentMessageSchema,

  // Tool schemas (generic, can be used by any tool implementation)
  SearchInputSchema,
  SearchOutputSchema,
  SearchToolSchema,
  type SearchInputDTO,
  type SearchOutputDTO,
  SelfHealingInputSchema,
  SelfHealingOutputSchema,
  SelfHealingToolSchema,
  type SelfHealingInputDTO,
  type SelfHealingOutputDTO,

  // Agent schemas (generic schemas that can be reused)
  FixerRequestSchema,
  FixerResponseSchema,
  FixerAgentSchema,
  type FixerRequestDTO,
  type FixerResponseDTO,

  // Build error schemas
  BuildErrorSchema,
  TypeCheckResultSchema,
  type BuildErrorDTO,
  type TypeCheckResultDTO,

  // Schema registry and validation
  SchemaRegistry,
  validateToolInput,
  validateToolOutput,
  validateAgentMessage,
} from './schema';

