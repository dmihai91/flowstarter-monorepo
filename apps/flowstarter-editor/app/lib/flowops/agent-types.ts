/**
 * FlowOps Agent Types
 *
 * Type definitions for the agent framework: messages, configs,
 * contexts, responses, and inter-agent communication.
 */

import type { ToolResult, ExecuteOptions } from './base-tool';
import type { ToolRegistry } from './registry';

/** Message types for agent communication. */
export type MessageRole = 'user' | 'agent' | 'tool' | 'system';

/** A message in the agent conversation. */
export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  from?: string;
  to?: string;
  toolResult?: ToolResult<unknown>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/** Agent configuration. */
export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  systemPrompt?: string;
  maxHistoryLength?: number;
  allowedTools?: string[];
  allowedAgents?: string[];
}

/** Agent execution context. */
export interface AgentContext {
  executionId: string;
  parentAgent?: string;
  history: AgentMessage[];
  tools: ToolRegistry;
  signal?: AbortSignal;
  onProgress?: (message: string, percent?: number) => void;
  onMessage?: (message: AgentMessage) => void;
}

/** Agent response after processing. */
export interface AgentResponse {
  message: AgentMessage;
  complete: boolean;
  toolCalls?: Array<{
    tool: string;
    input: unknown;
    result: ToolResult<unknown>;
  }>;
  agentMessages?: AgentMessage[];
  nextAction?: string;
}

/** Tool call request from agent. */
export interface ToolCallRequest {
  tool: string;
  input: unknown;
  options?: ExecuteOptions;
}

/** Agent-to-agent message request. */
export interface AgentMessageRequest {
  to: string;
  content: string;
  waitForResponse?: boolean;
  context?: Record<string, unknown>;
}
