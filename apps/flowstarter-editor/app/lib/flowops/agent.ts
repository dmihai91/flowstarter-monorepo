/**
 * FlowOps Agent
 *
 * Base class for autonomous agents that can use tools,
 * communicate with other agents, and maintain conversation context.
 */

import { createScopedLogger } from '~/utils/logger';
import type { ToolResult } from './base-tool';
import { getRegistry } from './registry';
import { getAgentRegistry } from './agent-registry';
import type {
  MessageRole, AgentMessage, AgentConfig, AgentContext,
  AgentResponse, ToolCallRequest, AgentMessageRequest,
} from './agent-types';

// Re-export types and registry for backward compatibility
export type { MessageRole, AgentMessage, AgentConfig, AgentContext, AgentResponse, ToolCallRequest, AgentMessageRequest } from './agent-types';
export { AgentRegistry, getAgentRegistry, resetAgentRegistry } from './agent-registry';

/**
 * Abstract base class for FlowOps agents.
 * Subclasses must implement `process()` for message handling.
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

  /** Process a user message and generate a response. Must be implemented by subclasses. */
  protected abstract process(message: string, context: AgentContext): Promise<AgentResponse>;

  getConfig(): Readonly<AgentConfig> { return this.config; }
  get name(): string { return this.config.name; }
  getHistory(): readonly AgentMessage[] { return this.history; }

  clearHistory(): void {
    this.history = [];
    this.logger.debug('History cleared');
  }

  /** Send a message to this agent and get a response. */
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

  /** Call a tool from the registry. */
  protected async callTool<TInput, TOutput>(
    request: ToolCallRequest,
    context: AgentContext,
  ): Promise<ToolResult<TOutput>> {
    const { tool: toolName, input, options } = request;

    if (this.config.allowedTools && !this.config.allowedTools.includes(toolName)) {
      this.logger.warn(`Tool '${toolName}' is not allowed for this agent`);
      return { success: false, error: `Tool '${toolName}' is not allowed`, errorCode: 'TOOL_NOT_ALLOWED', meta: { tool: toolName, executionId: context.executionId, durationMs: 0, fromCache: false } };
    }

    const tool = context.tools.get<TInput, TOutput>(toolName);
    if (!tool) {
      this.logger.warn(`Tool '${toolName}' not found`);
      return { success: false, error: `Tool '${toolName}' not found`, errorCode: 'TOOL_NOT_FOUND', meta: { tool: toolName, executionId: context.executionId, durationMs: 0, fromCache: false } };
    }

    this.logger.debug(`Calling tool: ${toolName}`);
    const result = await tool.run(input as TInput, { ...options, signal: context.signal, onProgress: context.onProgress });

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

  /** Send a message to another agent. */
  protected async sendToAgent(request: AgentMessageRequest, context: AgentContext): Promise<AgentResponse | null> {
    const { to, content, waitForResponse = true, context: msgContext } = request;

    if (this.config.allowedAgents && !this.config.allowedAgents.includes(to)) {
      this.logger.warn(`Agent '${to}' is not allowed for communication`);
      return null;
    }

    const targetAgent = getAgentRegistry().get(to);
    if (!targetAgent) {
      this.logger.warn(`Agent '${to}' not found`);
      return null;
    }

    const outMessage = this.createMessage('agent', content, { from: this.name, to, metadata: msgContext });
    this.addToHistory(outMessage);
    context.onMessage?.(outMessage);

    if (!waitForResponse) {
      targetAgent.chat(content, { signal: context.signal, onProgress: context.onProgress })
        .catch((err) => this.logger.warn(`Async message to ${to} failed:`, err));
      return null;
    }

    this.logger.debug(`Sending message to agent: ${to}`);
    const response = await targetAgent.chat(content, { signal: context.signal, onProgress: context.onProgress });
    await this.onAgentMessage(to, response.message, context);
    return response;
  }

  protected createMessage(role: MessageRole, content: string, extra?: Partial<AgentMessage>): AgentMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role, content,
      from: role === 'agent' ? this.name : undefined,
      timestamp: Date.now(),
      ...extra,
    };
  }

  /** Called after a tool execution. Override in subclass. */
  protected async onToolResult(_toolName: string, _result: ToolResult<unknown>, _context: AgentContext): Promise<void> {}

  /** Called when receiving a message from another agent. Override in subclass. */
  protected async onAgentMessage(_fromAgent: string, _message: AgentMessage, _context: AgentContext): Promise<void> {}

  private addToHistory(message: AgentMessage): void {
    this.history.push(message);
    const maxLength = this.config.maxHistoryLength ?? 50;
    if (this.history.length > maxLength) {
      this.history = this.history.slice(-maxLength);
    }
  }

  private generateExecutionId(): string {
    return `${this.config.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

