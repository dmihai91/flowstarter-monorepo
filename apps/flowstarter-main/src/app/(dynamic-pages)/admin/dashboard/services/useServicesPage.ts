'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTeamProjects } from '@/hooks/useTeamProjects';

import type { Integration, IntegrationType, Project } from './services.types';
import { INTEGRATION_META } from './services.types';

const INTEGRATIONS_KEY = ['team-integrations'] as const;

async function fetchTeamIntegrations(): Promise<Integration[]> {
  const res = await fetch('/api/admin/integrations');
  if (!res.ok) throw new Error('Failed to fetch integrations');
  const data = await res.json();
  return data.integrations ?? [];
}

export function useServicesPage() {
  const { t } = useTranslations();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: projects } = useTeamProjects();

  const [pageReady, setPageReady] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Dialog state (UI only — not server state)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<Integration | null>(null);
  const [dialogType, setDialogType] = useState<IntegrationType>('calendly');
  const [dialogProject, setDialogProject] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [integrationName, setIntegrationName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!userLoaded) return;
    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const role = metadata?.role?.toLowerCase();
    const isTeam = role === 'team' || role === 'admin';
    if (!user) router.push('/admin/login');
    else if (!isTeam) router.push('/admin/dashboard');
    else setPageReady(true);
  }, [user, userLoaded, router]);

  // ── React Query ─────────────────────────────────────────────────────────────

  const { data: integrations = [], isLoading: loadingIntegrations } = useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: fetchTeamIntegrations,
    enabled: pageReady,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!dialogProject || !apiKey)
        throw new Error('Project and API key are required');
      const method = editingIntegration ? 'PATCH' : 'POST';
      const url = editingIntegration
        ? `/api/admin/integrations/${editingIntegration.id}`
        : '/api/admin/integrations';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: dialogProject,
          integrationType: dialogType,
          name:
            integrationName ||
            `${INTEGRATION_META[dialogType].name} Integration`,
          apiKey,
          config: {},
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(
        editingIntegration ? 'Integration updated' : 'Integration added'
      );
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save integration'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/integrations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return id;
    },
    onSuccess: () => {
      toast.success('Integration deleted');
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY });
    },
    onError: () => toast.error('Failed to delete integration'),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredIntegrations =
    selectedProjectId === 'all'
      ? integrations
      : integrations.filter((i) => i.project_id === selectedProjectId);

  const byProject: Record<string, Integration[]> = {};
  filteredIntegrations.forEach((i) => {
    (byProject[i.project_id] ||= []).push(i);
  });

  const configuredTypes = (projectId: string): IntegrationType[] =>
    (byProject[projectId] || []).map((i) => i.integration_type);

  // ── Dialog helpers ────────────────────────────────────────────────────────────

  const openAddDialog = (type: IntegrationType, projectId?: string) => {
    setEditingIntegration(null);
    setDialogType(type);
    setDialogProject(projectId || '');
    setApiKey('');
    setIntegrationName('');
    setShowApiKey(false);
    setDialogOpen(true);
  };

  const openEditDialog = (integration: Integration) => {
    setEditingIntegration(integration);
    setDialogType(integration.integration_type);
    setDialogProject(integration.project_id);
    setIntegrationName(integration.name);
    setApiKey('');
    setShowApiKey(false);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this integration? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  const handleTestConnection = async (integration: Integration) => {
    setTesting(true);
    try {
      const typeToPath: Record<IntegrationType, string> = {
        calendly: 'calendly',
        'cal-com': 'cal-com',
        mailchimp: 'mailchimp',
      };
      const res = await fetch(
        `/api/integrations/${
          typeToPath[integration.integration_type]
        }/resources`
      );
      if (res.ok) toast.success('Connection successful');
      else {
        const data = await res.json().catch(() => ({}));
        toast.error(`Connection failed: ${data.error || res.statusText}`);
      }
    } catch {
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const p = (projects as Project[] | undefined)?.find(
      (p) => p.id === projectId
    );
    return p?.name || t('app.unknownProject');
  };

  return {
    t,
    projects,
    pageReady,
    userLoaded,
    integrations,
    loadingIntegrations,
    selectedProjectId,
    setSelectedProjectId,
    dialogOpen,
    setDialogOpen,
    editingIntegration,
    dialogType,
    dialogProject,
    setDialogProject,
    apiKey,
    setApiKey,
    integrationName,
    setIntegrationName,
    showApiKey,
    setShowApiKey,
    saving: saveMutation.isPending,
    testing,
    filteredIntegrations,
    byProject,
    configuredTypes,
    openAddDialog,
    openEditDialog,
    handleSave: () => saveMutation.mutate(),
    handleDelete,
    handleTestConnection,
    getProjectName,
    fetchIntegrations: () =>
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  };
}
