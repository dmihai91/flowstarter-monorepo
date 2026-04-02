import type { InitialChatState, OnboardingStep } from '~/components/editor/editor-chat/types';

type PartialState = Partial<
  Pick<
    InitialChatState,
    | 'step'
    | 'projectUrlId'
    | 'buildPhase'
    | 'selectedTemplateId'
    | 'selectedPalette'
    | 'selectedFont'
    | 'businessInfo'
    | 'projectDescription'
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

const VALID_STEPS = new Set<string>(['review', 'personalization', 'integrations', 'creating', 'ready']);

export function normalizeHandoffStep(state: PartialState): OnboardingStep {
  if (state.step && VALID_STEPS.has(state.step)) {
    return state.step;
  }

  if (isCompletedBuildState(state)) {
    return 'ready';
  }

  return 'review';
}
