'use client';

import { useEffect, useState } from 'react';

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
    steps: string; // Can be a string with \n separators or an array
    docsUrl?: string;
    quickLink?: { href: string; label: string };
  };
}

export interface IntegrationConfig {
  [key: string]: string;
}

export function useIntegrations() {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch integrations from database on mount
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/integrations');
        if (!res.ok) {
          console.error('Failed to fetch integrations');
          return;
        }
        const data = await res.json();
        if (data.integrations) {
          setConfigs(data.integrations);
        }
      } catch (error) {
        console.error('Error fetching integrations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchIntegrations();
  }, []);

  const handleConnect = async (
    integrationId: string,
    config: IntegrationConfig
  ) => {
    // Basic client-side validation by integration
    const validate = () => {
      const fail = (msg: string) => ({ ok: false, msg });
      switch (integrationId) {
        case 'mailchimp': {
          const apiKey = (config.apiKey || '').trim();
          const audienceId = (config.audienceId || '').trim();
          if (!apiKey || !/^[a-z0-9-]{10,}$/i.test(apiKey))
            return fail('Invalid Mailchimp API key');
          if (!audienceId || audienceId.length < 5)
            return fail('Invalid audience/list ID');
          return { ok: true };
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
          return { ok: true };
        }
        default:
          return { ok: true };
      }
    };

    const v = validate();
    if (!v.ok) {
      const message =
        (v as { ok: false; msg: string }).msg || 'Invalid configuration';
      return { success: false, error: message } as const;
    }

    setConnectingId(integrationId);

    try {
      // Call server-side verification endpoints
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
          const j = await res
            .json()
            .catch(() => ({} as Record<string, unknown>));
          throw new Error(j.error || 'Calendly verification failed');
        }
      }

      // Save to database
      const saveRes = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          config,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save integration');
      }

      // Store config in local state
      setConfigs((prev) => ({
        ...prev,
        [integrationId]: config,
      }));

      // Success - collapse the form
      setExpandedId(null);

      return { success: true } as const;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setConnectingId(integrationId);

    try {
      // Delete from database
      const res = await fetch(
        `/api/integrations?integrationId=${encodeURIComponent(integrationId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete integration');
      }

      // Remove config from local state
      setConfigs((prev) => {
        const newConfigs = { ...prev };
        delete newConfigs[integrationId];
        return newConfigs;
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnection failed',
      };
    } finally {
      setConnectingId(null);
    }
  };

  const toggleExpanded = (integrationId: string) => {
    setExpandedId((prev) => (prev === integrationId ? null : integrationId));
  };

  const isConnected = (integrationId: string) => {
    return !!configs[integrationId];
  };

  const isExpanded = (integrationId: string) => {
    return expandedId === integrationId;
  };

  const isConnecting = (integrationId: string) => {
    return connectingId === integrationId;
  };

  return {
    configs,
    connectingId,
    expandedId,
    handleConnect,
    handleDisconnect,
    toggleExpanded,
    isConnected,
    isExpanded,
    isConnecting,
    isLoading,
  };
}
