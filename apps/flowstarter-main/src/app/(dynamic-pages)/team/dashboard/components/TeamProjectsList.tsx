'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useTeamDeleteProject,
  useTeamRenameProject,
  useTeamUpdateProjectPricing,
} from '@/hooks/useTeamProjects';
import type { ProjectPricingData } from '@/hooks/useTeamProjects';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Table as TableType } from '@/types';
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  Clock,
  User,
  LayoutGrid,
  List,
  Pencil,
  Globe,
  Mail,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFormatDate } from '@/hooks/useFormatDate';

// Beta pricing feature flag - set to true to enable 50% discount
const BETA_PRICING_ENABLED = process.env.NEXT_PUBLIC_BETA_PRICING === 'true';
const BETA_DISCOUNT = 0.5; // 50% off

// Apply beta discount to a price
const applyBetaDiscount = (price: number): number => {
  if (!BETA_PRICING_ENABLED) return price;
  return Math.round(price * (1 - BETA_DISCOUNT));
};

interface ProjectWithOwner extends TableType<'projects'> {
  owner_email?: string | null;
  owner_name?: string | null;
}

interface TeamProjectsListProps {
  projects: Array<ProjectWithOwner>;
}

export function TeamProjectsList({ projects }: TeamProjectsListProps) {
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'team-projects-view',
    'grid'
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState('');
  const deleteProjectMutation = useTeamDeleteProject();
  const renameProjectMutation = useTeamRenameProject();
  const { formatTimeAgo, formatDate } = useFormatDate();

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      toast.success('Project deleted successfully');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleRenameProject = async () => {
    if (!projectToRename || !newName.trim()) return;

    try {
      await renameProjectMutation.mutateAsync({
        id: projectToRename.id,
        name: newName.trim(),
      });
      toast.success('Project renamed successfully');
      setRenameDialogOpen(false);
      setProjectToRename(null);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename project:', error);
      toast.error('Failed to rename project');
    }
  };

  const openRenameDialog = (project: { id: string; name: string }) => {
    setProjectToRename(project);
    setNewName(project.name);
    setRenameDialogOpen(true);
  };

  // Pricing dialog state
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [projectToPricep, setProjectToPrice] =
    useState<ProjectWithOwner | null>(null);
  const [pricingData, setPricingData] = useState<ProjectPricingData>({
    project_type: 'standard',
    setup_fee: 0,
    monthly_fee: 0,
    is_paid: false,
  });
  const updatePricingMutation = useTeamUpdateProjectPricing();

  // Default pricing by project type (in EUR)
  // Base prices (after founding rate period)
  // Founding rate = ~40% off: Standard €599/€39, Pro €899/€59
  const BASE_PRICING: Record<
    string,
    { setup_fee: number; monthly_fee: number }
  > = {
    standard: { setup_fee: 999, monthly_fee: 59 },
    pro: { setup_fee: 1499, monthly_fee: 99 },
    ecommerce: { setup_fee: 1999, monthly_fee: 149 },
    business: { setup_fee: 1999, monthly_fee: 149 }, // alias for ecommerce
  };

  // Apply beta discount if enabled
  const PRICING_DEFAULTS: Record<
    string,
    { setup_fee: number; monthly_fee: number }
  > = Object.fromEntries(
    Object.entries(BASE_PRICING).map(([key, val]) => [
      key,
      {
        setup_fee: applyBetaDiscount(val.setup_fee),
        monthly_fee: applyBetaDiscount(val.monthly_fee),
      },
    ])
  );

  const openPricingDialog = (project: ProjectWithOwner) => {
    setProjectToPrice(project);
    const projectType = project.project_type || 'standard';
    const defaults = PRICING_DEFAULTS[projectType] || PRICING_DEFAULTS.standard;
    // Use stored values only if > 0, otherwise use defaults
    setPricingData({
      project_type: projectType,
      setup_fee:
        project.setup_fee && project.setup_fee > 0
          ? project.setup_fee
          : defaults.setup_fee,
      monthly_fee:
        project.monthly_fee && project.monthly_fee > 0
          ? project.monthly_fee
          : defaults.monthly_fee,
      is_paid: project.is_paid || false,
    });
    setPricingDialogOpen(true);
  };

  const handleProjectTypeChange = (newType: string) => {
    const defaults = PRICING_DEFAULTS[newType] || PRICING_DEFAULTS.standard;
    setPricingData({
      ...pricingData,
      project_type: newType,
      setup_fee: defaults.setup_fee,
      monthly_fee: defaults.monthly_fee,
    });
  };

  const handleUpdatePricing = async () => {
    if (!projectToPricep) return;

    try {
      await updatePricingMutation.mutateAsync({
        id: projectToPricep.id,
        ...pricingData,
      });
      toast.success('Pricing updated successfully');
      setPricingDialogOpen(false);
      setProjectToPrice(null);
    } catch (error) {
      console.error('Failed to update pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const getTimeAgo = (date: string | null) => formatTimeAgo(date);

  const getOwnerDisplay = (project: ProjectWithOwner) => {
    if (project.owner_name) return project.owner_name;
    if (project.owner_email) return project.owner_email;
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (
      status === 'generating' ||
      status === 'building' ||
      status === 'in_progress'
    )
      return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Live';
    if (status === 'generating') return 'Building';
    return 'Draft';
  };

  if (projects.length === 0) {
    return (
      <>
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">
              All Projects
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              View and manage all client projects
            </p>
          </div>
        </div>
        <div className="border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/[0.02] p-12 text-center">
          <p className="text-gray-500 dark:text-white/50 text-sm">
            No projects yet
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
            All Projects
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            View and manage all client projects
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
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_100px_150px_100px_40px] gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider">
            <div>Project</div>
            <div>Status</div>
            <div>Owner</div>
            <div>Updated</div>
            <div></div>
          </div>

          {/* Project Rows */}
          <div className="border border-white/20 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-white/10 dark:divide-white/5 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/[0.03]">
            {projects.map((project) => {
              const status =
                typeof project.status === 'string' ? project.status : 'draft';

              return (
                <div
                  key={project.id}
                  className="bg-transparent hover:bg-white/30 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on dropdown
                    if (
                      (e.target as HTMLElement).closest(
                        '[data-radix-collection-item]'
                      ) ||
                      (e.target as HTMLElement).closest('button')
                    ) {
                      return;
                    }
                    window.location.href = `/team/dashboard/projects/${project.id}`;
                  }}
                >
                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-[1fr_100px_150px_100px_40px] gap-4 px-4 py-3 items-center">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {project.name || 'Untitled Project'}
                      </p>
                      {project.description && (
                        <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          status
                        )}`}
                      />
                      <span className="text-sm text-gray-600 dark:text-white/60">
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-white/60 truncate">
                      {getOwnerDisplay(project)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-white/40">
                      {getTimeAgo(project.updated_at || project.created_at)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            (window.location.href = `/team/dashboard/projects/${project.id}`)
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Project
                        </DropdownMenuItem>
                        {status === 'completed' && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/projects/${project.id}`, '_blank')
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Site
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/team/dashboard/domains?project=${project.id}`,
                              '_self'
                            )
                          }
                        >
                          <Globe className="h-4 w-4" />
                          Configure Domain
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/team/dashboard/email?project=${project.id}`,
                              '_self'
                            )
                          }
                        >
                          <Mail className="h-4 w-4" />
                          Setup Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/team/dashboard/analytics?project=${project.id}`,
                              '_self'
                            )
                          }
                        >
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openRenameDialog({
                              id: project.id,
                              name: project.name || 'Untitled',
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openPricingDialog(project)}
                        >
                          <DollarSign className="h-4 w-4" />
                          Pricing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setProjectToDelete({
                              id: project.id,
                              name: project.name || 'Untitled',
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {project.name || 'Untitled Project'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-white/40">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${getStatusColor(
                                status
                              )}`}
                            />
                            {getStatusLabel(status)}
                          </span>
                          <span>{getOwnerDisplay(project)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              (window.location.href = `/team/dashboard/projects/${project.id}`)
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Project
                          </DropdownMenuItem>
                          {status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/projects/${project.id}`, '_blank')
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Site
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/team/dashboard/domains?project=${project.id}`,
                                '_self'
                              )
                            }
                          >
                            <Globe className="h-4 w-4" />
                            Configure Domain
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/team/dashboard/email?project=${project.id}`,
                                '_self'
                              )
                            }
                          >
                            <Mail className="h-4 w-4" />
                            Setup Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/team/dashboard/analytics?project=${project.id}`,
                                '_self'
                              )
                            }
                          >
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              openRenameDialog({
                                id: project.id,
                                name: project.name || 'Untitled',
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openPricingDialog(project)}
                          >
                            <DollarSign className="h-4 w-4" />
                            Pricing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setProjectToDelete({
                                id: project.id,
                                name: project.name || 'Untitled',
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          {projects.map((project) => {
            const status =
              typeof project.status === 'string' ? project.status : 'draft';

            return (
              <div
                key={project.id}
                className="group relative p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)_inset] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.2),0_12px_24px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.08)_inset] hover:border-[var(--purple)]/30 transition-all cursor-pointer"
                onClick={() =>
                  (window.location.href = `/team/dashboard/projects/${project.id}`)
                }
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  {/* Project Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center text-lg font-semibold text-[var(--purple)] shrink-0">
                    {project.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Status Badge */}
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-1 ${
                        status === 'completed' || status === 'live'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : status === 'in_progress' || status === 'building'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-white text-base truncate">
                      {project.name || 'Untitled Project'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          (window.location.href = `/team/dashboard/projects/${project.id}`)
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Project
                      </DropdownMenuItem>
                      {status === 'completed' && (
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`/projects/${project.id}`, '_blank')
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Site
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/team/dashboard/domains?project=${project.id}`,
                            '_self'
                          )
                        }
                      >
                        <Globe className="h-4 w-4" />
                        Configure Domain
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/team/dashboard/email?project=${project.id}`,
                            '_self'
                          )
                        }
                      >
                        <Mail className="h-4 w-4" />
                        Setup Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/team/dashboard/analytics?project=${project.id}`,
                            '_self'
                          )
                        }
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          openRenameDialog({
                            id: project.id,
                            name: project.name || 'Untitled',
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openPricingDialog(project)}
                      >
                        <DollarSign className="h-4 w-4" />
                        Pricing
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setProjectToDelete({
                            id: project.id,
                            name: project.name || 'Untitled',
                          });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-white/40 line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                {/* Pricing info - show only if pricing has been set (not default 0) */}
                {project.setup_fee !== null &&
                  project.setup_fee !== undefined &&
                  Number(project.setup_fee) > 0 && (
                    <div className="flex items-center gap-3 mb-4 py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
                      <span className="text-gray-600 dark:text-white/60">
                        €{project.setup_fee} setup
                      </span>
                      <span className="text-gray-300 dark:text-white/20">
                        •
                      </span>
                      <span className="text-gray-600 dark:text-white/60">
                        €{project.monthly_fee || 0}/mo
                      </span>
                      {project.is_paid && (
                        <>
                          <span className="text-gray-300 dark:text-white/20">
                            •
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Paid
                          </span>
                        </>
                      )}
                    </div>
                  )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/40 pt-3 border-t border-gray-100 dark:border-white/5">
                  <span>{getOwnerDisplay(project)}</span>
                  <span>
                    Last edit:{' '}
                    {getTimeAgo(project.updated_at || project.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChangeAction={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={
          deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'
        }
        cancelLabel="Cancel"
        onConfirmAction={handleDeleteProject}
        confirmVariant="destructive"
      />

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameProject();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleRenameProject}
              disabled={renameProjectMutation.isPending || !newName.trim()}
            >
              {renameProjectMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Project Pricing
              {BETA_PRICING_ENABLED && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">
                  Beta -50%
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Project Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Type</Label>
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
                  Standard
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                >
                  Pro
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                >
                  Business
                </button>
              </div>
            </div>

            {/* Fees Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setup_fee" className="text-sm font-medium">
                  Setup Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    €
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
                  Monthly Fee
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    €
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
                <p className="text-sm font-medium">Payment Received</p>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  Mark as paid to count in revenue
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
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleUpdatePricing}
              disabled={updatePricingMutation.isPending}
            >
              {updatePricingMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
