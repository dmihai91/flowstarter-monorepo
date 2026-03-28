'use client';
import { useTranslations } from '@/lib/i18n';

import { PageContainer } from '@/components/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Loader2,
  ExternalLink,
  Calendar,
  Mail,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  ChevronRight,
  Plug,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTeamProjects } from '@/hooks/useTeamProjects';

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationType = 'calendly' | 'cal-com' | 'mailchimp';

interface Integration {
  id: string;
  project_id: string;
  integration_type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name?: string | null;
  status?: string | null;
}

// ─── Static metadata ─────────────────────────────────────────────────────────

const INTEGRATION_META: Record<
  IntegrationType,
  {
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    docsUrl: string;
    keyLabel: string;
    keyHelp: string;
    keyPlaceholder: string;
  }
> = {
  calendly: {
    name: 'Calendly',
    description: 'Appointment scheduling for client bookings',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    docsUrl: 'https://developer.calendly.com/getting-started',
    keyLabel: 'API Key',
    keyHelp: 'Calendly → Integrations → API & Webhooks → Generate Key',
    keyPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...',
  },
  'cal-com': {
    name: 'Cal.com',
    description: 'Open-source scheduling infrastructure',
    icon: Calendar,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    docsUrl: 'https://cal.com/docs/api-reference/v1/introduction',
    keyLabel: 'API Key',
    keyHelp: 'Cal.com → Settings → Developer → API Keys → Add',
    keyPlaceholder: 'cal_live_...',
  },
  mailchimp: {
    name: 'Mailchimp',
    description: 'Email marketing and newsletter management',
    icon: Mail,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
    keyLabel: 'API Key',
    keyHelp: 'Mailchimp → Account → Extras → API keys → Create A Key',
    keyPlaceholder: 'abc123...-us1',
  },
};

const ALL_TYPES: IntegrationType[] = ['calendly', 'cal-com', 'mailchimp'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntegrationStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      variant="outline"
      className="text-emerald-600 border-emerald-400/50 bg-emerald-50 dark:bg-emerald-900/20 text-xs"
    >
      <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="text-amber-600 border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 text-xs"
    >
      <AlertCircle className="w-3 h-3 mr-1" /> Inactive
    </Badge>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
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
          name: integrationName || `${INTEGRATION_META[dialogType].name} Integration`,
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
      toast.error(err instanceof Error ? err.message : 'Failed to save integration');
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
        `/api/integrations/${typeToPath[integration.integration_type]}/resources`
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
    const p = (projects as Project[] | undefined)?.find((p) => p.id === projectId);
    return p?.name || t('app.unknownProject');
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (!pageReady || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <PageContainer gradientVariant="dashboard">
        <div className="space-y-6">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <GlassCard className="p-6 sm:p-8">
            <Link
              href="/team/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                  <Plug className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Services &amp; Integrations
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                    Configure third-party services per client project
                  </p>
                </div>
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchIntegrations}
                disabled={loadingIntegrations}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loadingIntegrations ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>

            {/* Security note */}
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    All credentials are encrypted at rest
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    API keys are stored via Supabase Vault (pgsodium). Only
                    opaque UUID references live in the database — plaintext is
                    never persisted.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── Tabs: "By Project" vs "By Service" ──────────────────────────── */}
          <Tabs defaultValue="by-project">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList>
                <TabsTrigger value="by-project">By Project</TabsTrigger>
                <TabsTrigger value="by-service">By Service</TabsTrigger>
              </TabsList>

              {/* Project filter */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {(projects as Project[] | undefined)?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || t('app.untitledProject')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── By Project tab ─────────────────────────────────────────────── */}
            <TabsContent value="by-project" className="space-y-4">
              {loadingIntegrations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (projects as Project[] | undefined)?.length === 0 ? (
                <GlassCard className="p-8 text-center text-gray-500 dark:text-white/50">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No client projects yet.</p>
                  <Link
                    href="/new"
                    className="text-sm text-[var(--purple)] hover:underline mt-2 inline-block"
                  >
                    Create your first project →
                  </Link>
                </GlassCard>
              ) : (
                (projects as Project[] | undefined)
                  ?.filter(
                    (p) =>
                      selectedProjectId === 'all' ||
                      p.id === selectedProjectId
                  )
                  .map((project) => {
                    const projectIntegrations = byProject[project.id] || [];
                    const missing = ALL_TYPES.filter(
                      (t) => !configuredTypes(project.id).includes(t)
                    );

                    return (
                      <GlassCard key={project.id} className="p-5">
                        {/* Project header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {project.name || t('app.untitledProject')}
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                              {projectIntegrations.length} integration
                              {projectIntegrations.length !== 1 ? 's' : ''}{' '}
                              configured
                            </p>
                          </div>
                          {project.status && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {project.status}
                            </Badge>
                          )}
                        </div>

                        {/* Configured integrations for this project */}
                        {projectIntegrations.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {projectIntegrations.map((integration) => {
                              const meta =
                                INTEGRATION_META[integration.integration_type];
                              const Icon = meta.icon;

                              return (
                                <div
                                  key={integration.id}
                                  className={`flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/[0.03] border ${meta.borderColor}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-lg ${meta.bgColor} flex items-center justify-center`}
                                    >
                                      <Icon
                                        className={`w-4 h-4 ${meta.color}`}
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        {integration.name}
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-white/40">
                                        {meta.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <IntegrationStatusBadge
                                      isActive={integration.is_active}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleTestConnection(integration)
                                      }
                                      disabled={testing}
                                      title="Test connection"
                                      className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                                    >
                                      {testing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        openEditDialog(integration)
                                      }
                                      className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDelete(integration.id)
                                      }
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add missing integrations */}
                        {missing.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 dark:text-white/40 mb-2">
                              Not yet configured:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {missing.map((type) => {
                                const meta = INTEGRATION_META[type];
                                const Icon = meta.icon;
                                return (
                                  <button
                                    key={type}
                                    onClick={() =>
                                      openAddDialog(type, project.id)
                                    }
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed ${meta.borderColor} ${meta.color} hover:${meta.bgColor} transition-colors`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>+ {meta.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </GlassCard>
                    );
                  })
              )}
            </TabsContent>

            {/* ── By Service tab ─────────────────────────────────────────────── */}
            <TabsContent value="by-service" className="space-y-4">
              {ALL_TYPES.map((type) => {
                const meta = INTEGRATION_META[type];
                const Icon = meta.icon;
                const typeIntegrations = filteredIntegrations.filter(
                  (i) => i.integration_type === type
                );

                return (
                  <GlassCard key={type} className="p-5">
                    {/* Service header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${meta.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {meta.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-white/50">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={meta.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs ${meta.color} hover:underline flex items-center gap-1`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Docs
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddDialog(type)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add to project
                        </Button>
                      </div>
                    </div>

                    {loadingIntegrations ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                      </div>
                    ) : typeIntegrations.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-white/40 italic">
                        Not configured for any project yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {typeIntegrations.map((integration) => (
                          <div
                            key={integration.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {integration.name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-white/40 flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3" />
                                  {getProjectName(integration.project_id)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <IntegrationStatusBadge
                                isActive={integration.is_active}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleTestConnection(integration)
                                }
                                disabled={testing}
                                title="Test connection"
                                className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                              >
                                {testing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(integration)}
                                className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(integration.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                );
              })}

              {/* Analytics — informational only (configured per-project in GA flow) */}
              <GlassCard className="p-5 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Google Analytics
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                      Configured per-project via the Analytics section in each
                      project's settings.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      {/* ── Add / Edit Integration Dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const meta = INTEGRATION_META[dialogType];
                const Icon = meta.icon;
                return (
                  <>
                    <span
                      className={`inline-flex w-7 h-7 rounded-lg ${meta.bgColor} items-center justify-center`}
                    >
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </span>
                    {editingIntegration ? 'Update' : 'Add'}{' '}
                    {INTEGRATION_META[dialogType].name}
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription>
              {INTEGRATION_META[dialogType].keyHelp}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Project selector */}
            <div className="space-y-2">
              <Label htmlFor="dialog-project">
                {t('app.projectLabel')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={dialogProject}
                onValueChange={setDialogProject}
                disabled={!!editingIntegration}
              >
                <SelectTrigger id="dialog-project">
                  <SelectValue placeholder={t('team.services.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {(projects as Project[] | undefined)?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || t('app.untitledProject')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Integration name */}
            <div className="space-y-2">
              <Label htmlFor="dialog-name">Label (optional)</Label>
              <Input
                id="dialog-name"
                placeholder={`${INTEGRATION_META[dialogType].name} — Client Name`}
                value={integrationName}
                onChange={(e) => setIntegrationName(e.target.value)}
              />
            </div>

            {/* API key */}
            <div className="space-y-2">
              <Label htmlFor="dialog-key">
                {INTEGRATION_META[dialogType].keyLabel}{' '}
                {!editingIntegration && <span className="text-red-500">*</span>}
              </Label>
              {editingIntegration && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Leave blank to keep the existing key.
                </p>
              )}
              <div className="relative">
                <Input
                  id="dialog-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={
                    editingIntegration
                      ? '••••••••••••••••'
                      : INTEGRATION_META[dialogType].keyPlaceholder
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-500" />
                Encrypted with Supabase Vault — never stored in plaintext
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !dialogProject ||
                (!editingIntegration && !apiKey)
              }
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingIntegration ? 'Update' : 'Save'} Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
