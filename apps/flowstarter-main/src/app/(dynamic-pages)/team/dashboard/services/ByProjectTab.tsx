'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { Settings, Loader2, Trash2, RefreshCw } from 'lucide-react';

import type { Integration, IntegrationType, Project } from './services.types';
import { INTEGRATION_META, ALL_TYPES } from './services.types';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';

interface ByProjectTabProps {
  projects: Project[] | undefined;
  selectedProjectId: string;
  loadingIntegrations: boolean;
  byProject: Record<string, Integration[]>;
  configuredTypes: (projectId: string) => IntegrationType[];
  testing: boolean;
  openAddDialog: (type: IntegrationType, projectId?: string) => void;
  openEditDialog: (integration: Integration) => void;
  handleTestConnection: (integration: Integration) => void;
  handleDelete: (id: string) => void;
  t: (key: string) => string;
}

export function ByProjectTab({
  projects,
  selectedProjectId,
  loadingIntegrations,
  byProject,
  configuredTypes,
  testing,
  openAddDialog,
  openEditDialog,
  handleTestConnection,
  handleDelete,
  t,
}: ByProjectTabProps) {
  return (
    <TabsContent value="by-project" className="space-y-4">
      {loadingIntegrations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : projects?.length === 0 ? (
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
        projects
          ?.filter(
            (p) =>
              selectedProjectId === 'all' || p.id === selectedProjectId
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
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                    >
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
  );
}
