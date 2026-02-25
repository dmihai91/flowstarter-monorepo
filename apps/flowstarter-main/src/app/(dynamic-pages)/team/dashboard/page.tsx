'use client';

import { PageContainer } from '@/components/PageContainer';
import { ProjectsListSkeleton } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsListSkeleton';
import { TeamProjectsList } from './components/TeamProjectsList';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { PageSectionHeader } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/PageSectionHeader';
import { Button } from '@/components/ui/button';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useUser } from '@clerk/nextjs';
import { TeamHeader } from '../components/TeamHeader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Globe, 
  Mail, 
  BarChart3, 
  Settings, 
  Loader2,
  UserPlus,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
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

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <TeamHeader />

      <PageContainer gradientVariant="dashboard">
        <div className="relative">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Client Projects
              </h1>
              <p className="text-sm text-gray-600 dark:text-white/50 mt-1">
                Manage all client websites and configure services
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/team/dashboard/invite">
                  <Button variant="outline" className="rounded-xl h-10 px-4 border-gray-300 dark:border-white/10 hover:border-[var(--purple)] hover:bg-[var(--purple)]/5">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </Link>
              )}
              <Link href="/team/dashboard/new">
                <Button className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white font-medium rounded-xl h-10 px-4">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {[
              { icon: Globe, label: 'Configure Domain', desc: 'Cloudflare DNS', href: '/team/dashboard/domains' },
              { icon: Mail, label: 'Setup Email', desc: 'Zoho Mail', href: '/team/dashboard/email' },
              { icon: BarChart3, label: 'Analytics', desc: 'Google Analytics', href: '/team/dashboard/analytics' },
              { icon: Settings, label: 'Services', desc: 'Integrations', href: '/team/dashboard/services' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 hover:border-[var(--purple)]/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-gray-500 dark:text-white/50" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 dark:text-white/50">{action.desc}</p>
                </div>
              </Link>
            ))}
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
              <TeamProjectsList projects={projects || []} />
            )}
          </div>
        </div>
      </PageContainer>
    </DashboardWrapper>
  );
}
