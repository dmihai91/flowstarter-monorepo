'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export type IntegrationStatus = 'not_connected' | 'connected' | 'connecting';

export interface IntegrationConfig {
  [key: string]: string;
}

const integrationsKeys = {
  all: ['integrations'] as const,
  team: ['team-integrations'] as const,
};

/**
 * Hook for fetching user integrations
 */
export function useIntegrationsData() {
  return useQuery({
    queryKey: integrationsKeys.all,
    queryFn: async (): Promise<Record<string, IntegrationConfig>> => {
      const res = await fetch('/api/integrations');
      if (!res.ok) throw new Error('Failed to fetch integrations');
      const data = await res.json();
      return data.integrations ?? {};
    },
  });
}

/**
 * Hook for connecting an integration
 */
export function useConnectIntegration() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      integrationId, 
      config 
    }: { 
      integrationId: string; 
      config: IntegrationConfig;
    }): Promise<{ success: boolean }> => {
      // Verify integration if needed
      if (integrationId === 'mailchimp') {
        const verifyRes = await fetch('/api/integrations/mailchimp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            audienceId: config.audienceId,
          }),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          throw new Error(err.error || 'Mailchimp verification failed');
        }
      } else if (integrationId === 'calendly') {
        const verifyRes = await fetch('/api/integrations/calendly/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            eventUrl: config.eventUrl,
          }),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          throw new Error(err.error || 'Calendly verification failed');
        }
      }

      // Save integration
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, config }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save integration');
      }
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsKeys.all });
    },
  });
}

/**
 * Hook for disconnecting an integration
 */
export function useDisconnectIntegration() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (integrationId: string): Promise<{ success: boolean }> => {
      const res = await fetch(
        `/api/integrations?integrationId=${encodeURIComponent(integrationId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to disconnect integration');
      }
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsKeys.all });
    },
  });
}

/**
 * Hook for team integrations
 */
export function useTeamIntegrationsData() {
  return useQuery({
    queryKey: integrationsKeys.team,
    queryFn: async () => {
      const res = await fetch('/api/team/integrations');
      if (!res.ok) throw new Error('Failed to fetch team integrations');
      return res.json();
    },
  });
}

export function useSaveTeamIntegration() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; config: IntegrationConfig }) => {
      const res = await fetch('/api/team/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save integration');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsKeys.team });
    },
  });
}

export function useDeleteTeamIntegration() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/team/integrations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete integration');
      }
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsKeys.team });
    },
  });
}
