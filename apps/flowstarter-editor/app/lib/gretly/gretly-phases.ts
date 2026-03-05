/**
 * Gretly Phase Execution Functions
 *
 * Extracted from GretlyEngine: data fetching, generation, build with self-healing,
 * and escalation handling as standalone functions.
 */

import { createScopedLogger } from '~/utils/logger';
import type { BuildErrorDTO } from '~/lib/flowops/schema';
import type { PlanResultDTO, ReviewResultDTO } from '~/lib/flowstarter/agents/planner-agent';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';
import type { GretlyPhase, GretlyInput, ResolvedConfig, ErrorHistoryEntry } from './types';
import {
  callPlannerAgentEscalate,
  callCodeGeneratorAgent,
  callFixerAgent,
} from './agent-communication';
import { findFilePath } from './utils';

const logger = createScopedLogger('Gretly');

/**
 * Fetch data from external sources if dataFetcher is configured.
 */
export async function fetchData(
  config: ResolvedConfig,
  input: GretlyInput,
  onProgress?: ResolvedConfig['onProgress'],
): Promise<{ resolvedInput: GretlyInput; templateFiles: Record<string, string> }> {
  onProgress?.('planning', t(EDITOR_LABEL_KEYS.ORCH_FETCHING_PROJECT), 2);

  let resolvedInput = input;
  let templateFiles: Record<string, string> = {};

  if (config.dataFetcher?.fetchBusinessInfo) {
    const freshBusinessInfo = await config.dataFetcher.fetchBusinessInfo(input.projectId);
    if (freshBusinessInfo) {
      resolvedInput = { ...resolvedInput, businessInfo: freshBusinessInfo };
      logger.info('Fetched fresh business info');
    }
  }

  if (config.dataFetcher?.fetchTemplate) {
    const templateData = await config.dataFetcher.fetchTemplate(input.template.slug);
    if (templateData) {
      resolvedInput = { ...resolvedInput, template: templateData.info };
      templateFiles = templateData.files;
      logger.info(`Fetched template with ${Object.keys(templateFiles).length} files`);
    }
  }

  return { resolvedInput, templateFiles };
}

/**
 * Execute the generation phase.
 */
export async function executeGeneration(
  config: ResolvedConfig,
  input: GretlyInput,
  plan: PlanResultDTO,
  refineIterations: number,
  templateFiles: Record<string, string>,
  currentFiles: Record<string, string>,
  setPhase: (phase: GretlyPhase) => void,
  feedback?: Array<{ file: string; instruction: string; priority: 'must-fix' | 'should-fix' | 'nice-to-have' }>,
): Promise<Record<string, string>> {
  setPhase('generating');
  config.onProgress?.(
    'generating',
    refineIterations === 0
      ? t(EDITOR_LABEL_KEYS.ORCH_CODE_GENERATING)
      : t(EDITOR_LABEL_KEYS.ORCH_CODE_REFINING, { iteration: refineIterations }),
    20 + refineIterations * 10,
  );

  const baseFiles = refineIterations === 0 && Object.keys(templateFiles).length > 0 ? templateFiles : currentFiles;

  const generateResponse = await callCodeGeneratorAgent(
    refineIterations === 0 ? 'generate' : 'refine',
    input,
    plan,
    baseFiles,
    feedback,
  );

  if (!generateResponse.success) {
    throw new Error(generateResponse.error || 'Generation failed');
  }

  logger.info(`Generated ${Object.keys(generateResponse.files).length} files`);
  return generateResponse.files;
}

/**
 * Execute the build phase with self-healing via FixerAgent.
 */
export async function executeBuildWithFixing(
  config: ResolvedConfig,
  input: GretlyInput,
  files: Record<string, string>,
  buildFn: (projectId: string, files: Record<string, string>) => Promise<{
    success: boolean; error?: string; buildError?: BuildErrorDTO; previewUrl?: string; sandboxId?: string;
  }>,
  errorHistory: ErrorHistoryEntry[],
  initialFixAttempts: number,
  setPhase: (phase: GretlyPhase) => void,
): Promise<{
  success: boolean; fixAttempts: number; needsEscalation: boolean;
  lastBuildError?: BuildErrorDTO;
  buildResult: Awaited<ReturnType<typeof buildFn>> | null;
}> {
  setPhase('building');
  config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_BUILDING_SITE), 40);

  let buildSuccess = false;
  let lastBuildError: BuildErrorDTO | undefined;
  let buildResult: Awaited<ReturnType<typeof buildFn>> | null = null;
  let localFixAttempts = 0;
  let fixAttempts = initialFixAttempts;

  for (let attempt = 0; attempt <= config.maxFixAttempts; attempt++) {
    buildResult = await buildFn(input.projectId, files);

    if (buildResult.success) {
      buildSuccess = true;
      logger.info(`Build succeeded on attempt ${attempt}`);
      break;
    }

    if (!buildResult.buildError || attempt >= config.maxFixAttempts) {
      lastBuildError = buildResult.buildError;
      break;
    }

    // FIXING phase
    setPhase('fixing');
    config.onProgress?.('fixing', t(EDITOR_LABEL_KEYS.ORCH_FIXER_FIXING, { file: buildResult.buildError.file }), 50);
    fixAttempts++;
    localFixAttempts++;

    const fixResult = await callFixerAgent(buildResult.buildError, files);

    if (!fixResult.success || !fixResult.fixedContent) {
      trackFixError(errorHistory, buildResult.buildError, fixResult.summary);
      lastBuildError = buildResult.buildError;
      break;
    }

    const foundPath = findFilePath(buildResult.buildError.file, files);
    if (foundPath) {
      files[foundPath] = fixResult.fixedContent;
      logger.info(`Fixed ${foundPath}: ${fixResult.summary}`);
    }

    setPhase('building');
    config.onProgress?.('building', t(EDITOR_LABEL_KEYS.ORCH_RETRYING_BUILD, { attempt: attempt + 1 }), 55);
  }

  return {
    success: buildSuccess,
    fixAttempts,
    needsEscalation: !buildSuccess && localFixAttempts >= config.maxFixAttempts,
    lastBuildError,
    buildResult,
  };
}

/**
 * Handle escalation when fixes fail.
 */
export async function handleEscalation(
  config: ResolvedConfig,
  input: GretlyInput,
  errorHistory: ErrorHistoryEntry[],
  files: Record<string, string>,
  fixAttempts: number,
  refineIterations: number,
  phases: GretlyPhase[],
  setPhase: (phase: GretlyPhase) => void,
  lastBuildError?: BuildErrorDTO,
  buildResult?: { success: boolean; error?: string } | null,
): Promise<import('./types').GretlyResult | null> {
  setPhase('escalating');
  config.onProgress?.('escalating', t(EDITOR_LABEL_KEYS.ORCH_PLANNER_ANALYZING), 60);

  const escalateResponse = await callPlannerAgentEscalate(input, errorHistory);

  if (escalateResponse.type === 'escalate') {
    logger.warn(`Escalation: ${escalateResponse.result.escalationType}`);
    return {
      success: false, files, phases, fixAttempts, refineIterations,
      error: escalateResponse.result.explanation,
      escalation: escalateResponse.result,
    };
  }

  setPhase('failed');
  return {
    success: false, files, phases, fixAttempts, refineIterations,
    error: lastBuildError?.message || buildResult?.error || t(EDITOR_LABEL_KEYS.ORCH_BUILD_FAILED_MAX),
  };
}

function trackFixError(
  errorHistory: ErrorHistoryEntry[],
  buildError: BuildErrorDTO,
  fixSummary?: string,
): void {
  const existing = errorHistory.find((e) => e.file === buildError.file);
  if (existing) {
    existing.fixAttempts++;
    existing.lastFixSummary = fixSummary;
  } else {
    errorHistory.push({
      file: buildError.file,
      error: buildError.message,
      fixAttempts: 1,
      lastFixSummary: fixSummary,
    });
  }
}
