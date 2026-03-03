'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  Pencil,
  Globe,
  Mail,
  BarChart3,
  DollarSign,
  Code,
} from 'lucide-react';

interface TeamProjectActionMenuProject {
  id: string;
  name: string | null;
  status: string | null;
  project_type?: string;
  setup_fee?: number;
  monthly_fee?: number;
  is_paid?: boolean;
}

interface TeamProjectActionMenuProps {
  project: TeamProjectActionMenuProject;
  onOpenInEditor: (projectId: string) => void;
  onRename: (project: { id: string; name: string }) => void;
  onPricing: (project: TeamProjectActionMenuProject) => void;
  onDelete: (project: { id: string; name: string }) => void;
  align?: 'start' | 'end';
  className?: string;
  menuWidth?: string;
  stopPropagation?: boolean;
}

export function TeamProjectActionMenu({
  project,
  onOpenInEditor,
  onRename,
  onPricing,
  onDelete,
  align = 'end',
  className = 'h-8 w-8',
  menuWidth = 'w-48',
  stopPropagation = false,
}: TeamProjectActionMenuProps) {
  const { t } = useTranslations();
  const status = typeof project.status === 'string' ? project.status : 'draft';
  const projectName = project.name || t('team.dashboard.untitledProject');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`${className} shrink-0`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={menuWidth}
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        <DropdownMenuItem onClick={() => onOpenInEditor(project.id)}>
          <Code className="h-4 w-4" />
          {t('team.dashboard.actions.openInEditor')}
        </DropdownMenuItem>
        {status === 'completed' && (
          <DropdownMenuItem
            onClick={() => window.open(`/projects/${project.id}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            {t('team.dashboard.actions.viewSite')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() =>
            window.open(`/team/dashboard/domains?project=${project.id}`, '_self')
          }
        >
          <Globe className="h-4 w-4" />
          {t('team.dashboard.actions.configureDomain')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(`/team/dashboard/email?project=${project.id}`, '_self')
          }
        >
          <Mail className="h-4 w-4" />
          {t('team.dashboard.actions.setupEmail')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(`/team/dashboard/analytics?project=${project.id}`, '_self')
          }
        >
          <BarChart3 className="h-4 w-4" />
          {t('team.dashboard.actions.analytics')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRename({ id: project.id, name: projectName })}
        >
          <Pencil className="h-4 w-4" />
          {t('team.dashboard.actions.rename')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPricing(project)}>
          <DollarSign className="h-4 w-4" />
          {t('team.dashboard.actions.pricing')}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete({ id: project.id, name: projectName })}
        >
          <Trash2 className="h-4 w-4" />
          {t('team.dashboard.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
