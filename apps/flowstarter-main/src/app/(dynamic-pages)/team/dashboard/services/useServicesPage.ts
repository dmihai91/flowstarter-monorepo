'use client';

import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTeamProjects } from '@/hooks/useTeamProjects';

import type { Integration, IntegrationType, Project } from './services.types';
import { ALL_TYPES, INTEGRATION_META } from './services.types';

export function useServicesPage() {
  const { t } = useTranslations();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const { data: projects } = useTeamProjects();

  const [pageReady, setPageReady] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  // Project filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<Integration | null>(null);
  const [dialogType, setDialogType] = useState<IntegrationType>('calendly');
  const [dialogProject, setDialogProject] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [integrationName, setIntegrationName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!userLoaded) return;
    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const role = metadata?.role?.toLowerCase();
    const isTeam = role === 'team' || role === 'admin';

    if (!user) {
      router.push('/team/login');
    } else if (!isTeam) {
      router.push('/team/dashboard');
    } else {
      setPageReady(true);
      fetchIntegrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoaded]);

  const fetchIntegrations = useCallback(async () => {
    setLoadingIntegrations(true);
    try {
      const res = await fetch('/api/team/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const filteredIntegrations =
    selectedProjectId === 'all'
      ? integrations
      : integrations.filter((i) => i.project_id === selectedProjectId);

  // Group integrations by project for the "by project" view
  const byProject: Record<string, Integration[]> = {};
  filteredIntegrations.forEach((i) => {
    (byProject[i.project_id] ||= []).push(i);
  });

  // Which integration types are configured for a given project
  const configuredTypes = (projectId: string): IntegrationType[] =>
    (byProject[projectId] || []).map((i) => i.integration_type);

  // ── Dialog helpers ──────────────────────────────────────────────────────────

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
    setApiKey(''); // Never pre-fill secret
    setShowApiKey(false);
    setDialogOpen(true);
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!dialogProject || !apiKey) {
      toast.error('Project and API key are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingIntegration ? 'PATCH' : 'POST';
      const url = editingIntegration
        ? `/api/team/integrations/${editingIntegration.id}`
        : '/api/team/integrations';

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

      toast.success(
        editingIntegration ? 'Integration updated' : 'Integration added'
      );
      setDialogOpen(false);
      fetchIntegrations();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save integration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this integration? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/team/integrations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Integration deleted');
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error('Failed to delete integration');
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    setTesting(true);
    try {
      // Use the type-specific resources endpoint as a connectivity test
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
      if (res.ok) {
        toast.success('Connection successful');
      } else {
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
    saving,
    testing,
    filteredIntegrations,
    byProject,
    configuredTypes,
    openAddDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    handleTestConnection,
    getProjectName,
    fetchIntegrations,
  };
}
