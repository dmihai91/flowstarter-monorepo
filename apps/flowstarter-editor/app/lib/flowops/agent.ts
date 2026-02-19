/**
 * FlowOps Agent
 *
 * Base class for autonomous agents that can:
 * - Use tools from the registry
 * - Communicate with other agents via messages
 * - Maintain conversation context
 * - Orchestrate multi-step workflows
 *
 * Designed for future extraction as a standalone agent framework.
 */

import { createScopedLogger } from '~/utils/logger';
import { BaseTool, type ToolResult, type ExecuteOptions } from './base-tool';
import { getRegistry, type ToolRegistry } from './registry';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

/**
 * Message types for agent communication.
 */
export type MessageRole = 'user' | 'agent' | 'tool' | 'system';

/**
 * A message in the agent conversation.
 */
export interface AgentMessage {
  /** Unique message ID */
  id: string;

  /** Message role */
  role: MessageRole;

  /** Message content */
  content: string;

  /** Sender agent name (for agent messages) */
  from?: string;

  /** Target agent name (for directed messages) */
  to?: string;

  /** Attached tool result (if any) */
  toolResult?: ToolResult<unknown>;

  /** Message timestamp */
  timestamp: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Agent configuration.
 */
export interface AgentConfig {
  /** Unique agent identifier */
  name: string;

  /** Human-readable description */
  description: string;

  /** Agent version */
  version: string;

  /** System prompt/instructions */
  systemPrompt?: string;

  /** Maximum conversation history to retain */
  maxHistoryLength?: number;

  /** Tools this agent can use (by name) */
  allowedTools?: string[];

  /** Agents this agent can communicate with */
  allowedAgents?: string[];
}

/**
 * Agent execution context.
 */
export interface AgentContext {
  /** Current execution ID */
  executionId: string;

  /** Parent agent (if delegated) */
  parentAgent?: string;

  /** Conversation history */
  history: AgentMessage[];

  /** Available tools */
  tools: ToolRegistry;

  /** Abort signal */
  signal?: AbortSignal;

  /** Progress callback */
  onProgress?: (message: string, percent?: number) => void;

  /** Message callback for streaming */
  onMessage?: (message: AgentMessage) => void;
}

/**
 * Agent response after processing.
 */
export interface AgentResponse {
  /** Response message */
  message: AgentMessage;

  /** Whether the task is complete */
  complete: boolean;

  /** Tool calls made during processing */
  toolCalls?: Array<{
    tool: string;
    input: unknown;
    result: ToolResult<unknown>;
  }>;

  /** Messages sent to other agents */
  agentMessages?: AgentMessage[];

  /** Next suggested action (if not complete) */
  nextAction?: string;
}

/**
 * Tool call request from agent.
 */
export interface ToolCallRequest {
  /** Tool name */
  tool: string;

  /** Tool input */
  input: unknown;

  /** Execution options */
  options?: ExecuteOptions;
}

/**
 * Agent-to-agent message request.
 */
export interface AgentMessageRequest {
  /** Target agent name */
  to: string;

  /** Message content */
  content: string;

  /** Whether to wait for response */
  waitForResponse?: boolean;

  /** Additional context */
  context?: Record<string, unknown>;
}

/*
 * ============================================================================
 * Base Agent Class
 * ============================================================================
 */

/**
 * Abstract base class for FlowOps agents.
 *
 * Agents are autonomous units that can:
 * - Process user messages
 * - Call tools from the registry
 * - Communicate with other agents
 * - Maintain conversation state
 *
 * Subclasses must implement:
 * - `process()`: Main message processing logic
 *
 * Optional overrides:
 * - `onToolResult()`: Handle tool execution results
 * - `onAgentMessage()`: Handle messages from other agents
 * - `onError()`: Custom error handling
 */
export abstract class BaseAgent {
  protected readonly logger;
  protected readonly config: AgentConfig;
  protected history: AgentMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = {
      maxHistoryLength: 50,
      ...config,
    };
    this.logger = createScopedLogger(`FlowOps:Agent:${config.name}`);
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Abstract methods (must be implemented by subclasses)
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Process a user message and generate a response.
   * This is the main entry point for agent logic.
   */
  protected abstract process(message: string, context: AgentContext): Promise<AgentResponse>;

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Public API
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get agent configuration.
   */
  getConfig(): Readonly<AgentConfig> {
    return this.config;
  }

  /**
   * Get agent name.
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get conversation history.
   */
  getHistory(): readonly AgentMessage[] {
    return this.history;
  }

  /**
   * Clear conversation history.
   */
  clearHistory(): void {
    this.history = [];
    this.logger.debug('History cleared');
  }

  /**
   * Send a message to this agent and get a response.
   */
  async chat(
    message: string,
    options: {
      signal?: AbortSignal;
      onProgress?: (message: string, percent?: number) => void;
      onMessage?: (message: AgentMessage) => void;
    } = {},
  ): Promise<AgentResponse> {
    const executionId = this.generateExecutionId();
    this.logger.info(`Starting chat ${executionId}`);

    // Add user message to history
    const userMessage = this.createMessage('user', message);
    this.addToHistory(userMessage);
    options.onMessage?.(userMessage);

    // Create execution context
    const context: AgentContext = {
      executionId,
      history: [...this.history],
      tools: getRegistry(),
      signal: options.signal,
      onProgress: options.onProgress,
      onMessage: options.onMessage,
    };

    try {
      // Process the message
      const response = await this.process(message, context);

      // Add agent response to history
      this.addToHistory(response.message);
      options.onMessage?.(response.message);

      this.logger.info(`Chat ${executionId} complete`);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Chat ${executionId} failed:`, error);

      // Create error response
      const errorResponse = this.createMessage('agent', `Error: ${errorMessage}`);
      this.addToHistory(errorResponse);

      return {
        message: errorResponse,
        complete: false,
        nextAction: 'retry',
      };
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Protected helpers for subclasses
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Call a tool from the registry.
   */
  protected async callTool<TInput, TOutput>(
    request: ToolCallRequest,
    context: AgentContext,
  ): Promise<ToolResult<TOutput>> {
    const { tool: toolName, input, options } = request;

    // Check if tool is allowed
    if (this.config.allowedTools && !this.config.allowedTools.includes(toolName)) {
      this.logger.warn(`Tool '${toolName}' is not allowed for this agent`);
      return {
        success: false,
        error: `Tool '${toolName}' is not allowed`,
        errorCode: 'TOOL_NOT_ALLOWED',
        meta: {
          tool: toolName,
          executionId: context.executionId,
          durationMs: 0,
          fromCache: false,
        },
      };
    }

    // Get tool from registry
    const tool = context.tools.get<TInput, TOutput>(toolName);

    if (!tool) {
      this.logger.warn(`Tool '${toolName}' not found`);
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
        errorCode: 'TOOL_NOT_FOUND',
        meta: {
          tool: toolName,
          executionId: context.executionId,
          durationMs: 0,
          fromCache: false,
        },
      };
    }

    // Execute tool
    this.logger.debug(`Calling tool: ${toolName}`);

    const result = await tool.run(input as TInput, {
      ...options,
      signal: context.signal,
      onProgress: context.onProgress,
    });

    // Create tool message
    const toolMessage = this.createMessage(
      'tool',
      result.success ? 'Tool execution successful' : `Tool error: ${result.error}`,
      { toolResult: result },
    );
    this.addToHistory(toolMessage);
    context.onMessage?.(toolMessage);

    // Call hook
    await this.onToolResult(toolName, result, context);

    return result as ToolResult<TOutput>;
  }

  /**
   * Send a message to another agent.
   */
  protected async sendToAgent(request: AgentMessageRequest, context: AgentContext): Promise<AgentResponse | null> {
    const { to, content, waitForResponse = true, context: msgContext } = request;

    // Check if agent is allowed
    if (this.config.allowedAgents && !this.config.allowedAgents.includes(to)) {
      this.logger.warn(`Agent '${to}' is not allowed for communication`);
      return null;
    }

    // Get target agent from registry
    const targetAgent = getAgentRegistry().get(to);

    if (!targetAgent) {
      this.logger.warn(`Agent '${to}' not found`);
      return null;
    }

    // Create outgoing message
    const outMessage = this.createMessage('agent', content, {
      from: this.name,
      to,
      metadata: msgContext,
    });
    this.addToHistory(outMessage);
    context.onMessage?.(outMessage);

    if (!waitForResponse) {
      // Fire and forget
      targetAgent
        .chat(content, {
          signal: context.signal,
          onProgress: context.onProgress,
        })
        .catch((err) => this.logger.warn(`Async message to ${to} failed:`, err));
      return null;
    }

    // Wait for response
    this.logger.debug(`Sending message to agent: ${to}`);

    const response = await targetAgent.chat(content, {
      signal: context.signal,
      onProgress: context.onProgress,
    });

    // Call hook
    await this.onAgentMessage(to, response.message, context);

    return response;
  }

  /**
   * Create a new message.
   */
  protected createMessage(role: MessageRole, content: string, extra?: Partial<AgentMessage>): AgentMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      from: role === 'agent' ? this.name : undefined,
      timestamp: Date.now(),
      ...extra,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Optional hooks for subclasses
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Called after a tool execution.
   * Override to handle tool results.
   */
  protected async onToolResult(_toolName: string, _result: ToolResult<unknown>, _context: AgentContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Called when receiving a message from another agent.
   * Override to handle inter-agent communication.
   */
  protected async onAgentMessage(_fromAgent: string, _message: AgentMessage, _context: AgentContext): Promise<void> {
    // Override in subclass
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Private helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private addToHistory(message: AgentMessage): void {
    this.history.push(message);

    // Trim history if needed
    const maxLength = this.config.maxHistoryLength ?? 50;

    if (this.history.length > maxLength) {
      this.history = this.history.slice(-maxLength);
    }
  }

  private generateExecutionId(): string {
    return `${this.config.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/*
 * ============================================================================
 * Agent Registry
 * ============================================================================
 */

/**
 * Registry for agent discovery and communication.
 */
export class AgentRegistry {
  private static instance: AgentRegistry | null = null;
  private agents: Map<string, BaseAgent> = new Map();
  private logger = createScopedLogger('FlowOps:AgentRegistry');

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }

    return AgentRegistry.instance;
  }

  static reset(): void {
    AgentRegistry.instance = null;
  }

  private constructor() {}

  /**
   * Register an agent.
   */
  register(agent: BaseAgent): void {
    const name = agent.name;

    if (this.agents.has(name)) {
      this.logger.warn(`Agent '${name}' already registered, replacing...`);
    }

    this.agents.set(name, agent);
    this.logger.info(`Registered agent: ${name}`);
  }

  /**
   * Unregister an agent.
   */
  unregister(name: string): boolean {
    const removed = this.agents.delete(name);

    if (removed) {
      this.logger.info(`Unregistered agent: ${name}`);
    }

    return removed;
  }

  /**
   * Get an agent by name.
   */
  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents.
   */
  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent names.
   */
  getNames(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent is registered.
   */
  has(name: string): boolean {
    return this.agents.has(name);
  }

  /**
   * Send a message to an agent.
   */
  async send(agentName: string, message: string, options?: Parameters<BaseAgent['chat']>[1]): Promise<AgentResponse> {
    const agent = this.get(agentName);

    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    return agent.chat(message, options);
  }

  /**
   * Broadcast a message to all agents.
   */
  async broadcast(message: string, options?: Parameters<BaseAgent['chat']>[1]): Promise<Map<string, AgentResponse>> {
    const results = new Map<string, AgentResponse>();
    const agents = this.getAll();

    await Promise.all(
      agents.map(async (agent) => {
        try {
          const response = await agent.chat(message, options);
          results.set(agent.name, response);
        } catch (error) {
          this.logger.error(`Broadcast to ${agent.name} failed:`, error);
        }
      }),
    );

    return results;
  }
}

/**
 * Get the global agent registry.
 */
export function getAgentRegistry(): AgentRegistry {
  return AgentRegistry.getInstance();
}

/**
 * Reset the global agent registry (for testing).
 */
export function resetAgentRegistry(): void {
  AgentRegistry.reset();
}

