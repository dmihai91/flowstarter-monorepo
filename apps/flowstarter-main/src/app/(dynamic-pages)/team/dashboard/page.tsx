'use client';

import { TeamProjectsList } from './components/TeamProjectsList';
import { TeamProjectsListSkeleton } from './components/TeamProjectsListSkeleton';
import { TeamProjectsStats } from './components/TeamProjectsStats';
import { TeamProjectsStatsSkeleton } from './components/TeamProjectsStatsSkeleton';
import { QuickScaffold } from './components/QuickScaffold';
import { DashboardLoader } from './components/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, UserPlus, FolderOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || (process.env.NODE_ENV === 'production' ? 'https://editor.flowstarter.dev' : 'http://localhost:5173');

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().refine(
    (val) => !val || /^[+]?[\d\s()-]{7,}$/.test(val),
    'Please enter a valid phone number'
  ),
});

type ClientErrors = Partial<Record<keyof z.infer<typeof clientSchema>, string>>;

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [isSendingToEditor, setIsSendingToEditor] = useState(false);
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback((field: keyof ClientErrors, value: string) => {
    if (debounceTimers.current[field]) clearTimeout(debounceTimers.current[field]);
    debounceTimers.current[field] = setTimeout(() => {
      const result = clientSchema.shape[field].safeParse(value);
      if (!result.success) {
        setClientErrors(prev => ({ ...prev, [field]: result.error.issues[0].message }));
      } else {
        setClientErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, 400);
  }, []);

  const validateFieldImmediate = useCallback((field: keyof ClientErrors, value: string) => {
    if (debounceTimers.current[field]) clearTimeout(debounceTimers.current[field]);
    const result = clientSchema.shape[field].safeParse(value);
    if (!result.success) {
      setClientErrors(prev => ({ ...prev, [field]: result.error.issues[0].message }));
    } else {
      setClientErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is team member
  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();

      if (!user) {
        router.push('/login');
      } else {
        setIsAdmin(role === 'admin');
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  if (isLoading || !userLoaded) {
    return <DashboardLoader />;
  }

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('dashboard.greeting.morning') : hour < 18 ? t('dashboard.greeting.afternoon') : t('dashboard.greeting.evening');

  // Count projects by status
  const activeProjects = projects?.filter(p => 
    p.status === 'in_progress' || p.status === 'building' || p.status === 'draft'
  ).length || 0;


  const createNewInEditor = () => {
    setClientInfo({ name: '', email: '', phone: '' });
    setClientErrors({});
    setShowClientModal(true);
  };

  const handleClientSubmit = async () => {
    const result = clientSchema.safeParse(clientInfo);
    if (!result.success) {
      const fieldErrors: ClientErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ClientErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setClientErrors(fieldErrors);
      return;
    }
    setClientErrors({});
    setIsSendingToEditor(true);
    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            projectName: `${clientInfo.name} — Website`,
            clientName: clientInfo.name,
            clientEmail: clientInfo.email,
            clientPhone: clientInfo.phone,
          },
          mode: 'interactive',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        queryClient.invalidateQueries({ queryKey: ['team-projects'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        window.open(data.editorUrl || `${EDITOR_URL}?handoff=${data.token}`, '_blank');
      } else {
        window.open(EDITOR_URL, '_blank');
      }
    } catch {
      window.open(EDITOR_URL, '_blank');
    }
    setIsSendingToEditor(false);
    setShowClientModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-1 sm:mt-2 mb-8">
        <div>
          <p className="text-gray-500 dark:text-white/50 mb-1 text-sm sm:text-base">
            {greeting},{' '}
            <span className="text-gray-700 dark:text-white/70 font-medium">
              {firstName}
            </span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button variant="accent" size="default" className="w-full sm:w-auto" onClick={createNewInEditor}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          {isAdmin && (
            <Link href="/team/dashboard/invite" className="w-full sm:w-auto">
              <Button variant="outline" size="default" className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Invite Member</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Scaffold Tool */}
      <div className="mb-8">
        <QuickScaffold />
      </div>

      {/* Stats Row */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsStatsSkeleton />
        ) : (
          <TeamProjectsStats projects={projects || []} />
        )}
      </div>

      {/* Client Info Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowClientModal(false)}>
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6 relative backdrop-blur-2xl shadow-[var(--glass-shadow)]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--glass-surface) 95%, transparent)',
              borderTop: '1px solid var(--glass-border-highlight)',
              borderLeft: '1px solid var(--glass-border-highlight)',
              borderBottom: '1px solid var(--glass-border-shadow)',
              borderRight: '1px solid var(--glass-border-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-white/50" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">New Project</h2>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-5">Enter client details for this project</p>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Name *</Label>
                <Input
                  placeholder={t('team.dashboard.namePlaceholder')}
                  value={clientInfo.name}
                  onChange={(e) => { const v = e.target.value; setClientInfo(prev => ({ ...prev, name: v })); validateField('name', v); }}
                  onBlur={() => validateFieldImmediate('name', clientInfo.name)}
                  className={`mt-1 ${clientErrors.name ? 'border-red-400 dark:border-red-500/50' : ''}`}
                />
                {clientErrors.name && <p className="text-xs text-red-500 mt-1">{clientErrors.name}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Email *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={clientInfo.email}
                  onChange={(e) => { const v = e.target.value; setClientInfo(prev => ({ ...prev, email: v })); validateField('email', v); }}
                  onBlur={() => validateFieldImmediate('email', clientInfo.email)}
                  className={`mt-1 ${clientErrors.email ? 'border-red-400 dark:border-red-500/50' : ''}`}
                />
                {clientErrors.email && <p className="text-xs text-red-500 mt-1">{clientErrors.email}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Phone</Label>
                <Input
                  placeholder="+40 712 345 678"
                  value={clientInfo.phone}
                  onChange={(e) => { const v = e.target.value; setClientInfo(prev => ({ ...prev, phone: v })); if (v) validateField('phone', v); else setClientErrors(prev => ({ ...prev, phone: undefined })); }}
                  onBlur={() => { if (clientInfo.phone) validateFieldImmediate('phone', clientInfo.phone); }}
                  className={`mt-1 ${clientErrors.phone ? 'border-red-400 dark:border-red-500/50' : ''}`}
                />
                {clientErrors.phone && <p className="text-xs text-red-500 mt-1">{clientErrors.phone}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowClientModal(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                onClick={handleClientSubmit}
                disabled={clientInfo.name.trim().length < 2 || !clientInfo.email.includes('@') || isSendingToEditor}
              >
                {isSendingToEditor ? 'Opening Editor...' : 'Continue in Editor'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* All Projects */}
      <div className="mb-8">
        {projectsLoading ? (
          <TeamProjectsListSkeleton count={3} />
        ) : projects && projects.length > 0 ? (
          <TeamProjectsList projects={projects} />
        ) : (
          <div className="rounded-2xl bg-white/80 dark:bg-[var(--glass-surface)]/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),1px_1px_0_rgba(0,0,0,0.3)_inset,-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400 dark:text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-white/50 mb-6 max-w-sm mx-auto">
              Start a new project manually or use the scaffold generator above to create a quick draft.
            </p>
            <Button variant="accent" onClick={createNewInEditor}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
