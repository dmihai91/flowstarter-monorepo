'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Lock, RefreshCw, Plug } from 'lucide-react';

import type { Project } from './services.types';
import { useServicesPage } from './useServicesPage';
import { IntegrationDialog } from './IntegrationDialog';
import { ByProjectTab } from './ByProjectTab';
import { ByServiceTab } from './ByServiceTab';
import { TeamDashboardShell } from '../components/TeamDashboardShell';
import { AdminShellLoadingChrome } from '../components/AdminSkeletons';

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

  if (!pageReady || !userLoaded) {
    return (
      <AdminShellLoadingChrome>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-[var(--ls-accent)]"
            aria-hidden
          />
        </div>
      </AdminShellLoadingChrome>
    );
  }

  return (
    <>
      <TeamDashboardShell
        title="Services & integrations"
        subtitle="Configure third-party services per client project"
        icon={<Plug className="h-5 w-5" aria-hidden />}
        showBackButton
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIntegrations}
            disabled={loadingIntegrations}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loadingIntegrations ? 'animate-spin' : ''
              }`}
              aria-hidden
            />
            Refresh
          </Button>
        }
      >
        <section className="ls-card mb-6 p-5 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <Lock
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400"
              aria-hidden
            />
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-200">
                All credentials are encrypted at rest
              </p>
              <p className="mt-0.5 text-sm text-emerald-800/90 dark:text-emerald-300/90">
                API keys are stored via Supabase Vault (pgsodium). Only opaque
                UUID references live in the database, plaintext is never
                persisted.
              </p>
            </div>
          </div>
        </section>

        <Tabs defaultValue="by-project">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="by-project">By project</TabsTrigger>
              <TabsTrigger value="by-service">By service</TabsTrigger>
            </TabsList>

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
      </TeamDashboardShell>

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
