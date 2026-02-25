'use client';

import { PageContainer } from '@/components/PageContainer';
import { ProjectsListSkeleton } from '@/app/(dynamic-pages)/(main-pages)/components/ProjectsListSkeleton';
import { TeamProjectsList } from './components/TeamProjectsList';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { PageSectionHeader } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/PageSectionHeader';
import { GlassCard } from '@/components/ui/glass-card';
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
        <GlassCard className="p-6 sm:p-8 relative overflow-hidden">
          {/* Grid pattern background */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]"
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
              className="text-gray-200 dark:text-white/[0.03]"
              fill="url(#team-grid)"
            />
          </svg>

          {/* Page header */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
                className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
              >
                <div className="p-2 rounded-md bg-gray-100 dark:bg-white/5">
                  <action.icon className="w-4 h-4 text-gray-500 dark:text-white/50" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">{action.desc}</p>
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
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
