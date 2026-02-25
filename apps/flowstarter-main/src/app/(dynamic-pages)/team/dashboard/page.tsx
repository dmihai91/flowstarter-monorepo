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
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111113] p-6 sm:p-8 relative overflow-hidden shadow-sm">
          {/* Grid pattern background */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-30 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_top,white,transparent_60%)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="team-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M32 0H0V32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              className="text-gray-300 dark:text-white/10"
              fill="url(#team-grid)"
            />
          </svg>

          {/* Page header */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Globe, label: 'Configure Domain', desc: 'Cloudflare DNS', href: '/team/dashboard/domains' },
              { icon: Mail, label: 'Setup Email', desc: 'Zoho Mail', href: '/team/dashboard/email' },
              { icon: BarChart3, label: 'Analytics', desc: 'Google Analytics', href: '/team/dashboard/analytics' },
              { icon: Settings, label: 'Services', desc: 'Integrations', href: '/team/dashboard/services' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-[var(--purple)]/50 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
              >
                <div className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                  <action.icon className="w-4 h-4 text-gray-600 dark:text-white/60" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6 z-10">
            <div className="flex-grow border-t border-gray-200/60 dark:border-white/10"></div>
          </div>

          {/* Projects */}
          <div className="relative mb-8">
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
