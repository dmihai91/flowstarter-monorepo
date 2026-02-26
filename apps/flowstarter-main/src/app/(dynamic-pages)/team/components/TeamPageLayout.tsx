'use client';

import { PageContainer } from '@/components/PageContainer';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { TeamHeader } from './TeamHeader';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TeamPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export function TeamPageLayout({
  children,
  title,
  subtitle,
  icon,
  showBackButton = true,
  backHref = '/team/dashboard',
}: TeamPageLayoutProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
        <GlassCard className="p-6 sm:p-8">
          {/* Back button */}
          {showBackButton && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          )}

          {/* Page header */}
          {(title || icon) && (
            <div className="flex items-center gap-4 mb-8">
              {icon && (
                <div className="p-3 rounded-xl bg-[var(--purple)]/10 text-[var(--purple)]">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {children}
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
