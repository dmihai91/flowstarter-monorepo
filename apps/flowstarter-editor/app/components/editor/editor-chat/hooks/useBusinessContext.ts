/**
 * useBusinessContext Hook
 *
 * Computes business context and internal-flow flag from business info,
 * initial state, and flow state.
 */

import { useMemo } from 'react';
import type { UseBusinessInfoReturn, UseOnboardingFlowReturn } from '../types/sharedState';
import type { InitialChatState } from '../types';

interface UseBusinessContextProps {
  businessHook: UseBusinessInfoReturn;
  initialState?: InitialChatState;
  flowHook: UseOnboardingFlowReturn;
}

export function useBusinessContext({ businessHook, initialState, flowHook }: UseBusinessContextProps) {
  const businessContext = useMemo(() => {
    const info = businessHook.businessInfo;

    if (!info && !initialState?.businessInfo && !initialState?.projectDescription) {
      return null;
    }

    const source = info || initialState?.businessInfo;

    return {
      businessName: flowHook.projectName || source?.businessType || initialState?.projectName || undefined,
      description: source?.description || initialState?.projectDescription || undefined,
      targetAudience: source?.targetAudience || undefined,
      goals: source?.businessGoals || undefined,
      industry: source?.industry || undefined,
      uvp: source?.uvp || undefined,
    };
  }, [businessHook.businessInfo, initialState, flowHook.projectName]);

  const isInternalFlow = useMemo(() => {
    return Boolean(businessContext?.description && businessContext.description.length > 10);
  }, [businessContext]);

  return { businessContext, isInternalFlow };
}
