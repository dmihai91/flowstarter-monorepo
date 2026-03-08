/**
 * FlowOps Planner Agent (Master Orchestrator Agent)
 *
 * Uses Claude Opus 4 for planning, review, and exception handling.
 * Orchestrated by GretlyEngine, communicates via FlowOps.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { generateJSON } from '~/lib/services/llm';
import { PlanRequestSchema } from './planner-agent-schemas';
import type {
  PlanRequestDTO, PlanResultDTO, ReviewResultDTO, EscalateResultDTO, PlannerResponseDTO,
} from './planner-agent-schemas';
import {
  buildPlanPrompt, buildReviewPrompt, buildEscalatePrompt,
  buildTemplateSummary, buildFileSummary,
} from './planner-agent-prompts';

// Re-export schemas and types for backward compatibility
export * from './planner-agent-schemas';

const MASTER_MODEL = 'anthropic/claude-opus-4-6';

export class PlannerAgent extends BaseAgent {
  private readonly approvalThreshold: number;

  constructor(approvalThreshold: number = 7) {
    super({
      name: 'planner',
      description: 'Master orchestrator agent for planning, review, and exception handling (Claude Opus 4)',
      version: '1.0.0',
      systemPrompt: `You are the Planner agent, the master orchestrator for site generation.
You use Claude Opus 4 for high-quality planning, review, and decision-making.

Your responsibilities:
1. PLANNING: Analyze business data + template to create detailed modification plans
2. REVIEW: Judge generated output quality and decide approve/reject/refine
3. EXCEPTION HANDLING: When fixes fail repeatedly, create user-friendly escalation reports

You are the "brain" of the pipeline - other agents (CodeGenerator, Fixer) do the heavy lifting,
but you make the strategic decisions.`,
      allowedTools: [],
      allowedAgents: ['code-generator', 'fixer'],
    });
    this.approvalThreshold = approvalThreshold;
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing planner request...', 5);
    let request: PlanRequestDTO;
    try {
      const parsed = JSON.parse(message);
      const validation = PlanRequestSchema.safeParse(parsed);
      if (!validation.success) {
        return this.createErrorResponse(`Invalid request: ${validation.error.message}`);
      }
      request = validation.data;
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected: { type, projectId, businessInfo, template, ... }');
    }

    this.logger.info(`Processing ${request.type} request for project ${request.projectId}`);
    switch (request.type) {
      case 'plan': return this.handlePlan(request, context);
      case 'review': return this.handleReview(request, context);
      case 'escalate': return this.handleEscalate(request, context);
      default: return this.createErrorResponse(`Unknown request type: ${request.type}`);
    }
  }

  private async handlePlan(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Creating modification plan with Opus 4...', 20);
    const templateSummary = buildTemplateSummary(request.template.files || {});
    const prompt = buildPlanPrompt(request, templateSummary);
    try {
      const result = await generateJSON<PlanResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL, temperature: 0.3, maxTokens: 16000,
      });
      this.logger.info(`Plan created with ${result.modifications.length} modifications`);
      context.onProgress?.('Plan created successfully', 100);
      const response: PlannerResponseDTO = { type: 'plan', result };
      return { message: this.createMessage('agent', JSON.stringify(response)), complete: true };
    } catch (error) {
      this.logger.error('Planning failed:', error);
      return this.createErrorResponse(`Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleReview(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Reviewing generated output with Opus 4...', 20);
    if (!request.generatedFiles || Object.keys(request.generatedFiles).length === 0) {
      return this.createErrorResponse('No generated files provided for review');
    }
    const fileSummary = buildFileSummary(request.generatedFiles);
    const prompt = buildReviewPrompt(request, fileSummary, this.approvalThreshold);
    try {
      const result = await generateJSON<ReviewResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL, temperature: 0.3, maxTokens: 12000,
      });
      const hasNoCritical = !result.issues.some((i) => i.severity === 'critical');
      result.approved = result.score >= this.approvalThreshold && hasNoCritical;
      this.logger.info(`Review complete: score=${result.score}, approved=${result.approved}`);
      context.onProgress?.('Review complete', 100);
      const response: PlannerResponseDTO = { type: 'review', result };
      return { message: this.createMessage('agent', JSON.stringify(response)), complete: true };
    } catch (error) {
      this.logger.error('Review failed:', error);
      return this.createErrorResponse(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleEscalate(request: PlanRequestDTO, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Analyzing escalation with Opus 4...', 20);
    if (!request.errorHistory || request.errorHistory.length === 0) {
      return this.createErrorResponse('No error history provided for escalation');
    }
    const errorSummary = request.errorHistory
      .map((e) =>
        `- ${e.file}: "${e.error}" (${e.fixAttempts} fix attempts${e.lastFixSummary ? `, last fix: ${e.lastFixSummary}` : ''})`,
      )
      .join('\n');
    const prompt = buildEscalatePrompt(request, errorSummary);
    try {
      const result = await generateJSON<EscalateResultDTO>([{ role: 'user', content: prompt }], {
        model: MASTER_MODEL, temperature: 0.3, maxTokens: 2000,
      });
      this.logger.info(`Escalation type: ${result.escalationType}`);
      context.onProgress?.('Escalation report generated', 100);
      const response: PlannerResponseDTO = { type: 'escalate', result };
      return { message: this.createMessage('agent', JSON.stringify(response)), complete: true };
    } catch (error) {
      this.logger.error('Escalation analysis failed:', error);
      return this.createErrorResponse(`Escalation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createErrorResponse(error: string): AgentResponse {
    const response: PlannerResponseDTO = {
      type: 'plan',
      result: { success: false, modifications: [], error },
    };
    return {
      message: this.createMessage('agent', JSON.stringify(response)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

let plannerAgentInstance: PlannerAgent | null = null;

export function getPlannerAgent(approvalThreshold?: number): PlannerAgent {
  if (!plannerAgentInstance) {
    plannerAgentInstance = new PlannerAgent(approvalThreshold);
  }
  return plannerAgentInstance;
}

export function resetPlannerAgent(): void {
  plannerAgentInstance = null;
}
