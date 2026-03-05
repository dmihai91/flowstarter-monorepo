/**
 * FlowOps Agent Registry
 *
 * Registry for agent discovery and communication.
 * Singleton pattern for managing registered agents.
 */

import { createScopedLogger } from '~/utils/logger';
import type { BaseAgent } from './agent';
import type { AgentResponse } from './agent-types';

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

  register(agent: BaseAgent): void {
    const name = agent.name;
    if (this.agents.has(name)) {
      this.logger.warn(`Agent '${name}' already registered, replacing...`);
    }
    this.agents.set(name, agent);
    this.logger.info(`Registered agent: ${name}`);
  }

  unregister(name: string): boolean {
    const removed = this.agents.delete(name);
    if (removed) {
      this.logger.info(`Unregistered agent: ${name}`);
    }
    return removed;
  }

  get(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getNames(): string[] {
    return Array.from(this.agents.keys());
  }

  has(name: string): boolean {
    return this.agents.has(name);
  }

  async send(agentName: string, message: string, options?: Parameters<BaseAgent['chat']>[1]): Promise<AgentResponse> {
    const agent = this.get(agentName);
    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }
    return agent.chat(message, options);
  }

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

/** Get the global agent registry. */
export function getAgentRegistry(): AgentRegistry {
  return AgentRegistry.getInstance();
}

/** Reset the global agent registry (for testing). */
export function resetAgentRegistry(): void {
  AgentRegistry.reset();
}
