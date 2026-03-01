'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DatabaseOfflineHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface DatabaseStatus {
  isOnline: boolean;
  lastChecked: Date;
  error?: string;
}

export function DatabaseOfflineHandler({
  children,
  fallback,
}: DatabaseOfflineHandlerProps) {
  const { t } = useTranslations();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    isOnline: true,
    lastChecked: new Date(),
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkDatabaseConnection = async () => {
    setIsChecking(true);
    try {
      // Test Supabase connection with a simple query
      const response = await fetch('/api/health/database', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        setDbStatus({
          isOnline: true,
          lastChecked: new Date(),
        });
      } else {
        throw new Error(`Database check failed: ${response.status}`);
      }
    } catch (error) {
      // Log detailed error information for debugging
      console.error('Database connection check failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        endpoint: '/api/health/database',
      });

      setDbStatus({
        isOnline: false,
        lastChecked: new Date(),
        error: 'Connection failed',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check database connection on mount
    checkDatabaseConnection();

    // Set up periodic checks every 30 seconds when offline
    let interval: NodeJS.Timeout;
    if (!dbStatus.isOnline) {
      interval = setInterval(checkDatabaseConnection, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dbStatus.isOnline]);

  // Show fallback when database is offline
  if (!dbStatus.isOnline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Flow lines background */}
        <div className="fixed inset-0 pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.15] dark:opacity-[0.08]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="offlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/55 dark:bg-white/[0.04] backdrop-blur-2xl border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-[var(--purple)]" />
            </div>
          </div>

          {/* Main message */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('database.offline.title')}
            </h1>
            <p className="text-base text-gray-500 dark:text-white/50 max-w-md mx-auto leading-relaxed">
              {t('database.offline.subtitle')}
            </p>
          </div>

          {/* Status Card */}
          <div className="rounded-2xl border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] bg-white/55 dark:bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('database.offline.connectionStatus')}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
                  {t('database.offline.offlineSince', {
                    time: dbStatus.lastChecked.toLocaleTimeString(),
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Retry Button */}
          <Button
            onClick={checkDatabaseConnection}
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
          <div className="rounded-2xl border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] bg-white/55 dark:bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {t('database.offline.whatYouCanDo')}
            </h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-white/50">
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
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/health/database');
      setIsOnline(response.ok);
    } catch (error) {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { isOnline, isChecking, checkStatus };
}
