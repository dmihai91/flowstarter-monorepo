'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import {
  ExternalLink,
  BarChart3,
  Plus,
  Trash2,
  Loader2,
  Settings,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

import type { Integration, IntegrationType } from './services.types';
import { INTEGRATION_META, ALL_TYPES } from './services.types';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';

interface ByServiceTabProps {
  filteredIntegrations: Integration[];
  loadingIntegrations: boolean;
  testing: boolean;
  openAddDialog: (type: IntegrationType, projectId?: string) => void;
  openEditDialog: (integration: Integration) => void;
  handleTestConnection: (integration: Integration) => void;
  handleDelete: (id: string) => void;
  getProjectName: (projectId: string) => string;
}

export function ByServiceTab({
  filteredIntegrations,
  loadingIntegrations,
  testing,
  openAddDialog,
  openEditDialog,
  handleTestConnection,
  handleDelete,
  getProjectName,
}: ByServiceTabProps) {
  return (
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
                  <h3 className="font-semibold text-[var(--fs-ink)]">
                    {meta.name}
                  </h3>
                  <p className="text-sm text-[var(--fs-ink-faint)]">
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
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--fs-bg-elevated)] border border-[var(--fs-rule)]"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm text-[var(--fs-ink)]">
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
                        onClick={() => handleTestConnection(integration)}
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
            <h3 className="font-semibold text-[var(--fs-ink)]">
              Google Analytics
            </h3>
            <p className="text-sm text-[var(--fs-ink-faint)]">
              Configured per-project via the Analytics section in each project's
              settings.
            </p>
          </div>
        </div>
      </GlassCard>
    </TabsContent>
  );
}
