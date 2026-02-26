'use client';

import { PageContainer } from '@/components/PageContainer';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useUser } from '@clerk/nextjs';
import { TeamHeader } from '../../components/TeamHeader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Loader2,
  ExternalLink,
  Calendar,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTeamProjects } from '@/hooks/useTeamProjects';

interface Integration {
  id: string;
  project_id: string;
  integration_type: 'calendly' | 'mailchimp';
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

const integrationInfo = {
  calendly: {
    name: 'Calendly',
    description: 'Appointment scheduling for client bookings',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    docsUrl: 'https://developer.calendly.com/getting-started',
    keyHelp: 'Get your API key from Calendly → Integrations → API & Webhooks',
  },
  mailchimp: {
    name: 'Mailchimp',
    description: 'Email marketing and newsletter management',
    icon: Mail,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
    keyHelp: 'Get your API key from Mailchimp → Account → Extras → API keys',
  },
};

export default function ServicesPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const { data: projects } = useTeamProjects();

  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<
    'calendly' | 'mailchimp' | null
  >(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [integrationName, setIntegrationName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';

      if (!user) {
        router.push('/team/login');
      } else if (!isTeam) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
        fetchIntegrations();
      }
    }
  }, [user, userLoaded, router]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/team/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const openAddDialog = (type: 'calendly' | 'mailchimp') => {
    setSelectedType(type);
    setSelectedProject('');
    setApiKey('');
    setIntegrationName('');
    setShowApiKey(false);
    setDialogOpen(true);
  };

  const handleSaveIntegration = async () => {
    if (!selectedType || !selectedProject || !apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/team/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          integrationType: selectedType,
          name:
            integrationName ||
            `${integrationInfo[selectedType].name} Integration`,
          apiKey,
          config: {},
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save integration');
      }

      toast.success('Integration added successfully');
      setDialogOpen(false);
      fetchIntegrations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save integration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const res = await fetch(`/api/team/integrations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Integration deleted');
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      toast.error('Failed to delete integration');
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <TeamHeader />

      <PageContainer gradientVariant="dashboard">
        <GlassCard className="p-6 sm:p-8">
          {/* Back button */}
          <Link
            href="/team/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Page header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Services & Integrations
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Configure third-party services for client projects
              </p>
            </div>
          </div>

          {/* Security note */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 mb-8">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  API keys are encrypted at rest
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  All API keys are securely stored using Supabase Vault
                  encryption.
                </p>
              </div>
            </div>
          </div>

          {/* Available integrations */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Available Integrations
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {(['calendly', 'mailchimp'] as const).map((type) => {
                const info = integrationInfo[type];
                const Icon = info.icon;

                return (
                  <div
                    key={type}
                    className="p-5 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${info.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`w-5 h-5 ${info.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {info.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => openAddDialog(type)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/5">
                      <a
                        href={info.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--purple)] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View documentation
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configured integrations */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Configured Integrations
            </h3>

            {loadingIntegrations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-white/50">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No integrations configured yet</p>
                <p className="text-sm mt-1">
                  Add an integration to a project above
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => {
                  const info = integrationInfo[integration.integration_type];
                  const Icon = info.icon;

                  return (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${info.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${info.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {integration.name}
                            </span>
                            {integration.is_active ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            {getProjectName(integration.project_id)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </PageContainer>

      {/* Add Integration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {selectedType && integrationInfo[selectedType].name}{' '}
              Integration
            </DialogTitle>
            <DialogDescription>
              {selectedType && integrationInfo[selectedType].keyHelp}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name || 'Untitled Project'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Integration Name (optional)</Label>
              <Input
                id="name"
                placeholder={`My ${
                  selectedType && integrationInfo[selectedType].name
                }`}
                value={integrationName}
                onChange={(e) => setIntegrationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Encrypted with Supabase Vault
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveIntegration}
              disabled={saving || !selectedProject || !apiKey}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardWrapper>
  );
}
