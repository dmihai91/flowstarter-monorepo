'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type IntegrationStatus = 'not_connected' | 'connected' | 'connecting';

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
  features: string[];
  configFields?: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder?: string;
    required?: boolean;
    help?: string;
  }[];
  iconGradient?: string;
  iconColor?: string;
  iconStyle?: React.CSSProperties;
  setupInstructions?: {
    title: string;
    steps: string;
    docsUrl?: string;
    quickLink?: { href: string; label: string };
  };
}

export interface IntegrationConfig {
  [key: string]: string;
}

const QUERY_KEY = ['integrations'] as const;

async function fetchIntegrations(): Promise<Record<string, IntegrationConfig>> {
  const res = await fetch('/api/integrations');
  if (!res.ok) throw new Error('Failed to fetch integrations');
  const data = await res.json();
  return data.integrations ?? {};
}

export function useIntegrations() {
  const qc = useQueryClient();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: configs = {}, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchIntegrations,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const connectMutation = useMutation({
    mutationFn: async ({
      integrationId,
      config,
    }: {
      integrationId: string;
      config: IntegrationConfig;
    }) => {
      // Integration-specific verification
      if (integrationId === 'mailchimp') {
        const res = await fetch('/api/integrations/mailchimp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            audienceId: config.audienceId,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Mailchimp verification failed');
        }
      } else if (integrationId === 'calendly') {
        const res = await fetch('/api/integrations/calendly/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            eventUrl: (config.eventUrl || '').trim(),
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Calendly verification failed');
        }
      }

      // Save to DB
      const saveRes = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, config }),
      });
      if (!saveRes.ok) {
        const e = await saveRes.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to save integration');
      }
      return { integrationId, config };
    },
    onMutate: ({ integrationId }) => setConnectingId(integrationId),
    onSuccess: ({ integrationId, config }) => {
      qc.setQueryData(
        QUERY_KEY,
        (prev: Record<string, IntegrationConfig> = {}) => ({
          ...prev,
          [integrationId]: config,
        })
      );
      setExpandedId(null);
    },
    onSettled: () => setConnectingId(null),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(
        `/api/integrations?integrationId=${encodeURIComponent(integrationId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to delete integration');
      }
      return integrationId;
    },
    onMutate: (integrationId) => setConnectingId(integrationId),
    onSuccess: (integrationId) => {
      qc.setQueryData(
        QUERY_KEY,
        (prev: Record<string, IntegrationConfig> = {}) => {
          const next = { ...prev };
          delete next[integrationId];
          return next;
        }
      );
    },
    onSettled: () => setConnectingId(null),
  });

  // Validation helpers (kept separate from mutation)
  const validate = (integrationId: string, config: IntegrationConfig) => {
    const fail = (msg: string) => ({ ok: false as const, msg });
    switch (integrationId) {
      case 'mailchimp': {
        const apiKey = (config.apiKey || '').trim();
        const audienceId = (config.audienceId || '').trim();
        if (!apiKey || !/^[a-z0-9-]{10,}$/i.test(apiKey))
          return fail('Invalid Mailchimp API key');
        if (!audienceId || audienceId.length < 5)
          return fail('Invalid audience/list ID');
        return { ok: true as const };
      }
      case 'calendly': {
        const url = (config.eventUrl || '').trim();
        const apiKey = (config.apiKey || '').trim();
        try {
          const u = new URL(url);
          if (!/calendly\.com$/i.test(u.hostname))
            return fail('Calendly URL must be on calendly.com');
        } catch {
          return fail('Invalid Calendly URL');
        }
        if (!apiKey || apiKey.length < 10) return fail('Invalid API key');
        return { ok: true as const };
      }
      default:
        return { ok: true as const };
    }
  };

  const handleConnect = async (
    integrationId: string,
    config: IntegrationConfig
  ) => {
    const v = validate(integrationId, config);
    if (!v.ok) return { success: false as const, error: v.msg };
    try {
      await connectMutation.mutateAsync({ integrationId, config });
      return { success: true as const };
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : 'Connection failed',
      };
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await disconnectMutation.mutateAsync(integrationId);
      return { success: true as const };
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : 'Disconnection failed',
      };
    }
  };

  return {
    configs,
    isLoading,
    connectingId,
    expandedId,
    handleConnect,
    handleDisconnect,
    toggleExpanded: (id: string) =>
      setExpandedId((prev) => (prev === id ? null : id)),
    isConnected: (id: string) => !!configs[id],
    isExpanded: (id: string) => expandedId === id,
    isConnecting: (id: string) => connectingId === id,
  };
}
