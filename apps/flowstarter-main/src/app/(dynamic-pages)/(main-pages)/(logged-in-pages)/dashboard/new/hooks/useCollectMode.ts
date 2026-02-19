import type { ProjectConfig } from '@/types/project-config';
import { useEffect, useState } from 'react';

interface UseCollectModeProps {
  projectConfig: ProjectConfig;
  industry: string;
  userDescription: string;
}

export function useCollectMode({
  projectConfig,
  industry,
  userDescription,
}: UseCollectModeProps) {
  // Helper function to calculate collectStep
  const calculateCollectStep = () => {
    const hasIndustry = Boolean(
      (
        projectConfig.designConfig?.businessInfo?.industry ||
        industry ||
        ''
      ).trim()
    );
    const hasUserDescription = Boolean((userDescription || '').trim());
    if (hasUserDescription) return 2;
    if (hasIndustry) return 1;
    return 0;
  };

  // Initialize collectStep based on existing data
  const [collectStep, setCollectStep] = useState<number>(calculateCollectStep);
  const [manuallySet, setManuallySet] = useState(false);

  // Sync collectStep when project data changes (e.g., after draft hydration)
  // But don't override if user manually advanced the step
  useEffect(() => {
    // Don't auto-sync if the user manually set collectStep to 2 (to show prompt)
    if (manuallySet && collectStep === 2) {
      return;
    }

    const newStep = calculateCollectStep();
    if (collectStep !== newStep) {
      console.log(
        '[useCollectMode] Syncing collectStep from project data:',
        newStep
      );
      setCollectStep(newStep);
    }
  }, [
    projectConfig.designConfig?.businessInfo?.industry,
    industry,
    userDescription,
    collectStep,
    manuallySet,
  ]);

  // Initialize collectMode from saved value in projectConfig, or default based on industry
  const [collectMode, setCollectMode] = useState<'ai' | 'manual' | ''>(() => {
    // Check if we have a saved collectMode in projectConfig
    const saved = (projectConfig as unknown as { collectMode?: string })
      .collectMode;
    if (saved === 'ai' || saved === 'manual') {
      console.log('[useCollectMode] Restored collectMode from config:', saved);
      return saved;
    }

    // Otherwise, default to empty (will auto-select 'ai' when industry is selected)
    const hasIndustry = Boolean(
      (
        projectConfig.designConfig?.businessInfo?.industry ||
        industry ||
        ''
      ).trim()
    );
    return hasIndustry ? 'ai' : '';
  });

  // Sync collectMode with projectConfig.collectMode when it changes (e.g., after draft hydration)
  useEffect(() => {
    const saved = (projectConfig as unknown as { collectMode?: string })
      .collectMode;
    if (saved === 'ai' || saved === 'manual') {
      // Only update if different to avoid unnecessary re-renders
      if (collectMode !== saved) {
        console.log(
          '[useCollectMode] Syncing collectMode from projectConfig:',
          saved
        );
        setCollectMode(saved);
      }
    }
  }, [projectConfig, collectMode]);

  // Auto-select 'ai' mode when industry is selected for the first time
  // But only if collectMode hasn't been explicitly set from projectConfig
  useEffect(() => {
    const saved = (projectConfig as unknown as { collectMode?: string })
      .collectMode;
    const hasIndustry = Boolean((industry || '').trim());
    // Only auto-select if no saved value and no current value
    if (hasIndustry && collectMode === '' && !saved) {
      setCollectMode('ai');
    }
  }, [industry, collectMode, projectConfig]);

  // Wrap setCollectStep to track manual changes
  const wrappedSetCollectStep = (step: number) => {
    if (step === 2) {
      setManuallySet(true);
    }
    setCollectStep(step);
  };

  return {
    collectStep,
    setCollectStep: wrappedSetCollectStep,
    collectMode,
    setCollectMode,
  };
}
