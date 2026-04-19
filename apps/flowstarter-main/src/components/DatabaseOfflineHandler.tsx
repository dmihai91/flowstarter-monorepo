'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DatabaseOfflineHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function DatabaseOfflineHandler({
  children,
  fallback,
}: DatabaseOfflineHandlerProps) {
  const { t } = useTranslations();
  const queryClient = useQueryClient();

  const dbQuery = useQuery({
    queryKey: ['health', 'database'],
    queryFn: async () => {
      const response = await fetch('/api/health/database', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Database check failed: ${response.status}`);
      }
      return { isOnline: true, lastChecked: new Date() };
    },
    // Re-check every 30 seconds when query fails (offline); React Query retries automatically
    refetchInterval: (query) =>
      query.state.status === 'error' ? 30_000 : false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const isOnline = dbQuery.status !== 'error';
  const isChecking = dbQuery.isFetching;
  const lastChecked = dbQuery.data?.lastChecked ?? new Date();

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: ['health', 'database'] });
  };

  // Show fallback when database is offline
  if (!isOnline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-[var(--fs-bg-base)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.08]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient
                id="offlineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <g stroke="url(#offlineGradient)" strokeWidth="1.5">
              <path d="M-100,150 Q200,120 400,180 T800,140 T1300,200" />
              <path d="M-100,300 Q150,340 350,280 T750,340 T1300,300" />
              <path d="M-100,450 Q250,420 450,480 T850,440 T1300,500" />
              <path d="M-100,600 Q180,640 380,580 T780,640 T1300,600" />
            </g>
          </svg>
        </div>

        <div className="max-w-lg w-full space-y-8 relative">
          {/* Icon */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl flex items-center justify-center" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
              <WifiOff className="h-10 w-10 text-[var(--purple)]" />
            </div>
          </div>

          {/* Main message */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--fs-ink)]">
              {t('database.offline.title')}
            </h1>
            <p className="text-base text-[var(--fs-ink-faint)] max-w-md mx-auto leading-relaxed">
              {t('database.offline.subtitle')}
            </p>
          </div>

          {/* Status Card */}
          <div className="rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl p-5" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-[var(--fs-ink)] text-sm">
                  {t('database.offline.connectionStatus')}
                </p>
                <p className="text-sm text-[var(--fs-ink-faint)] mt-0.5">
                  {t('database.offline.offlineSince', {
                    time: lastChecked.toLocaleTimeString(),
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Retry Button */}
          <Button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-[var(--purple)]/20 hover:shadow-[var(--purple)]/30 transition-all"
            size="lg"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                {t('database.offline.checkingConnection')}
              </>
            ) : (
              <>
                <Wifi className="h-5 w-5 mr-2" />
                {t('database.offline.retryConnection')}
              </>
            )}
          </Button>

          {/* What you can do */}
          <div className="rounded-[var(--fs-radius-2xl)] border p-6 backdrop-blur-2xl backdrop-saturate-150" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
            <h3 className="text-sm font-semibold text-[var(--fs-ink)] mb-4">
              {t('database.offline.whatYouCanDo')}
            </h3>
            <ul className="space-y-3 text-sm text-[var(--fs-ink-faint)]">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-[var(--purple)]" />
                <span className="leading-relaxed">
                  {t('database.offline.action1')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-blue-500" />
                <span className="leading-relaxed">
                  {t('database.offline.action2')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-cyan-500" />
                <span className="leading-relaxed">
                  {t('database.offline.action3')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Database is online, render children
  return <>{children}</>;
}

// Hook for checking database status in components
export function useDatabaseStatus() {
  const dbQuery = useQuery({
    queryKey: ['health', 'database'],
    queryFn: async () => {
      const response = await fetch('/api/health/database');
      if (!response.ok) throw new Error('offline');
      return { isOnline: true };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  return {
    isOnline: dbQuery.status !== 'error',
    isChecking: dbQuery.isFetching,
    checkStatus: () => dbQuery.refetch(),
  };
}
