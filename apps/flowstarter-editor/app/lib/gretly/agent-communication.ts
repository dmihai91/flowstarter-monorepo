/**
 * Gretly Agent Communication
 *
 * Handles all communication with the three-tier agent architecture via FlowOps protocol:
 * - PlannerAgent (Claude Opus 4.6): Planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2.5): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing with fresh perspective
 */

import { getAgentRegistry } from '~/lib/flowops';
import {
  getPlannerAgent,
  type PlannerResponseDTO,
  type PlanResultDTO,
} from '~/lib/flowstarter/agents/planner-agent';
import { getCodeGeneratorAgent, type GenerateResultDTO } from '~/lib/flowstarter/agents/code-generator-agent';
import { getFixerAgent, type FixerResponseDTO } from '~/lib/flowstarter/agents/fixer-agent';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import { createScopedLogger } from '~/utils/logger';
import type { GretlyInput, ErrorHistoryEntry } from './types';
import { findFilePath } from './utils';

const logger = createScopedLogger('GretlyAgents');

/*
 * ============================================================================
 * Agent Registration
 * ============================================================================
 */

/**
 * Register all agents with the FlowOps registry.
 */
export function registerAgents(approvalThreshold: number): void {
  const registry = getAgentRegistry();

  if (!registry.has('planner')) {
    registry.register(getPlannerAgent(approvalThreshold));
  }

  if (!registry.has('code-generator')) {
    registry.register(getCodeGeneratorAgent());
  }

  if (!registry.has('fixer')) {
    registry.register(getFixerAgent()); // Sonnet 4 is primary by default
  }

  logger.info('Agents registered: gretly, code-generator, fixer');
}

/*
 * ============================================================================
 * Planner Agent Communication
 * ============================================================================
 */

/**
 * Call PlannerAgent for planning.
 */
export async function callPlannerAgent(
  type: 'plan',
  input: GretlyInput,
  templateFiles: Record<string, string>,
): Promise<PlannerResponseDTO> {
  const registry = getAgentRegistry();
  const response = await registry.send(
    'planner',
    JSON.stringify({
      type,
      projectId: input.projectId,
      businessInfo: input.businessInfo,
      template: {
        ...input.template,
        files: templateFiles,
      },
      design: input.design,
    }),
  );

  return JSON.parse(response.message.content) as PlannerResponseDTO;
}

/**
 * Call PlannerAgent for review.
 */
export async function callPlannerAgentReview(
  input: GretlyInput,
  files: Record<string, string>,
): Promise<PlannerResponseDTO> {
  const registry = getAgentRegistry();
  const response = await registry.send(
    'planner',
    JSON.stringify({
      type: 'review',
      projectId: input.projectId,
      businessInfo: input.businessInfo,
      template: input.template,
      design: input.design,
      generatedFiles: files,
    }),
  );

  return JSON.parse(response.message.content) as PlannerResponseDTO;
}

/**
 * Call PlannerAgent for escalation.
 */
export async function callPlannerAgentEscalate(
  input: GretlyInput,
  errorHistory: ErrorHistoryEntry[],
): Promise<PlannerResponseDTO> {
  const registry = getAgentRegistry();
  const response = await registry.send(
    'planner',
    JSON.stringify({
      type: 'escalate',
      projectId: input.projectId,
      businessInfo: input.businessInfo,
      template: input.template,
      errorHistory,
    }),
  );

  return JSON.parse(response.message.content) as PlannerResponseDTO;
}

/*
 * ============================================================================
 * Code Generator Agent Communication
 * ============================================================================
 */

/**
 * Call CodeGeneratorAgent for generation or refinement.
 */
export async function callCodeGeneratorAgent(
  type: 'generate' | 'refine',
  input: GretlyInput,
  plan: PlanResultDTO,
  baseFiles: Record<string, string>,
  feedback?: Array<{ file: string; instruction: string; priority: 'must-fix' | 'should-fix' | 'nice-to-have' }>,
): Promise<GenerateResultDTO> {
  const registry = getAgentRegistry();
  const response = await registry.send(
    'code-generator',
    JSON.stringify({
      type,
      projectId: input.projectId,
      businessInfo: input.businessInfo,
      templateFiles: baseFiles,
      modifications: plan.modifications,
      contentGuidelines: plan.contentGuidelines,
      design: input.design,
      previousFiles: type === 'refine' ? baseFiles : undefined,
      feedback: type === 'refine' ? feedback : undefined,
    }),
  );

  return JSON.parse(response.message.content) as GenerateResultDTO;
}

/*
 * ============================================================================
 * Fixer Agent Communication
 * ============================================================================
 */

/**
 * Call FixerAgent for error fixing.
 */
export async function callFixerAgent(
  error: BuildErrorDTO,
  files: Record<string, string>,
): Promise<FixerResponseDTO> {
  const foundPath = findFilePath(error.file, files);

  if (!foundPath) {
    return {
      success: false,
      tier: 'none',
      attempts: 0,
      error: `File not found: ${error.file}`,
    };
  }

  const registry = getAgentRegistry();
  const response = await registry.send(
    'fixer',
    JSON.stringify({
      file: foundPath,
      content: files[foundPath],
      error: error.message,
      line: parseInt(error.line, 10) || undefined,
      fullOutput: error.fullOutput,
    }),
  );

  return JSON.parse(response.message.content) as FixerResponseDTO;
}
