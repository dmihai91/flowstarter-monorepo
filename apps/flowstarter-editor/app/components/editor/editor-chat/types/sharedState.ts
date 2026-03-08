/**
 * Shared State Types for Editor Chat Hooks
 *
 * These types define the contracts between the composed hooks in useEditorChatState.
 * Each hook can read shared state and trigger shared actions.
 */

import type { RefObject } from 'react';
import type {
  ChatMessage,
  SuggestedReply,
  ColorPalette,
  SystemFont,
  OnboardingStep,
  BusinessInfo,
  PreviewInfo,
  BuildPhase,
  InitialChatState,
} from '../types';
import type { Template } from '~/components/onboarding';
import type { TemplateRecommendation } from '~/components/editor/template-preview/types';
import type { MessageType } from '~/lib/hooks/useOnboardingChat';

// ─── Message Hook Types ─────────────────────────────────────────────────────

export interface UseOnboardingMessagesOptions {
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export interface UseOnboardingMessagesReturn {
  // State
  messages: ChatMessage[];
  isTyping: boolean;
  isGeneratingMessage: boolean;
  suggestedReplies: SuggestedReply[];
  messagesEndRef: RefObject<HTMLDivElement | null>;

  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: (content: string, component?: React.ReactNode) => ChatMessage;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  addLLMMessage: (
    messageType: MessageType,
    context?: Record<string, unknown> | null,
    component?: React.ReactNode | null,
    options?: { skipTypingIndicator?: boolean },
  ) => Promise<ChatMessage | null>;
  addStepTransitionMessage: (
    fromStep: string,
    toStep: string,
    context?: Record<string, unknown> | null,
  ) => Promise<ChatMessage | null>;
  setSuggestedReplies: (replies: SuggestedReply[]) => void;
  scrollToBottom: () => void;
  setIsTyping: (isTyping: boolean) => void;
  getMessagesSync: () => ChatMessage[];
}

// ─── Flow Hook Types ────────────────────────────────────────────────────────

export interface UseOnboardingFlowOptions {
  initialStep?: OnboardingStep;
  initialDescription?: string;
  initialProjectName?: string | null;
  onStepChange?: (step: OnboardingStep) => void;
}

export interface UseOnboardingFlowReturn {
  // State
  step: OnboardingStep;
  projectDescription: string;
  projectName: string | null;
  inputValue: string;
  lastSuggestedName: string | null;

  // Actions
  setStep: (step: OnboardingStep) => void;
  setProjectDescription: (description: string) => void;
  setProjectName: (name: string | null) => void;
  setInputValue: (value: string) => void;
  setLastSuggestedName: (name: string | null) => void;
}

// ─── Template Selection Hook Types ──────────────────────────────────────────

export interface UseTemplateSelectionOptions {
  onTemplateSelect?: (template: Template) => void;
  onRecommendationSelect?: (recommendation: TemplateRecommendation) => void;
}

export interface UseTemplateSelectionReturn {
  // State
  templates: Template[];
  templatesLoading: boolean;
  templatesError: string | null;
  selectedTemplate: Template | null;
  previewTemplate: Template | null;
  thumbnailErrors: Set<string>;

  // Recommendations
  recommendations: TemplateRecommendation[];
  recommendationsLoading: boolean;
  recommendationsError: string | null;
  selectedRecommendation: TemplateRecommendation | null;
  previewRecommendation: TemplateRecommendation | null;

  // Actions
  refetchTemplates: () => void;
  handleTemplateSelect: (template: Template) => void;
  handleRecommendationSelect: (recommendation: TemplateRecommendation) => void;
  fetchRecommendations: (businessInfo: BusinessInfo, projectName: string, description: string) => Promise<void>;
  handleThumbnailError: (templateId: string) => void;
  openPreview: (templateOrRecommendation: Template | TemplateRecommendation) => void;
  setPreviewTemplate: (template: Template | null) => void;
  setPreviewRecommendation: (recommendation: TemplateRecommendation | null) => void;
}

// ─── Palette Selection Hook Types ───────────────────────────────────────────

export interface UsePaletteSelectionOptions {
  initialPalette?: ColorPalette | null;
  onPaletteSelect?: (palette: ColorPalette) => void;
}

export interface UsePaletteSelectionReturn {
  // State
  selectedPalette: ColorPalette | null;
  previewPalette: ColorPalette | null;
  templatePalette: ColorPalette | null;
  showCustomPalette: boolean;
  customColors: string[];

  // Actions
  setSelectedPalette: (palette: ColorPalette | null) => void;
  setPreviewPalette: (palette: ColorPalette | null) => void;
  setShowCustomPalette: (show: boolean) => void;
  setCustomColors: (colors: string[]) => void;
  handlePaletteSelect: (palette: ColorPalette) => void;
  updateFromTemplate: (template: Template | null, recommendation: TemplateRecommendation | null) => void;
}

// ─── Business Info Hook Types ───────────────────────────────────────────────

export interface UseBusinessInfoOptions {
  onBusinessInfoConfirm?: (info: BusinessInfo) => void;
}

export interface UseBusinessInfoReturn {
  // State
  businessInfo: BusinessInfo | null;

  // Actions
  setBusinessInfo: (info: BusinessInfo | null) => void;
  generateBusinessInfo: (description: string, projectName?: string) => Promise<BusinessInfo | null>;
  handleBusinessInfoConfirm: (confirmed: boolean) => void;
}

// ─── Orchestration Bridge Hook Types ────────────────────────────────────────

export interface UseOrchestrationBridgeOptions {
  onProgress?: (step: string, progress: number) => void;
  onComplete?: (urlId: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  onFilesChanged?: (orchestrationId: string) => void;
}

export interface UseOrchestrationBridgeReturn {
  // State
  orchestratorStatus: {
    state: string;
    orchestrationId: string | null;
    progress: number;
    currentTask: string | null;
    error: string | null;
  };
  orchestratorRunning: boolean;
  buildStep: string;
  buildProgress: number;

  // Actions
  startOrchestration: (params: {
    projectId: string;
    urlId: string;
    wizardOutput: unknown;
    templateSlug: string;
  }) => Promise<void>;
  stopOrchestration: () => void;
  getHistory: () => Promise<unknown[]>;
}

// ─── File Sync Hook Types ───────────────────────────────────────────────────

export interface UseFileSyncOptions {
  onSyncComplete?: (fileCount: number) => void;
}

export interface UseFileSyncReturn {
  // State
  isSyncing: boolean;
  lastSyncedOrchestrationId: string | null;

  // Actions
  syncToWorkbench: (orchestrationId: string) => Promise<void>;
  syncToDaytona: (workspaceId: string, files: Record<string, string>) => Promise<void>;
}

// ─── State Persistence Hook Types ───────────────────────────────────────────

export interface UseStatePersistenceOptions {
  initialState?: InitialChatState;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  debounceMs?: number;
}

export interface UseStatePersistenceReturn {
  // State
  hasRestoredState: boolean;

  // Actions
  persistState: (state: Partial<InitialChatState>) => void;
  getRestoredState: () => InitialChatState | null;
}

// ─── Main Hook Props (unchanged public API) ─────────────────────────────────

export interface UseEditorChatStateProps {
  onProjectReady?: (urlId: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  initialState?: InitialChatState;
  onStateChange?: (state: Partial<InitialChatState>) => void;
}

