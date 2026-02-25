'use client';

import { PageContainer } from '@/components/PageContainer';
import { ProjectsList } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsList';
import { ProjectsListSkeleton } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsListSkeleton';
import { DashboardHero } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardHero';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { PageSectionHeader } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/PageSectionHeader';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Globe, 
  Mail, 
  BarChart3, 
  Settings, 
  LogOut,
  Loader2,
  UserPlus,
  Shield
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is team member
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
        setIsAdmin(role === 'admin');
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/team/login');
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
      {/* Custom header for team */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/team/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Flowstarter</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
                Team
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-white/50">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
            <Link
              href="/team/dashboard/security"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              Security
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <PageContainer gradientVariant="dashboard">
        <DashboardHero>
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Client Projects
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                Manage all client websites and configure services
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/team/dashboard/invite">
                  <Button variant="outline" className="rounded-xl h-11 px-5 border-gray-200 dark:border-white/10 hover:border-[var(--purple)]/50">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </Link>
              )}
              <Link href="/team/dashboard/new">
                <Button className="bg-gradient-to-r from-[var(--purple)] to-blue-500 hover:from-[var(--purple)]/90 hover:to-blue-500/90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--purple)]/20 h-11 px-5">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Globe, label: 'Configure Domain', desc: 'DNS & SSL setup', color: 'text-blue-500' },
              { icon: Mail, label: 'Setup Email', desc: 'Zoho Mail config', color: 'text-emerald-500' },
              { icon: BarChart3, label: 'Analytics', desc: 'Google Analytics', color: 'text-amber-500' },
              { icon: Settings, label: 'Services', desc: 'Integrations', color: 'text-purple-500' },
            ].map((action, i) => (
              <button
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/10 hover:border-[var(--purple)]/30 dark:hover:border-[var(--purple)]/30 transition-all group backdrop-blur-sm"
              >
                <div className={`p-2.5 rounded-lg bg-gray-100 dark:bg-white/5 ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="flex-grow border-t border-gray-200/60 dark:border-white/10"></div>
          </div>

          {/* Projects */}
          <div className="mb-8">
            <PageSectionHeader
              title="All Projects"
              subtitle="View and manage all client projects"
            />
            
            {projectsLoading ? (
              <ProjectsListSkeleton count={3} />
            ) : (
              <ProjectsList projects={projects || []} showActions={false} />
            )}
          </div>
        </DashboardHero>
      </PageContainer>
    </DashboardWrapper>
  );
}
