'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  errorDetails?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
  showRetry?: boolean;
}

export function ErrorMessage({
  message,
  onRetry,
  retrying = false,
  className,
  showRetry = true,
}: ErrorMessageProps) {
  const { t } = useTranslations();

  return (
    <div
      className={cn(
        'rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-900 dark:text-red-100 mb-3">
            {message}
          </p>

          {/* Action Button */}
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              disabled={retrying}
              size="sm"
              variant="outline"
              className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              {retrying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {t('error.generation.retrying')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  {t('error.generation.tryAgain')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
