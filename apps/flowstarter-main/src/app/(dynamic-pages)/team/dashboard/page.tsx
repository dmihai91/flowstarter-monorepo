'use client';

import { TeamProjectsStats } from './components/TeamProjectsStats';
import { ClientRequestsList } from './components/client-requests/ClientRequestsList';
import { DashboardLoader } from './components/DashboardSkeleton';
import { TeamDashboardShell } from './components/TeamDashboardShell';
import { useTranslations } from '@/lib/i18n';
import { useUser } from '@clerk/nextjs';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      if (!user) router.push('/login');
      else setIsLoading(false);
    }
  }, [user, userLoaded, router]);

  if (isLoading || !userLoaded) return <DashboardLoader />;

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greeting.morning')
      : hour < 18
      ? t('dashboard.greeting.afternoon')
      : hour < 21
      ? t('dashboard.greeting.evening')
      : t('dashboard.greeting.night');

  return (
    <TeamDashboardShell
      title="Dashboard"
      subtitle={`${greeting}, ${firstName}`}
    >
      {/* Stats */}
      <div className="mb-8">
        <TeamProjectsStats />
      </div>

      {/* Client Requests */}
      <ClientRequestsList />
    </TeamDashboardShell>
  );
}
