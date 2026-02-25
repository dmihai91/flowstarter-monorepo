'use client';

import { PageContainer } from '@/components/PageContainer';
import FooterCompact from '@/components/FooterCompact';
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

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardWrapper>
      <TeamHeader />

      <PageContainer gradientVariant="dashboard">
        {/* Welcome message + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-gray-500 dark:text-white/50 mb-1">
              {greeting}, <span className="text-gray-700 dark:text-white/70 font-medium">{firstName}</span>
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Team Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/team/dashboard/invite">
                <Button variant="outline" size="lg">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Team
                </Button>
              </Link>
            )}
            <Link href="/team/dashboard/new">
              <Button variant="accent" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <PageSectionHeader
            title="All Projects"
            subtitle="View and manage all client projects"
            className="mb-3"
          />
          
          {projectsLoading ? (
            <ProjectsListSkeleton count={3} />
          ) : (
            <TeamProjectsList projects={projects || []} />
          )}
        </div>
      </PageContainer>

      {/* Footer - full width outside container */}
      <FooterCompact />
    </DashboardWrapper>
  );
}
