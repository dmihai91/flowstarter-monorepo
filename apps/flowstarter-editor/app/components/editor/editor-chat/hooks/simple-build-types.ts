import type { SystemFont, LogoInfo, PreviewInfo, InitialChatState, IntegrationConfig, ContactDetails } from '../types';
import type { UseOnboardingMessagesReturn } from './useOnboardingMessages';
import type { UseOnboardingFlowReturn } from './useOnboardingFlow';
import type { UseTemplateSelectionReturn } from './useTemplateSelection';
import type { UsePaletteSelectionReturn } from './usePaletteSelection';
import type { UseBusinessInfoReturn } from './useBusinessInfo';

// ─── Build Progress Constants ───────────────────────────────────────────────
export const BUILD_PROGRESS = {
  INITIAL: 0,
  GENERATING_START: 10,
  GENERATING_PROGRESS: 50,
  DEPLOYING_START: 70,
  DEPLOYING_PROGRESS: 85,
  COMPLETE: 100,
} as const;

export interface UseSimpleBuildHandlersProps {
  messageHook: UseOnboardingMessagesReturn;
  flowHook: UseOnboardingFlowReturn;
  templateHook: UseTemplateSelectionReturn;
  paletteHook: UsePaletteSelectionReturn;
  businessHook: UseBusinessInfoReturn;
  selectedFont: SystemFont | null;
  selectedLogo: LogoInfo | null;
  setSelectedFont: (font: SystemFont | null) => void;
  setSelectedLogo: (logo: LogoInfo | null) => void;
  setConvexProjectId: (id: string | null) => void;
  setCurrentUrlId: (id: string | null) => void;
  setBuildStep: (step: string) => void;
  setBuildProgress: (progress: number) => void;
  setBuildPhase: (phase: string) => void;
  onPreviewChange?: (preview: PreviewInfo | null) => void;
  onProjectReady?: (urlId: string) => void;
  onStateChange?: (state: Partial<InitialChatState>) => void;
  /** Existing project ID if one was already created (e.g., in /new route) */
  existingProjectId?: string | null;
}

export interface UseSimpleBuildHandlersReturn {
  handlePersonalizationComplete: (font: SystemFont, logo: LogoInfo, useAiImages?: boolean) => Promise<void>;
  handleContactDetailsComplete: (contactDetails: ContactDetails) => Promise<void>;
  handleSkipContactDetails: () => Promise<void>;
  handleIntegrationsComplete: (integrations: IntegrationConfig[]) => Promise<void>;
  handleSkipIntegrations: () => Promise<void>;
}
