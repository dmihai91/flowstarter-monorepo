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
  Globe, 
  Mail, 
  BarChart3, 
  Settings, 
  Loader2,
  UserPlus,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Quick action cards - same style as client dashboard
const quickActions = [
  { icon: Globe, label: 'Configure Domain', desc: 'Cloudflare DNS', href: '/team/dashboard/domains' },
  { icon: Mail, label: 'Setup Email', desc: 'Zoho Mail', href: '/team/dashboard/email' },
  { icon: BarChart3, label: 'Analytics', desc: 'Google Analytics', href: '/team/dashboard/analytics' },
  { icon: Settings, label: 'Services', desc: 'Integrations', href: '/team/dashboard/services' },
];

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

        {/* Quick Actions - styled like client dashboard cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="group relative p-5 rounded-2xl transition-all duration-250 ease-out hover:-translate-y-[3px] hover:shadow-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-[var(--purple)]/40"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
                  <action.icon className="h-5 w-5 text-[var(--purple)]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</p>
                  <p className="text-xs text-gray-600 dark:text-white/50 mt-0.5">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
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
