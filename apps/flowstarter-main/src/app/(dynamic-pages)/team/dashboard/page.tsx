'use client';

import { TeamProjectsList } from './components/TeamProjectsList';
import { TeamProjectsListSkeleton } from './components/TeamProjectsListSkeleton';
import { TeamProjectsStats } from './components/TeamProjectsStats';
import { TeamProjectsStatsSkeleton } from './components/TeamProjectsStatsSkeleton';
import { QuickScaffold } from './components/QuickScaffold';
import { DashboardLoader } from './components/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, UserPlus, FolderOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();

  const [isLoading, setIsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [isSendingToEditor, setIsSendingToEditor] = useState(false);
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
    setShowClientModal(true);
  };

  const handleClientSubmit = async () => {
    if (!clientInfo.name.trim() || !clientInfo.email.trim()) return;
    setIsSendingToEditor(true);
    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            clientName: clientInfo.name,
            clientEmail: clientInfo.email,
            clientPhone: clientInfo.phone,
          },
          mode: 'interactive',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(`${EDITOR_URL}?handoff=${data.token}`, '_blank');
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-gray-500 dark:text-white/50 mb-1 text-base sm:text-lg">
            {greeting},{' '}
            <span className="text-gray-700 dark:text-white/70 font-medium">
              {firstName}
            </span>
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button variant="accent" size="lg" className="w-full sm:w-auto" onClick={createNewInEditor}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          {isAdmin && (
            <Link href="/team/dashboard/invite" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
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
            className="w-full max-w-md mx-4 rounded-2xl p-6 relative"
            style={{
              background: 'var(--flow-bg-primary, #ffffff)',
              border: '1px solid var(--flow-border-default, #e4e4e7)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">New Project</h2>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-5">Client details for this project</p>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Email *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Client Phone</Label>
                <Input
                  placeholder="+40 712 345 678"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
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
                disabled={!clientInfo.name.trim() || !clientInfo.email.trim() || isSendingToEditor}
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
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl p-12 text-center">
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
