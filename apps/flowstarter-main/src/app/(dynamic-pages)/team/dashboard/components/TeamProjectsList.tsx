'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Table as TableType } from '@/types';
import {
  LayoutGrid,
  List,
} from 'lucide-react';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useTranslations } from '@/lib/i18n';
import { isLive, isBuilding } from './TeamProjectsStats';
import { TeamProjectActionMenu } from './TeamProjectActionMenu';
import { TeamProjectCard } from './TeamProjectCard';
import { useTeamProjectsView } from '../hooks/useTeamProjectsView';
import { useTeamProjectDialogs, BETA_PRICING_ENABLED, PRICING_DEFAULTS } from '../hooks/useTeamProjectDialogs';
import { useTeamProjectActions } from '../hooks/useTeamProjectActions';

interface ProjectWithOwner extends TableType<'projects'> {
  project_type?: string;
  setup_fee?: number;
  monthly_fee?: number;
  is_paid?: boolean;
  owner_email?: string | null;
  owner_name?: string | null;
}

interface TeamProjectsListProps {
  projects: Array<ProjectWithOwner>;
}

function getStatusColor(status: string) {
  if (isLive(status)) return 'bg-emerald-500';
  if (isBuilding(status)) return 'bg-blue-500';
  return 'bg-gray-400';
}

function getStatusLabel(status: string, t: (key: string) => string) {
  if (isLive(status)) return t('status.live');
  if (isBuilding(status)) return t('status.building');
  return t('status.draft');
}

function getOwnerDisplay(project: ProjectWithOwner, fallback: string) {
  if (project.owner_name) return project.owner_name;
  if (project.owner_email) return project.owner_email;
  return fallback;
}

export function TeamProjectsList({ projects }: TeamProjectsListProps) {
  const { t } = useTranslations();
  const { formatTimeAgo } = useFormatDate();
  const { viewMode, setViewMode } = useTeamProjectsView();

  const {
    deleteDialogOpen,
    setDeleteDialogOpen,
    projectToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    renameDialogOpen,
    setRenameDialogOpen,
    projectToRename,
    newName,
    setNewName,
    openRenameDialog,
    pricingDialogOpen,
    setPricingDialogOpen,
    projectToPrice,
    pricingData,
    setPricingData,
    openPricingDialog,
    closePricingDialog,
    handleProjectTypeChange,
  } = useTeamProjectDialogs();

  const {
    handleDeleteProject,
    handleRenameProject,
    handleUpdatePricing,
    openInEditor,
    isDeleting,
    isRenaming,
    isUpdatingPricing,
  } = useTeamProjectActions();

  if (projects.length === 0) {
    return (
      <>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">
              {t('team.dashboard.allProjects')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              {t('team.dashboard.allProjectsDescription')}
            </p>
          </div>
        </div>
        <div className="border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <p className="text-gray-500 dark:text-white/50 text-sm">
            {t('team.dashboard.noProjects')}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">
            {t('team.dashboard.allProjects')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            {t('team.dashboard.allProjectsDescription')}
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-white/10 p-1 bg-gray-50 dark:bg-white/[0.02]">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[1fr_100px_150px_100px_40px] gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
            <div>{t('team.dashboard.table.project')}</div>
            <div>{t('team.dashboard.table.status')}</div>
            <div>{t('team.dashboard.table.owner')}</div>
            <div>{t('team.dashboard.table.updated')}</div>
            <div></div>
          </div>

          <div className="border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] rounded-xl overflow-hidden divide-y divide-white/10 dark:divide-white/5 bg-white/55 dark:bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/[0.03]">
            {projects.map((project) => {
              const status =
                typeof project.status === 'string' ? project.status : 'draft';

              return (
                <div
                  key={project.id}
                  className="bg-transparent hover:bg-white/30 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        '[data-radix-collection-item]'
                      ) ||
                      (e.target as HTMLElement).closest('button')
                    ) {
                      return;
                    }
                    openInEditor(project.id);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openInEditor(project.id);
                  }}
                >
                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-[1fr_100px_150px_100px_40px] gap-4 px-4 py-3 items-center">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {project.name || t('team.dashboard.untitledProject')}
                      </p>
                      {project.description && (
                        <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
                      />
                      <span className="text-sm text-gray-600 dark:text-white/60">
                        {getStatusLabel(status, t)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-white/60 truncate">
                      {getOwnerDisplay(project, t('team.dashboard.unknownOwner'))}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white/40">
                      {formatTimeAgo(project.updated_at || project.created_at)}
                    </div>
                    <TeamProjectActionMenu
                      project={project}
                      onOpenInEditor={openInEditor}
                      onRename={openRenameDialog}
                      onPricing={(p) => openPricingDialog(p)}
                      onDelete={openDeleteDialog}
                    />
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {project.name || t('team.dashboard.untitledProject')}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-white/40">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
                            />
                            {getStatusLabel(status, t)}
                          </span>
                          <span>{getOwnerDisplay(project, t('team.dashboard.unknownOwner'))}</span>
                        </div>
                      </div>
                      <TeamProjectActionMenu
                        project={project}
                        onOpenInEditor={openInEditor}
                        onRename={openRenameDialog}
                        onPricing={(p) => openPricingDialog(p)}
                        onDelete={openDeleteDialog}
                        menuWidth="w-40"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <TeamProjectCard
              key={project.id}
              project={project}
              timeAgo={formatTimeAgo(project.updated_at || project.created_at)}
              onOpenInEditor={openInEditor}
              onRename={openRenameDialog}
              onPricing={(p) => openPricingDialog(p)}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChangeAction={setDeleteDialogOpen}
        title={t('team.dashboard.deleteProject')}
        description={t('team.dashboard.deleteConfirm', { name: projectToDelete?.name || '' })}
        confirmLabel={isDeleting ? t('app.deleting') : t('app.delete')}
        cancelLabel={t('app.cancel')}
        onConfirmAction={() =>
          handleDeleteProject(projectToDelete!.id, closeDeleteDialog)
        }
        confirmVariant="destructive"
      />

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('team.dashboard.renameProject')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('team.dashboard.projectNamePlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && projectToRename) {
                  handleRenameProject(projectToRename.id, newName, () => {
                    setRenameDialogOpen(false);
                    setNewName('');
                  });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              {t('app.cancel')}
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (projectToRename) {
                  handleRenameProject(projectToRename.id, newName, () => {
                    setRenameDialogOpen(false);
                    setNewName('');
                  });
                }
              }}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? t('app.saving') : t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('team.dashboard.projectPricing')}
              {BETA_PRICING_ENABLED && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">
                  {t('team.dashboard.betaDiscount')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Project Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('team.dashboard.projectType')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleProjectTypeChange('standard')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    pricingData.project_type === 'standard'
                      ? 'border-[var(--purple)] bg-[var(--purple)]/10 text-[var(--purple)]'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  {t('team.dashboard.typeStandard')}
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                >
                  {t('team.dashboard.typePro')}
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                >
                  {t('team.dashboard.typeBusiness')}
                </button>
              </div>
            </div>

            {/* Fees Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setup_fee" className="text-sm font-medium">
                  {t('team.dashboard.setupFee')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    &euro;
                  </span>
                  <Input
                    id="setup_fee"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pricingData.setup_fee || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPricingData({
                        ...pricingData,
                        setup_fee: val ? parseInt(val, 10) : 0,
                      });
                    }}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_fee" className="text-sm font-medium">
                  {t('team.dashboard.monthlyFee')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    &euro;
                  </span>
                  <Input
                    id="monthly_fee"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pricingData.monthly_fee || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPricingData({
                        ...pricingData,
                        monthly_fee: val ? parseInt(val, 10) : 0,
                      });
                    }}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            {/* Paid Toggle */}
            <button
              type="button"
              onClick={() =>
                setPricingData({
                  ...pricingData,
                  is_paid: !pricingData.is_paid,
                })
              }
              className={`flex items-center justify-between w-full py-3 px-4 rounded-lg border transition-colors ${
                pricingData.is_paid
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{t('team.dashboard.paymentReceived')}</p>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  {t('team.dashboard.paymentReceivedDesc')}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  pricingData.is_paid
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-300 dark:border-white/30'
                }`}
              >
                {pricingData.is_paid && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPricingDialogOpen(false)}
            >
              {t('app.cancel')}
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (projectToPrice) {
                  handleUpdatePricing(
                    projectToPrice.id,
                    pricingData,
                    closePricingDialog
                  );
                }
              }}
              disabled={isUpdatingPricing}
            >
              {isUpdatingPricing ? t('app.saving') : t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
