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
      <div className="min-h-screen bg-white dark:bg-[#0a0a0b] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[hsl(241,93%,61%)]/5 dark:bg-[hsl(241,93%,61%)]/10 blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[hsl(295,61%,65%)]/5 dark:bg-[hsl(295,61%,65%)]/10 blur-3xl animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(211,93%,61%)]/3 dark:bg-[hsl(211,93%,61%)]/5 blur-3xl animate-pulse"
            style={{ animationDelay: '3s' }}
          />
        </div>

        <div className="max-w-2xl w-full space-y-6 relative">
          {/* Icon */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-8 rounded-[24px] bg-gradient-to-br from-[hsl(241,93%,61%)]/10 to-[hsl(295,61%,65%)]/10 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-1 ring-[hsl(241,93%,61%)]/20 dark:ring-[hsl(241,93%,61%)]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(241,93%,61%)]/5 to-[hsl(295,61%,65%)]/5 rounded-[24px] blur-xl"></div>
              <WifiOff className="h-12 w-12 text-[hsl(241,93%,61%)] dark:text-[hsl(241,96%,63%)] relative z-10" />
            </div>
          </div>

          {/* Main message */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {t('database.offline.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              {t('database.offline.subtitle')}
            </p>
          </div>

          {/* Status Alert */}
          <Alert className="backdrop-blur-xl bg-[hsl(241,93%,61%)]/5 dark:bg-[hsl(241,93%,61%)]/10 border-2 border-[hsl(241,93%,61%)]/20 dark:border-[hsl(241,93%,61%)]/30 shadow-lg rounded-[20px]">
            <AlertTriangle className="h-5 w-5 text-[hsl(241,93%,61%)] dark:text-[hsl(241,96%,63%)]" />
            <AlertDescription className="text-gray-900 dark:text-gray-200">
              <strong className="font-semibold">
                {t('database.offline.connectionStatus')}
              </strong>{' '}
              {t('database.offline.offlineSince', {
                time: dbStatus.lastChecked.toLocaleTimeString(),
              })}
              {dbStatus.error && (
                <div className="mt-2 text-sm opacity-80">
                  {t('database.offline.unableToConnect')}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 justify-center">
              <Button
                onClick={checkDatabaseConnection}
                disabled={isChecking}
                variant="default"
                className="w-full h-12 text-white shadow-md rounded-xl transition-all duration-200 font-semibold"
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
            </div>
          </div>

          {/* What you can do */}
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-[#121318]/80 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl rounded-[24px] overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
                {t('database.offline.whatYouCanDo')}
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'hsl(241, 93%, 61%)' }}
                  />
                  <span className="leading-relaxed">
                    {t('database.offline.action1')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'hsl(295, 61%, 65%)' }}
                  />
                  <span className="leading-relaxed">
                    {t('database.offline.action2')}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: 'hsl(211, 93%, 61%)' }}
                  />
                  <span className="leading-relaxed">
                    {t('database.offline.action3')}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
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
