'use client';

import { GlassCard } from '@/components/ui/glass-card';
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
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
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

      <GlassCard className="p-6 sm:p-8">
        {children}
      </GlassCard>
    </div>
  );
}
