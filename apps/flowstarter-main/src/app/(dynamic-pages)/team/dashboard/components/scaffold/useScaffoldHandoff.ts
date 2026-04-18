'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getSubdomainUrl } from '@flowstarter/platform-config';
import type { EngineArtifacts } from '@/lib/engine/contracts';
import type {
  ClientInfo,
  IntegrationsConfig,
  ProjectBriefDraft,
  SelectedLogo,
  TemplatePalette,
  TemplateFont,
} from './scaffold-types';
import { toBrandProfile } from './scaffold-types';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || getSubdomainUrl('editor');

interface UseScaffoldHandoffOptions {
  brief: ProjectBriefDraft;
  userInput: string;
  clientInfo: ClientInfo;
  selectedTemplateId: string | null;
  selectedPalette: TemplatePalette | null;
  selectedFont: TemplateFont | null;
  selectedLogo: SelectedLogo | null;
  selectedIntegrations: IntegrationsConfig | null;
  engineArtifacts: EngineArtifacts | null;
  reset: () => void;
}

export function useScaffoldHandoff(opts: UseScaffoldHandoffOptions) {
  const queryClient = useQueryClient();
  const {
    brief,
    userInput,
    clientInfo,
    selectedTemplateId,
    selectedPalette,
    selectedFont,
    selectedLogo,
    selectedIntegrations,
    engineArtifacts,
    reset,
  } = opts;

  const handoffMutation = useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      const projectConfig = config ?? {
        name: brief.projectName,
        projectName: brief.projectName,
        description: brief.summary,
        userDescription: userInput,
        industry: brief.industry,
        templateId: selectedTemplateId ?? undefined,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        clientBusinessName: clientInfo.businessName || undefined,
        businessInfo: {
          summary: brief.summary,
          industry: brief.industry,
          targetAudience: brief.targetAudience,
          valueProposition: brief.valueProposition,
          offerings: brief.offerings,
          goals: brief.goals,
          offerType: brief.offerType,
          brandTone: brief.brandTone,
          desiredCustomerAction: brief.desiredCustomerAction,
          differentiators: brief.differentiators,
          trustSignals: brief.trustSignals,
          contentStylePreference: brief.contentStylePreference,
        },
        brandProfile: toBrandProfile(brief),
        siteInfo: {
          pagePreference: brief.pagePreference,
          integrations: brief.integrations,
        },
        contactInfo: {
          email: brief.contactEmail,
          phone: brief.contactPhone,
          address: brief.contactAddress,
        },
        flowstarterEngine: engineArtifacts ?? undefined,
        template: selectedTemplateId
          ? { id: selectedTemplateId }
          : engineArtifacts
          ? {
              id: engineArtifacts.templateSelection.selectedTemplateId,
              name: engineArtifacts.templateSelection.selectedTemplateName,
            }
          : undefined,
        palette: selectedPalette ?? undefined,
        font: selectedFont ?? undefined,
        logo: selectedLogo ?? undefined,
        integrations: selectedIntegrations ?? undefined,
      };

      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig, mode: 'interactive' }),
      });
      if (!res.ok) throw new Error('Handoff failed');
      return res.json() as Promise<{
        editorUrl: string;
        token: string;
        projectId: string;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      window.open(
        data.editorUrl || `${EDITOR_URL}?handoff=${data.token}`,
        '_blank'
      );
    },
    onError: () => {
      window.open(EDITOR_URL, '_blank');
    },
  });

  const launchEditor = useCallback(
    (config?: Record<string, unknown>) => {
      handoffMutation.mutate(config);
    },
    [handoffMutation]
  );

  return { launchEditor, isHandingOff: handoffMutation.isPending };
}
