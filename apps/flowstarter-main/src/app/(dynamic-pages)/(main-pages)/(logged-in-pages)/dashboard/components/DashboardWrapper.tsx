'use client';

import { useProjectAIStore } from '@/store/ai-suggestions-store';
import { useWizardStore } from '@/store/wizard-store';
import React, { useEffect } from 'react';

export function DashboardWrapper({ children }: React.PropsWithChildren) {
  const {
    startedWithTemplate,
    projectConfig,
    reset,
    resetHostedAvailability,
    setSelectedIndustry,
    setHasAIGenerated,
  } = useWizardStore();
  const aiReset = useProjectAIStore((s) => s.reset);

  // Force restore scrollbar when dashboard mounts
  // This ensures scrollbar is always available even after navigation from wizard or draft discard
  useEffect(() => {
    // Immediately try to restore on mount
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.removeProperty('scrollbar-gutter');

    // Also schedule a delayed restore to catch any race conditions
    const timer = setTimeout(() => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.scrollbarGutter = 'stable';
      document.body.style.removeProperty('scrollbar-gutter');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Reset wizard if user started with template but didn't choose one
  useEffect(() => {
    // Check if user came from template gallery but didn't select a template
    if (startedWithTemplate && !projectConfig.template.id) {
      console.log(
        '[DashboardWrapper] Resetting wizard - user abandoned template selection'
      );

      // Perform full reset similar to handleCancel in ProjectWizard
      reset();
      try {
        aiReset();
      } catch (e) {
        console.warn('Failed to reset AI store', e);
      }
      resetHostedAvailability();
      setSelectedIndustry(undefined);
      setHasAIGenerated(false);
    }
  }, [
    startedWithTemplate,
    projectConfig.template.id,
    reset,
    aiReset,
    resetHostedAvailability,
    setSelectedIndustry,
    setHasAIGenerated,
  ]);

  return <>{children}</>;
}
