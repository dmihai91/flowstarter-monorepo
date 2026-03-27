import type { InitialChatState, OnboardingStep } from '../types';

type PartialState = Partial<
  Pick<
    InitialChatState,
    'step' | 'projectUrlId' | 'buildPhase' | 'selectedTemplateId' | 'selectedPalette' | 'selectedFont' | 'businessInfo' | 'projectDescription'
  >
>;

const COMPLETED_BUILD_PHASES = new Set(['complete', 'complete-healed']);

export function hasPreseededTemplateBuild(state?: PartialState | null): boolean {
  return Boolean(
    state?.selectedTemplateId &&
      state?.selectedPalette &&
      state?.selectedFont &&
      (state?.businessInfo?.description || state?.projectDescription),
  );
}

export function isCompletedBuildState(state?: PartialState | null): boolean {
  if (!state) {
    return false;
  }

  if (state.step === 'ready') {
    return true;
  }

  return Boolean(state.buildPhase && COMPLETED_BUILD_PHASES.has(state.buildPhase));
}

export function normalizeHandoffStep(state: PartialState): OnboardingStep {
  if (
    state.step === 'review' ||
    state.step === 'personalization' ||
    state.step === 'integrations' ||
    state.step === 'creating'
  ) {
    return state.step;
  }

  if (isCompletedBuildState(state)) {
    return 'ready';
  }

  if (hasPreseededTemplateBuild(state)) {
    return 'review';
  }

  if (
    state.step === 'welcome' ||
    state.step === 'describe' ||
    state.step === 'name' ||
    state.step === 'quick-profile' ||
    state.step === 'business-details' ||
    state.step === 'business-uvp' ||
    state.step === 'business-offering' ||
    state.step === 'business-contact' ||
    state.step === 'business-audience' ||
    state.step === 'business-goals' ||
    state.step === 'business-tone' ||
    state.step === 'business-selling' ||
    state.step === 'business-pricing' ||
    state.step === 'business-summary' ||
    state.step === 'template'
  ) {
    return 'review';
  }

  if (state.projectUrlId) {
    return 'review';
  }

  return state.step || 'review';
}
