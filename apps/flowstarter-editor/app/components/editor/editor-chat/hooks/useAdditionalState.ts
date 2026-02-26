/**
 * useAdditionalState Hook
 *
 * Manages additional state that's not part of the core composed hooks:
 * - Font and logo selection
 * - Project IDs (urlId, convexProjectId)
 * - Build progress and phase
 * - Quick profile state
 * - Preview source
 */

import { useState, useEffect, useMemo } from 'react';
import { getSuggestedQuickProfile } from './streamlined-onboarding';

import type { SystemFont, LogoInfo, QuickProfile, InitialChatState } from '../types';

export type PreviewSource = 'daytona';

interface UseAdditionalStateProps {
  initialState?: InitialChatState;
  externalProjectId?: string | null;
  projectDescription: string;
}

export function useAdditionalState({
  initialState,
  externalProjectId,
  projectDescription,
}: UseAdditionalStateProps) {
  // Font and logo selection
  const [selectedFont, setSelectedFont] = useState<SystemFont | null>(
    initialState?.selectedFont || null,
  );
  const [selectedLogo, setSelectedLogo] = useState<LogoInfo | null>(
    initialState?.selectedLogo || null,
  );

  // Project identifiers
  const [currentUrlId, setCurrentUrlId] = useState<string | null>(
    initialState?.projectUrlId || null,
  );

  /**
   * Initialize from externalProjectId (from parent), then initialState, then null
   * externalProjectId takes precedence as it comes from conversation context which is authoritative
   */
  const [convexProjectId, setConvexProjectId] = useState<string | null>(
    externalProjectId || initialState?.convexProjectId || null,
  );

  // Quick Profile state (streamlined flow)
  const [quickProfile, setQuickProfile] = useState<QuickProfile | null>(
    initialState?.quickProfile || null,
  );

  // Preview source
  const [previewSource] = useState<PreviewSource>('daytona');

  // Build progress tracking
  const [buildStep, setBuildStep] = useState<string>('');
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [buildPhase, setBuildPhase] = useState<string>('idle');

  // Last action tracking
  const [lastAction, setLastAction] = useState<{ type: string; payload?: unknown } | null>(null);

  /**
   * Sync with externalProjectId when it changes
   * (e.g., when conversation is created)
   */
  useEffect(() => {
    if (externalProjectId && externalProjectId !== convexProjectId) {
      console.log('[useAdditionalState] Syncing project ID from external source:', externalProjectId);
      setConvexProjectId(externalProjectId);
    }
  }, [externalProjectId, convexProjectId]);

  /**
   * Suggested quick profile computed from description
   */
  const suggestedQuickProfile = useMemo(() => {
    if (!projectDescription) return {};
    return getSuggestedQuickProfile(projectDescription);
  }, [projectDescription]);

  return {
    // Font & Logo
    selectedFont,
    setSelectedFont,
    selectedLogo,
    setSelectedLogo,

    // Project IDs
    currentUrlId,
    setCurrentUrlId,
    convexProjectId,
    setConvexProjectId,

    // Quick Profile
    quickProfile,
    setQuickProfile,
    suggestedQuickProfile,

    // Preview
    previewSource,

    // Build progress
    buildStep,
    setBuildStep,
    buildProgress,
    setBuildProgress,
    buildPhase,
    setBuildPhase,

    // Action tracking
    lastAction,
    setLastAction,
  };
}
