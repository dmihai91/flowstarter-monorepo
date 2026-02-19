/**
 * Editor Chat Types
 *
 * Re-exports all types for the editor chat system.
 */

// Core types (existing)
export type {
  ChatMessage,
  SuggestedReply,
  ColorPalette,
  SystemFont,
  AttachedImage,
  OnboardingStep,
  BusinessInfo,
  LogoInfo,
  PreviewInfo,
  BuildPhase,
  InitialChatState,
  EditorChatPanelProps,
  CategoryColors,
  Template,
} from '../types';

// Shared state types for hook composition
export type {

  // Message hook
  UseOnboardingMessagesOptions,
  UseOnboardingMessagesReturn,

  // Flow hook
  UseOnboardingFlowOptions,
  UseOnboardingFlowReturn,

  // Template selection hook
  UseTemplateSelectionOptions,
  UseTemplateSelectionReturn,

  // Palette selection hook
  UsePaletteSelectionOptions,
  UsePaletteSelectionReturn,

  // Business info hook
  UseBusinessInfoOptions,
  UseBusinessInfoReturn,

  // Orchestration bridge hook
  UseOrchestrationBridgeOptions,
  UseOrchestrationBridgeReturn,

  // File sync hook
  UseFileSyncOptions,
  UseFileSyncReturn,

  // State persistence hook
  UseStatePersistenceOptions,
  UseStatePersistenceReturn,

  // Main hook props
  UseEditorChatStateProps,
} from './sharedState';

