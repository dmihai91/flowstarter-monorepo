/**
 * Hook DTOs - Centralized exports for all hook types
 *
 * This module provides the type boundary between the editor/component layer
 * and the service layer. Components should import types from here, not from services.
 */

// Orchestrator DTOs
export type {
  OrchestratorStateDTO,
  TaskStatusDTO,
  TaskDTO,
  PlanDTO,
  ReviewIssueDTO,
  ReviewDTO,
  PreviewDTO,
  ProgressDTO,
  OrchestratorStatusDTO,
  OrchestratorEventTypeDTO,
  OrchestratorEventDTO,
  UseOrchestratorOptionsDTO,
  UseOrchestratorReturnDTO,

  // Build and Deploy DTOs
  ModelTierDTO,
  BuildErrorDTO,
  BuildProgressDTO,
  BuildResultDTO,
  DeploymentDTO,

  // WizardOutput DTO
  BusinessInfoDTO,
  PaletteSelectionDTO,
  FontSelectionDTO,
  TemplateSelectionDTO,
  ProjectMetaDTO,
  WizardOutputDTO,
} from './orchestrator.dto';

// Agent DTOs
export type {
  AgentFileResultDTO,
  AgentPhaseDTO,
  AgentProgressDTO,
  AgentPlanDTO,
  AgentReviewDTO,
  AgentExecutionStateDTO,
  AgentEventTypeDTO,
  AgentEventDTO,
  AgentDesignSchemeDTO,
  AgentProjectDetailsDTO,
  AgentProjectContextDTO,
  UseAgentExecutionOptionsDTO,
  UseAgentExecutionReturnDTO,
} from './agent.dto';

