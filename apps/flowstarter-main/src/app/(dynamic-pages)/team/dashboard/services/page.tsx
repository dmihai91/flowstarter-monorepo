'use client';

import { PageContainer } from '@/components/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, RefreshCw, Plug } from 'lucide-react';

import type { Project } from './services.types';
import { useServicesPage } from './useServicesPage';
import { IntegrationDialog } from './IntegrationDialog';
import { ByProjectTab } from './ByProjectTab';
import { ByServiceTab } from './ByServiceTab';

export default function ServicesPage() {
  const {
    t,
    projects,
    pageReady,
    userLoaded,
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
  } = useServicesPage();

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!pageReady || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
                  className={`w-4 h-4 mr-2 ${
                    loadingIntegrations ? 'animate-spin' : ''
                  }`}
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

            <ByProjectTab
              projects={projects as Project[] | undefined}
              selectedProjectId={selectedProjectId}
              loadingIntegrations={loadingIntegrations}
              byProject={byProject}
              configuredTypes={configuredTypes}
              testing={testing}
              openAddDialog={openAddDialog}
              openEditDialog={openEditDialog}
              handleTestConnection={handleTestConnection}
              handleDelete={handleDelete}
              t={t}
            />

            <ByServiceTab
              filteredIntegrations={filteredIntegrations}
              loadingIntegrations={loadingIntegrations}
              testing={testing}
              openAddDialog={openAddDialog}
              openEditDialog={openEditDialog}
              handleTestConnection={handleTestConnection}
              handleDelete={handleDelete}
              getProjectName={getProjectName}
            />
          </Tabs>
        </div>
      </PageContainer>

      <IntegrationDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        editingIntegration={editingIntegration}
        dialogType={dialogType}
        dialogProject={dialogProject}
        setDialogProject={setDialogProject}
        apiKey={apiKey}
        setApiKey={setApiKey}
        integrationName={integrationName}
        setIntegrationName={setIntegrationName}
        showApiKey={showApiKey}
        setShowApiKey={setShowApiKey}
        saving={saving}
        handleSave={handleSave}
        projects={projects as Project[] | undefined}
        t={t}
      />
    </>
  );
}
